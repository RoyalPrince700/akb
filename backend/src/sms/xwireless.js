const normalizePhoneNumber = (value = "") => value.replace(/\D/g, "");

const formatPhoneForSms = (phoneNumber = "") => {
  let digits = normalizePhoneNumber(phoneNumber);

  if (!digits) {
    return "";
  }

  if (digits.startsWith("0")) {
    return `234${digits.slice(1)}`;
  }

  if (!digits.startsWith("234") && digits.length === 10) {
    return `234${digits}`;
  }

  return digits;
};

const buildSurveyMessage = (dispatch) => {
  const customMessage = dispatch?.message?.trim();

  if (customMessage) {
    return `${customMessage}\n\n${dispatch.surveyUrl}`;
  }

  return `Thank you for speaking with Accessible Publishers Ltd. Kindly complete this short survey about your recent support experience.\n\n${dispatch.surveyUrl}`;
};

const getSmsConfig = () => {
  const apiKey = process.env.SMS_API_KEY;
  const clientId = process.env.SMS_CLIENT_ID;
  const senderId = process.env.SENDER_ID;
  const baseUrl = (process.env.SMS_BASE_URL || "http://157.180.57.237").replace(/\/$/, "");

  return { apiKey, clientId, senderId, baseUrl };
};

const pickField = (object, ...keys) => {
  for (const key of keys) {
    if (object?.[key] !== undefined && object?.[key] !== null) {
      return object[key];
    }
  }

  return undefined;
};

const normalizeSmsResponse = (result = {}) => {
  const errorCode = pickField(result, "errorCode", "ErrorCode");
  const errorDescription = pickField(result, "errorDescription", "ErrorDescription");
  const data = pickField(result, "data", "Data");
  const entries = Array.isArray(data) ? data : data ? [data] : [];

  const messageResults = entries.map((entry) => ({
    mobileNumber: pickField(entry, "mobileNumber", "MobileNumber"),
    messageId: pickField(entry, "messageId", "MessageId"),
    messageErrorCode: pickField(entry, "messageErrorCode", "MessageErrorCode"),
    messageErrorDescription: pickField(
      entry,
      "messageErrorDescription",
      "MessageErrorDescription"
    ),
  }));

  const failedEntry = messageResults.find(
    (entry) =>
      entry.messageErrorCode !== undefined &&
      entry.messageErrorCode !== null &&
      Number(entry.messageErrorCode) !== 0
  );

  return {
    errorCode,
    errorDescription,
    messageResults,
    failedEntry,
    messageId: messageResults[0]?.messageId || null,
  };
};

const logSmsEvent = (level, message, details = {}) => {
  const payload = {
    at: new Date().toISOString(),
    ...details,
  };

  if (level === "error") {
    console.error(`[sms] ${message}`, payload);
    return;
  }

  console.log(`[sms] ${message}`, payload);
};

const sendSurveySms = async ({ dispatch }) => {
  const { apiKey, clientId, senderId, baseUrl } = getSmsConfig();

  if (!apiKey || !clientId) {
    const error = new Error("SMS provider credentials are not configured");
    error.statusCode = 500;
    throw error;
  }

  if (!senderId) {
    const error = new Error("SENDER_ID is not configured for SMS sends");
    error.statusCode = 500;
    throw error;
  }

  const mobileNumbers = formatPhoneForSms(dispatch.customerPhoneNumber);

  if (!mobileNumbers) {
    const error = new Error("Customer phone number is required to send survey SMS");
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    apiKey,
    clientId,
    senderId,
    message: buildSurveyMessage(dispatch),
    mobileNumbers,
    coRelator: dispatch._id?.toString() || dispatch.token,
  };

  if (process.env.SMS_SERVICE_ID) {
    payload.serviceId = process.env.SMS_SERVICE_ID;
  }

  if (process.env.SMS_TEMPLATE_ID) {
    payload.templateId = process.env.SMS_TEMPLATE_ID;
  }

  logSmsEvent("info", "Sending survey SMS", {
    dispatchId: dispatch._id?.toString(),
    to: mobileNumbers,
    senderId,
    endpoint: `${baseUrl}/api/v3/SendSMS`,
  });

  const response = await fetch(`${baseUrl}/api/v3/SendSMS`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let rawResult = {};

  try {
    rawResult = await response.json();
  } catch {
    const error = new Error("SMS provider returned an invalid response");
    error.statusCode = 502;
    logSmsEvent("error", "Invalid JSON response from SMS provider", {
      httpStatus: response.status,
    });
    throw error;
  }

  const result = normalizeSmsResponse(rawResult);

  logSmsEvent(response.ok ? "info" : "error", "SMS provider response", {
    httpStatus: response.status,
    errorCode: result.errorCode,
    errorDescription: result.errorDescription,
    messageResults: result.messageResults,
    rawResult,
  });

  if (!response.ok) {
    const error = new Error(
      result.errorDescription || `SMS provider request failed (${response.status})`
    );
    error.statusCode = response.status === 401 ? 401 : 502;
    throw error;
  }

  if (result.errorCode !== undefined && Number(result.errorCode) !== 0) {
    const error = new Error(
      result.errorDescription || `SMS send failed (error code ${result.errorCode})`
    );
    error.statusCode = 502;
    throw error;
  }

  if (result.failedEntry) {
    const error = new Error(
      result.failedEntry.messageErrorDescription ||
        `SMS send failed for ${result.failedEntry.mobileNumber || mobileNumbers}`
    );
    error.statusCode = 502;
    throw error;
  }

  return {
    messageId: result.messageId,
    sent: true,
    providerResponse: rawResult,
  };
};

module.exports = {
  buildSurveyMessage,
  formatPhoneForSms,
  normalizeSmsResponse,
  sendSurveySms,
};
