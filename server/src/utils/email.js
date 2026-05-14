import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const brandColor = '#0EA5E9';

const emailBase = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SOS DIGITAL</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Poppins',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,${brandColor},#0369A1);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">SOS DIGITAL</h1>
      <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">Facturation & Gestion Commerciale</p>
    </div>
    <div style="padding:40px;">
      ${content}
    </div>
    <div style="background:#f1f5f9;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">SOS DIGITAL — Tous droits réservés © ${new Date().getFullYear()}</p>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Tél: +237 653 522 435</p>
    </div>
  </div>
</body>
</html>`;

export const sendReminderEmail = async (invoice, type) => {
  const days = type === 'day7' ? 7 : 14;
  const subject = type === 'day7'
    ? `Rappel de paiement — Facture ${invoice.number}`
    : `⚠️ Rappel urgent — Facture ${invoice.number} en retard de ${days} jours`;

  const content = `
    <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px;">Rappel de paiement</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">Bonjour <strong>${invoice.client.name}</strong>,</p>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Nous vous contactons concernant la facture <strong style="color:${brandColor};">${invoice.number}</strong>
      d'un montant de <strong>${invoice.total.toLocaleString('fr-FR')} ${invoice.currency}</strong>,
      dont le règlement est en attente depuis ${days} jours.
    </p>
    <div style="background:#f0f9ff;border-left:4px solid ${brandColor};padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;color:#0369a1;font-size:14px;font-weight:600;">Facture: ${invoice.number}</p>
      <p style="margin:4px 0 0;color:#0369a1;font-size:14px;">Montant dû: ${invoice.total.toLocaleString('fr-FR')} ${invoice.currency}</p>
      ${invoice.dueDate ? `<p style="margin:4px 0 0;color:#dc2626;font-size:14px;">Échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>` : ''}
    </div>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Merci de procéder au règlement dans les meilleurs délais ou de nous contacter si vous avez des questions.
    </p>
    <p style="color:#475569;font-size:15px;margin-top:24px;">Cordialement,<br><strong>L'équipe SOS DIGITAL</strong></p>`;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: invoice.client.email,
    subject,
    html: emailBase(content),
  });
};

export const sendInvoiceEmail = async (invoice, recipientEmail, recipientName) => {
  const content = `
    <h2 style="color:#0f172a;font-size:22px;margin:0 0 16px;">Nouvelle facture</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">Bonjour <strong>${recipientName}</strong>,</p>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Veuillez trouver ci-joint votre facture <strong style="color:${brandColor};">${invoice.number}</strong>
      pour un montant total de <strong>${invoice.total.toLocaleString('fr-FR')} ${invoice.currency}</strong>.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="#" style="display:inline-block;background:linear-gradient(135deg,${brandColor},#0369A1);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Voir la facture
      </a>
    </div>
    <p style="color:#475569;font-size:15px;">Cordialement,<br><strong>L'équipe SOS DIGITAL</strong></p>`;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: recipientEmail,
    subject: `Facture SOS DIGITAL #${invoice.number}`,
    html: emailBase(content),
  });
};
