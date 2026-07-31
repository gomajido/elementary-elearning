import nodemailer from "nodemailer";

/** Mailpit locally, a real SMTP relay or SES's SMTP interface in prod — same code either way. */
function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
}

export async function sendEmail(to: string, subject: string, text: string) {
  const transport = getTransport();
  await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
}
