import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email, code } = (await req.json()) as { email?: string; code?: string };

    if (!email || !code) {
      return NextResponse.json({ error: "Email et code requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return NextResponse.json({ error: "Aucun compte associé à cet email" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Cet email est déjà vérifié" }, { status: 409 });
    }

    const ok = await verifyOtp(user.id, "EMAIL_VERIFICATION", code.trim());
    if (!ok) {
      return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 422 });
    }

    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur vérification OTP:", err);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
