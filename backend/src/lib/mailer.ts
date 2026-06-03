import nodemailer, { type Transporter } from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 465);
const secure = (process.env.SMTP_SECURE ?? "true").toLowerCase() === "true";
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

export const smtpConfigured = Boolean(host && user && pass);

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return transporter;
}

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(args: SendArgs): Promise<void> {
  const from = process.env.SMTP_FROM || user;
  if (!smtpConfigured) {
    console.warn(
      `[mail] SMTP not configured — would have sent "${args.subject}" to ${args.to}`
    );
    return;
  }
  const t = getTransporter();
  await t.sendMail({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
}
