import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Réponse volontairement identique que le compte existe ou non,
    // pour ne pas permettre de deviner quels emails sont enregistrés.
    if (user) {
      try {
        await issueOtp(user.id, user.email, "PASSWORD_RESET");
      } catch (err) {
        console.error("Erreur envoi OTP reset:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Si un compte existe avec cet email, un code de réinitialisation a été envoyé.",
    });
  } catch (err) {
    console.error("Erreur forgot-password:", err);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
