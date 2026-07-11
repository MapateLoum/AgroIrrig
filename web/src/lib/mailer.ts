import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "GMAIL_USER et GMAIL_APP_PASSWORD doivent être configurés dans .env (voir README pour créer un mot de passe d'application Gmail)"
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return transporter;
}

const BRAND = {
  name: "AgroIrrig Sénégal",
  color: "#1e3350",
  accent: "#d9a441",
};

function wrapTemplate(title: string, bodyHtml: string): string {
  return `
  <div style="font-family:Arial,sans-serif;background:#fbf7ee;padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4d9c4;">
      <div style="background:${BRAND.color};padding:20px 28px;">
        <span style="color:#fff;font-size:18px;font-weight:700;">${BRAND.name}</span>
      </div>
      <div style="padding:28px;color:#241f1c;">
        <h2 style="margin:0 0 14px;font-size:19px;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px;background:#f2e8d5;color:#6b6258;font-size:12px;">
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </div>
    </div>
  </div>`;
}

export async function sendOtpEmail(to: string, code: string, purpose: "verification" | "reset") {
  const title = purpose === "verification" ? "Vérifie ton adresse email" : "Réinitialisation de mot de passe";
  const intro =
    purpose === "verification"
      ? "Merci de t'être inscrit sur AgroIrrig Sénégal. Utilise le code ci-dessous pour vérifier ton adresse email :"
      : "Tu as demandé à réinitialiser ton mot de passe. Utilise le code ci-dessous pour continuer :";

  const html = wrapTemplate(
    title,
    `
      <p style="font-size:14px;line-height:1.6;">${intro}</p>
      <div style="text-align:center;margin:26px 0;">
        <span style="display:inline-block;background:#f2e8d5;color:${BRAND.color};font-family:'Courier New',monospace;font-size:30px;font-weight:700;letter-spacing:8px;padding:14px 22px;border-radius:8px;">${code}</span>
      </div>
      <p style="font-size:13px;color:#6b6258;">Ce code expire dans 10 minutes. Si tu n'es pas à l'origine de cette demande, ignore simplement cet email.</p>
    `
  );

  await getTransporter().sendMail({
    from: `"${BRAND.name}" <${process.env.GMAIL_USER}>`,
    to,
    subject: purpose === "verification" ? "Ton code de vérification" : "Ton code de réinitialisation",
    html,
  });
}
