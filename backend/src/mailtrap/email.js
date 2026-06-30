const {
  createMailtrapTransport,
  getFromAddress,
} = require("./mailtrapconfig");
const { buildSurveyEmailTemplate } = require("./emailtemplate");

const sendSurveyEmail = async ({ dispatch, interaction }) => {
  if (!dispatch.customerEmail) {
    const error = new Error("Customer email is required to send survey email");
    error.statusCode = 400;
    throw error;
  }

  const transporter = createMailtrapTransport();
  const template = buildSurveyEmailTemplate({
    customerName: dispatch.customerName,
    csrName: interaction?.owner?.name,
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

module.exports = {
  sendSurveyEmail,
};
