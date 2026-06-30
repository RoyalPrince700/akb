const normalizePhoneNumber = (value = "") => value.replace(/\D/g, "");

export const buildSurveyMessage = (dispatch) => {
  const customMessage = dispatch?.message?.trim();

  if (customMessage) {
    return `${customMessage}\n\n${dispatch.surveyUrl}`;
  }

  return `Thank you for speaking with Accessible Publishers Ltd. Kindly complete this short survey about your recent support experience.\n\n${dispatch.surveyUrl}`;
};

export const handleSurveyDispatchShare = async (dispatch) => {
  if (!dispatch?.surveyUrl) {
    return;
  }

  try {
    await navigator.clipboard.writeText(dispatch.surveyUrl);
  } catch {
    // Ignore clipboard failures and continue with channel-specific actions.
  }

  const message = encodeURIComponent(buildSurveyMessage(dispatch));
  const phoneNumber = normalizePhoneNumber(dispatch.customerPhoneNumber);
  const email = encodeURIComponent(dispatch.customerEmail || "");
  const subject = encodeURIComponent("Accessible Publishers Customer Survey");

  if (dispatch.channel === "WhatsApp" && phoneNumber) {
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank", "noopener,noreferrer");
    return;
  }

  if (dispatch.channel === "SMS" && phoneNumber) {
    window.open(`sms:${phoneNumber}?body=${message}`, "_self");
    return;
  }

  if (dispatch.channel === "Email") {
    const recipient = dispatch.customerEmail ? dispatch.customerEmail : "";
    window.open(`mailto:${recipient}?subject=${subject}&body=${message}`, "_self");
  }
};
