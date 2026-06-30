const nodemailer = require("nodemailer");

const requiredSmtpKeys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];

const getSmtpConfig = () => {
  const missingKeys = requiredSmtpKeys.filter((key) => !process.env[key]);

  if (missingKeys.length) {
    const error = new Error(
      `Missing SMTP configuration: ${missingKeys.join(", ")}`
    );
    error.statusCode = 500;
    throw error;
  }

  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };
};

const getFromAddress = () => {
  const fromName = process.env.SMTP_FROM_NAME || "Accessible Publishers CRM";
  const fromEmail =
    process.env.SMTP_FROM_EMAIL || "crm@accessiblepublishers.local";

  return `"${fromName}" <${fromEmail}>`;
};

const createMailtrapTransport = () => nodemailer.createTransport(getSmtpConfig());

module.exports = {
  createMailtrapTransport,
  getFromAddress,
};
