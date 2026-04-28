const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'GuiCarLoc <onboarding@resend.dev>';

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[EMAIL DEV] To: ${to} | Subject: ${subject}\n`);
    return;
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) throw error;
    console.log(`[EMAIL] Sent to ${to}: ${data?.id}`);
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err.message);
  }
}

async function sendOTPEmail(to, code) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[2FA DEV] Code for ${to}: ${code}\n`);
    return;
  }
  console.log(`[2FA] Sending code to ${to}...`);
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
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
    if (error) throw error;
    console.log(`[2FA] Email sent: ${data?.id}`);
  } catch (err) {
    console.error(`[2FA] Failed to send email:`, err.message);
    throw err;
  }
}

async function sendVerificationEmail(to, code) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[VERIFY DEV] Code for ${to}: ${code}\n`);
    return;
  }
  console.log(`[VERIFY] Sending code to ${to}...`);
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: 'Confirmez votre adresse email — GuiCarLoc',
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#1e40af;margin-bottom:8px;">GuiCarLoc</h2>
          <p style="color:#374151;margin-bottom:4px;">Votre code de vérification :</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1e40af;background:#eff6ff;border-radius:8px;padding:16px 24px;display:inline-block;margin:12px 0;">${code}</div>
          <p style="color:#6b7280;font-size:14px;margin-top:16px;">Ce code expire dans <strong>10 minutes</strong>. Ne le communiquez à personne.</p>
        </div>
      `,
    });
    if (error) throw error;
    console.log(`[VERIFY] Email sent: ${data?.id}`);
  } catch (err) {
    console.error(`[VERIFY] Failed to send email:`, err.message);
    throw err;
  }
}

async function sendPasswordResetEmail({ to, name, resetLink }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[RESET DEV] Reset link for ${to}:\n${resetLink}\n`);
    return;
  }
  console.log(`[RESET] Sending reset link to ${to}...`);
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: 'Réinitialisation de votre mot de passe — GuiCarLoc',
      html: baseTemplate(`
        <p style="color:#374151;">Bonjour <strong>${name}</strong>,</p>
        <p style="color:#374151;">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${resetLink}" style="background:#1e40af;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color:#6b7280;font-size:13px;">Ce lien expire dans <strong>30 minutes</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        <p style="color:#6b7280;font-size:12px;word-break:break-all;">Ou copiez ce lien : ${resetLink}</p>
      `),
    });
    if (error) throw error;
    console.log(`[RESET] Email sent: ${data?.id}`);
  } catch (err) {
    console.error(`[RESET] Failed to send email:`, err.message);
    throw err;
  }
}

function baseTemplate(content) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
      <h2 style="color:#1e40af;margin-bottom:20px;">GuiCarLoc</h2>
      ${content}
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;">
        GuiCarLoc — La plateforme de location entre particuliers
      </p>
    </div>
  `;
}

async function sendNewBookingEmail({ to, ownerName, renterName, carTitle, startDate, endDate, totalPrice }) {
  const subject = `Nouvelle demande de réservation — ${carTitle}`;
  const html = baseTemplate(`
    <p style="color:#374151;">Bonjour <strong>${ownerName}</strong>,</p>
    <p style="color:#374151;"><strong>${renterName}</strong> souhaite louer votre voiture :</p>
    <div style="background:#eff6ff;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;color:#1e40af;font-weight:bold;font-size:16px;">${carTitle}</p>
      <p style="margin:4px 0;color:#374151;">Du <strong>${startDate}</strong> au <strong>${endDate}</strong></p>
      <p style="margin:4px 0;color:#374151;">Total : <strong>${totalPrice} GNF</strong></p>
    </div>
    <p style="color:#374151;">Connectez-vous sur GuiCarLoc pour accepter ou refuser cette demande.</p>
  `);
  await sendEmail({ to, subject, html });
}

async function sendBookingConfirmedEmail({ to, renterName, carTitle, startDate, endDate, totalPrice }) {
  const subject = `Réservation confirmée — ${carTitle}`;
  const html = baseTemplate(`
    <p style="color:#374151;">Bonjour <strong>${renterName}</strong>,</p>
    <p style="color:#16a34a;font-weight:bold;font-size:16px;">Votre réservation a été confirmée !</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;color:#15803d;font-weight:bold;font-size:16px;">${carTitle}</p>
      <p style="margin:4px 0;color:#374151;">Du <strong>${startDate}</strong> au <strong>${endDate}</strong></p>
      <p style="margin:4px 0;color:#374151;">Total : <strong>${totalPrice} GNF</strong></p>
    </div>
    <p style="color:#374151;">Bonne route ! Vous pouvez contacter le propriétaire via la messagerie GuiCarLoc.</p>
  `);
  await sendEmail({ to, subject, html });
}

async function sendBookingRejectedEmail({ to, renterName, carTitle, startDate, endDate }) {
  const subject = `Demande de réservation refusée — ${carTitle}`;
  const html = baseTemplate(`
    <p style="color:#374151;">Bonjour <strong>${renterName}</strong>,</p>
    <p style="color:#dc2626;font-weight:bold;font-size:16px;">Votre demande de réservation a été refusée.</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;color:#991b1b;font-weight:bold;">${carTitle}</p>
      <p style="margin:4px 0;color:#374151;">Du <strong>${startDate}</strong> au <strong>${endDate}</strong></p>
    </div>
    <p style="color:#374151;">Ne vous découragez pas ! D'autres voitures sont disponibles sur GuiCarLoc.</p>
  `);
  await sendEmail({ to, subject, html });
}

module.exports = { sendOTPEmail, sendVerificationEmail, sendNewBookingEmail, sendBookingConfirmedEmail, sendBookingRejectedEmail, sendPasswordResetEmail };
