function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escape(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;">
            <tr>
              <td align="center" style="padding:0 0 24px 0;">
                <span style="display:inline-block;background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);color:#ffffff;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">MediFlow</span>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:16px;box-shadow:0 6px 24px rgba(15,23,42,0.08);overflow:hidden;">
                ${body}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 0 0 0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:18px;">
                  MediFlow Connect &middot; Healthcare workflow, secured.<br/>
                  This is an automated message. Please do not reply.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function otpEmail(
  otp: string,
  purpose: "signup" | "login",
  brand = "MedFlow"
): { subject: string; html: string; text: string } {
  const safeOtp = escape(otp);
  const isSignup = purpose === "signup";
  const headline = isSignup ? "Verify your email" : "Your sign-in code";
  const subhead = isSignup ? `Welcome to ${brand}` : "Sign-in request";
  const description = isSignup
    ? `Use the verification code below to complete your ${escape(brand)} account setup and start using the platform.`
    : `We received a sign-in request for your ${escape(brand)} account. Enter the code below to continue.`;
  const hint = "Enter this 6-digit code in the app to continue.";
  const ignore = isSignup
    ? "If you didn't create a MedFlow account, you can safely ignore this email."
    : "If you didn't try to sign in, you can safely ignore this email — your account is still secure.";
  const subject = isSignup
    ? `Verify your ${brand} email`
    : `Your ${brand} sign-in code`;

  const html = layout(
    subject,
    `
      <tr>
        <td style="background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.2px;">${escape(brand)}</h1>
          <p style="margin:8px 0 0 0;color:#e0e7ff;font-size:14px;">${escape(subhead)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px 40px 40px;">
          <h2 style="margin:0 0 12px 0;color:#0f172a;font-size:20px;font-weight:600;">${escape(headline)}</h2>
          <p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:22px;">${description}</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background:linear-gradient(135deg,#eff6ff 0%,#f5f3ff 100%);border:1px solid #c7d2fe;border-radius:12px;padding:28px 16px;text-align:center;">
                <p style="margin:0 0 14px 0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1.8px;font-weight:700;">Your verification code</p>
                <p style="margin:0 auto;display:inline-block;padding:14px 22px;background:#ffffff;border:1px dashed #c7d2fe;border-radius:10px;color:#1e293b;font-size:32px;font-weight:700;font-family:'SF Mono',Menlo,Consolas,monospace;letter-spacing:10px;">${safeOtp}</p>
                <p style="margin:14px 0 0 0;color:#94a3b8;font-size:12px;">${escape(hint)}</p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0 0;color:#475569;font-size:14px;line-height:20px;">
            This code expires in <strong>10 minutes</strong>. ${escape(ignore)}
          </p>
        </td>
      </tr>
    `
  );

  const text =
    `${headline}\n\n` +
    `${description}\n\n` +
    `Your verification code:  ${otp}\n\n` +
    `${hint}\n` +
    `This code expires in 10 minutes. ${ignore}\n\n` +
    `— ${brand} Connect`;

  return { subject, html, text };
}
