import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = (await req.json()) as {
      email?: string;
      code?: string;
      newPassword?: string;
    };

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Email, code et nouveau mot de passe requis" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 422 });
    }

    const ok = await verifyOtp(user.id, "PASSWORD_RESET", code.trim());
    if (!ok) {
      return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 422 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur reset-password:", err);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
