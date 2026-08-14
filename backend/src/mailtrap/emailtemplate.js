const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildSurveyEmailTemplate = ({
  customerName,
  csrName,
  message,
  surveyUrl,
}) => {
  const subject = "Accessible Publishers Customer Survey";
  const greetingName = customerName || "Customer";
  const intro =
    message ||
    "Thank you for speaking with Accessible Publishers Ltd. Kindly complete this short survey about your recent support experience.";
  const senderLine = csrName
    ? `This survey was triggered by ${csrName} after your CRM ticket was submitted.`
    : "This survey was triggered after your CRM ticket was submitted.";

  const text = [
    `Hello ${greetingName},`,
    "",
    intro,
    "",
    senderLine,
    "",
    `Survey link: ${surveyUrl}`,
    "",
    "Thank you,",
    "Accessible Publishers Ltd",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <p>Hello ${escapeHtml(greetingName)},</p>
      <p>${escapeHtml(intro)}</p>
      <p>${escapeHtml(senderLine)}</p>
      <p>
        <a href="${escapeHtml(surveyUrl)}" style="display: inline-block; background: #047857; color: #ffffff; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 700;">
          Complete customer survey
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${escapeHtml(surveyUrl)}">${escapeHtml(surveyUrl)}</a></p>
      <p>Thank you,<br />Accessible Publishers Ltd</p>
    </div>
  `;

  return {
    html,
    subject,
    text,
  };
};

const buildPasswordResetEmailTemplate = ({ name, resetUrl }) => {
  const greetingName = name || "there";
  const subject = "Reset your AKH password";
  const text = [
    `Hello ${greetingName},`,
    "",
    "We received a request to reset the password for your Accessible Knowledge Base account.",
    "",
    "Use this link to choose a new password. It expires in 1 hour:",
    resetUrl,
    "",
    "If you did not request this, you can ignore this email. Your password will stay the same.",
    "",
    "Thank you,",
    "Accessible Publishers Ltd",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <p>Hello ${escapeHtml(greetingName)},</p>
      <p>We received a request to reset the password for your Accessible Knowledge Base account.</p>
      <p>
        <a href="${escapeHtml(resetUrl)}" style="display: inline-block; background: #1d4ed8; color: #ffffff; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 700;">
          Reset password
        </a>
      </p>
      <p>This link expires in 1 hour. If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></p>
      <p>If you did not request this, you can ignore this email. Your password will stay the same.</p>
      <p>Thank you,<br />Accessible Publishers Ltd</p>
    </div>
  `;

  return {
    html,
    subject,
    text,
  };
};

module.exports = {
  buildPasswordResetEmailTemplate,
  buildSurveyEmailTemplate,
};
