import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { issueOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nom, email et mot de passe sont requis" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: false,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    try {
      await issueOtp(user.id, user.email, "EMAIL_VERIFICATION");
    } catch (mailErr) {
      // Le compte est créé même si l'email échoue à partir (ex: Gmail mal configuré) ;
      // l'utilisateur pourra redemander un code depuis /verify-email.
      console.error("Erreur envoi OTP inscription:", mailErr);
    }

    return NextResponse.json(
      { user, requiresVerification: true },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erreur inscription:", err);
    return NextResponse.json(
      { error: "Une erreur est survenue, réessaie plus tard" },
      { status: 500 }
    );
  }
}
