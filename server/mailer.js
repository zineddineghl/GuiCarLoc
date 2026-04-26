const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOTPEmail(to, code) {
  if (!process.env.SMTP_USER) {
    // Dev mode: print to console instead of sending real email
    console.log(`\n[2FA DEV] Code for ${to}: ${code}\n`);
    return;
  }

  console.log(`[2FA] Sending code to ${to}...`);
  try {
    const info = await transporter.sendMail({
      from: `"GuiCarLoc" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Votre code de connexion GuiCarLoc',
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#1e40af;margin-bottom:8px;">GuiCarLoc</h2>
          <p style="color:#374151;margin-bottom:4px;">Votre code de connexion :</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1e40af;background:#eff6ff;border-radius:8px;padding:16px 24px;display:inline-block;margin:12px 0;">${code}</div>
          <p style="color:#6b7280;font-size:14px;margin-top:16px;">Ce code expire dans <strong>10 minutes</strong>. Ne le communiquez à personne.</p>
        </div>
      `,
    });
    console.log(`[2FA] Email sent: ${info.messageId}`);
  } catch (err) {
    console.error(`[2FA] Failed to send email:`, err.message);
    throw err;
  }
}

module.exports = { sendOTPEmail };
