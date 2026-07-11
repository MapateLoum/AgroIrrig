import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const [totalUsers, totalPredictions, allPredictions] = await Promise.all([
    prisma.user.count(),
    prisma.prediction.count(),
    prisma.prediction.findMany({
      select: { region: true, cropType: true, irrigationNeed: true, createdAt: true },
    }),
  ]);

  const byRegion: Record<string, number> = {};
  const byCrop: Record<string, number> = {};
  const byNeed: Record<string, number> = {};

  for (const p of allPredictions) {
    byRegion[p.region] = (byRegion[p.region] || 0) + 1;
    byCrop[p.cropType] = (byCrop[p.cropType] || 0) + 1;
    byNeed[p.irrigationNeed] = (byNeed[p.irrigationNeed] || 0) + 1;
  }

  return NextResponse.json({
    totalUsers,
    totalPredictions,
    byRegion,
    byCrop,
    byNeed,
  });
}
