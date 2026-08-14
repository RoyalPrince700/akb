const {
  createMailtrapTransport,
  getFromAddress,
} = require("./mailtrapconfig");
const {
  buildPasswordResetEmailTemplate,
  buildSurveyEmailTemplate,
} = require("./emailtemplate");

const sendSurveyEmail = async ({ dispatch, interaction }) => {
  if (!dispatch.customerEmail) {
    const error = new Error("Customer email is required to send survey email");
    error.statusCode = 400;
    throw error;
  }

  const transporter = createMailtrapTransport();
  const csrName = interaction?.owner?.csrDisplayName || interaction?.owner?.name;
  const template = buildSurveyEmailTemplate({
    customerName: dispatch.customerName,
    csrName,
    message: dispatch.message,
    surveyUrl: dispatch.surveyUrl,
  });

  return transporter.sendMail({
    from: getFromAddress(),
    to: dispatch.customerEmail,
    replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM_EMAIL,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
};

const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  if (!email) {
    const error = new Error("Email is required to send a password reset link");
    error.statusCode = 400;
    throw error;
  }

  const transporter = createMailtrapTransport();
  const template = buildPasswordResetEmailTemplate({ name, resetUrl });

  return transporter.sendMail({
    from: getFromAddress(),
    to: email,
    replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM_EMAIL,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendSurveyEmail,
};
