/** Table layout and inline styles keep the verification email readable in email clients. */
export function verificationEmail(code: string, scope: "candidate" | "employer") {
  if (!/^\d{6}$/.test(code)) throw new Error("Verification emails require a six-digit code.");
  const account = scope === "employer" ? "employer" : "candidate";
  const text = `Your ATSAI verification code is ${code}. It expires in 10 minutes.

Enter this code on the ATSAI page you already have open to verify your ${account} email address.

Keep this code private. ATSAI will never ask you to share it by phone, email or message.
If you did not request this code, you can safely ignore this email.

Need help? Contact contact@atsai.pro
ATSAI Talent Solutions | https://www.atsai.pro`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>Verify your email | ATSAI</title></head>
<body style="margin:0;padding:0;background-color:#f3f6fa;color:#12253b;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;color:#f3f6fa;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Verify your ATSAI email address. Your verification code expires in 10 minutes.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f6fa;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;">
<tr><td style="padding:0 8px 20px;"><a href="https://www.atsai.pro" style="text-decoration:none;color:#102136;font-size:26px;font-weight:700;letter-spacing:-1px;">ATS<span style="color:#315fe7;">AI</span><span style="color:#58c8d5;">.</span></a><br><span style="font-size:9px;line-height:20px;letter-spacing:2px;color:#536985;">TALENT SOLUTIONS</span></td></tr>
<tr><td style="background-color:#ffffff;border:1px solid #dfe7f1;border-radius:16px;overflow:hidden;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td style="height:4px;background-color:#315fe7;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:30px 28px;background-color:#102136;border-radius:12px 12px 0 0;"><p style="margin:0 0 12px;color:#76d7e2;font-size:10px;line-height:16px;letter-spacing:2px;font-weight:700;">YOUR ACCOUNT, WITH CONFIDENCE</p><h1 style="margin:0;color:#ffffff;font-size:28px;line-height:36px;letter-spacing:-0.5px;">Verify your email address.</h1></td></tr>
<tr><td style="padding:30px 28px 28px;"><p style="margin:0 0 22px;color:#536985;font-size:15px;line-height:25px;">You are one step away. Enter the code below on the ATSAI page you already have open to verify your ${account} email address.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f0f4ff;border:1px solid #dbe4ff;border-radius:10px;"><tr><td align="center" style="padding:22px 8px;"><p style="margin:0 0 12px;color:#31518b;font-size:10px;line-height:16px;letter-spacing:1.5px;font-weight:700;">YOUR VERIFICATION CODE</p><p style="margin:0;color:#183e93;font-family:'Courier New',Courier,monospace;font-size:34px;line-height:44px;font-weight:700;letter-spacing:6px;white-space:nowrap;">${code}</p><p style="margin:10px 0 0;color:#536985;font-size:12px;line-height:20px;">Expires in <strong style="color:#173354;">10 minutes</strong></p></td></tr></table>
<p style="margin:24px 0 0;color:#173354;font-size:13px;line-height:22px;font-weight:700;">Keep this code private.</p><p style="margin:4px 0 0;color:#536985;font-size:13px;line-height:22px;">ATSAI will never ask you to share it by phone, email or message. If you did not request this code, you can safely ignore this email.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding-top:24px;"><div style="height:1px;background-color:#e4eaf2;line-height:1px;font-size:1px;">&nbsp;</div><p style="margin:20px 0 0;color:#536985;font-size:12px;line-height:22px;">Need a hand? <a href="mailto:contact@atsai.pro" style="color:#2455c8;text-decoration:underline;">Contact our team</a></p></td></tr></table>
</td></tr></table></td></tr>
<tr><td align="center" style="padding:22px 16px 0;"><p style="margin:0;color:#536985;font-size:11px;line-height:20px;">ATSAI Talent Solutions<br><a href="https://www.atsai.pro" style="color:#31518b;text-decoration:underline;">www.atsai.pro</a></p><p style="margin:10px 0 0;color:#667a92;font-size:11px;line-height:18px;">This is an automated email for your account verification.</p></td></tr>
</table></td></tr></table></body></html>`;
  return { subject: "Verify your email address | ATSAI", text, html };
}