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
    if (!user) {
      return NextResponse.json({ error: "Aucun compte associé à cet email" }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Cet email est déjà vérifié" }, { status: 409 });
    }

    await issueOtp(user.id, user.email, "EMAIL_VERIFICATION");
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Une erreur est survenue";
    return NextResponse.json({ error: message }, { status: 429 });
  }
}
