import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mailer";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute entre deux envois

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 chiffres
}

export type OtpType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

/** Crée un nouveau code, invalide les anciens non utilisés, et l'envoie par email. */
export async function issueOtp(userId: string, email: string, type: OtpType) {
  const recent = await prisma.otpCode.findFirst({
    where: { userId, type, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000);
    throw new Error(`Merci d'attendre ${waitSec}s avant de redemander un code`);
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  // Invalider les anciens codes non utilisés du même type
  await prisma.otpCode.updateMany({
    where: { userId, type, used: false },
    data: { used: true },
  });

  await prisma.otpCode.create({
    data: {
      userId,
      code: codeHash,
      type,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  await sendOtpEmail(email, code, type === "EMAIL_VERIFICATION" ? "verification" : "reset");
}

/** Vérifie un code fourni par l'utilisateur. Le marque comme utilisé si valide. */
export async function verifyOtp(userId: string, type: OtpType, code: string): Promise<boolean> {
  const candidate = await prisma.otpCode.findFirst({
    where: { userId, type, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!candidate) return false;

  const valid = await bcrypt.compare(code, candidate.code);
  if (!valid) return false;

  await prisma.otpCode.update({ where: { id: candidate.id }, data: { used: true } });
  return true;
}
