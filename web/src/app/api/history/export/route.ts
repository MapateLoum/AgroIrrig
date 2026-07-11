import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REGIONS } from "@/lib/regions";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "pdf" ? "pdf" : "csv";
  const region = searchParams.get("region");
  const cropType = searchParams.get("cropType");

  const where = {
    userId: session.user.id,
    ...(region ? { region } : {}),
    ...(cropType ? { cropType } : {}),
  };

  const items = await prisma.prediction.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const rows = items.map((p) => ({
    date: p.createdAt.toISOString(),
    region: REGIONS[p.region as keyof typeof REGIONS]?.label ?? p.region,
    culture: p.cropType,
    stade: p.cropGrowthStage,
    surface_ha: p.fieldAreaHectare,
    paillage: p.mulchingUsed,
    irrigation_precedente_mm: p.previousIrrigationMm,
    sol: p.soilType,
    ph_sol: p.soilPh,
    temperature_c: p.temperatureC,
    humidite_pct: p.humidity,
    pluie_mm: p.rainfallMm,
    saison: p.season === "Hivernage" ? "Hivernage" : "Saison sèche",
    besoin_irrigation: p.irrigationNeed,
    confiance_pct: p.confidence,
  }));

  if (format === "csv") {
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="historique-agroirrig.csv"`,
      },
    });
  }

  // --- PDF ---
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ margin: 0, size: "A4", layout: "landscape" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  const PAGE_MARGIN = 30;
  const COLORS = {
    indigoDeep: "#1e3350",
    indigo: "#2c4f7c",
    gold: "#d9a441",
    clay: "#a6432d",
    olive: "#5f7a45",
    sand: "#fbf7ee",
    sandDark: "#f2e8d5",
    ink: "#241f1c",
    inkSoft: "#6b6258",
    line: "#e4d9c4",
    white: "#ffffff",
  };
  const NEED_STYLE: Record<string, { bg: string; text: string }> = {
    High: { bg: COLORS.clay, text: COLORS.white },
    Medium: { bg: COLORS.gold, text: COLORS.ink },
    Low: { bg: COLORS.olive, text: COLORS.white },
  };

  const colWidths = [78, 62, 55, 58, 42, 48, 55, 48, 32, 45, 45, 45, 58, 55];
  const headers = ["Date", "Région", "Culture", "Stade", "Surface", "Paillage", "Irrig. préc.", "Sol", "pH", "Temp.", "Humid.", "Pluie", "Besoin", "Confiance"];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableX = (doc.page.width - tableWidth) / 2;

  function drawHeaderBand() {
    doc.rect(0, 0, doc.page.width, 78).fill(COLORS.indigoDeep);
    doc.circle(46, 39, 15).fill(COLORS.gold);
    doc.fontSize(14).fillColor(COLORS.indigoDeep).font("Helvetica-Bold").text("A", 40, 31);
    doc.fontSize(18).fillColor(COLORS.white).font("Helvetica-Bold").text("AgroIrrig Sénégal", 72, 24);
    doc
      .fontSize(9)
      .fillColor("#c7d3e2")
      .font("Helvetica")
      .text("Historique des prédictions d'irrigation — Machine Learning (XGBoost)", 72, 46);
    doc
      .fontSize(8)
      .fillColor("#c7d3e2")
      .text(`Exporté le ${new Date().toLocaleString("fr-FR")}`, 0, 30, { align: "right", width: doc.page.width - PAGE_MARGIN });
  }

  function drawSummary(startY: number): number {
    const counts = { High: 0, Medium: 0, Low: 0 };
    rows.forEach((r) => {
      const n = String(r.besoin_irrigation) as keyof typeof counts;
      if (n in counts) counts[n]++;
    });

    doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.ink).text(`${rows.length} prédiction(s)`, PAGE_MARGIN, startY);

    let cx = PAGE_MARGIN + 110;
    (["High", "Medium", "Low"] as const).forEach((need) => {
      doc.circle(cx + 4, startY + 4, 4).fill(NEED_STYLE[need].bg);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(COLORS.inkSoft)
        .text(`${need} : ${counts[need]}`, cx + 12, startY);
      cx += 90;
    });

    return startY + 26;
  }

  function drawTableHeader(y: number): number {
    let x = tableX;
    doc.rect(tableX, y, tableWidth, 20).fill(COLORS.indigo);
    doc.fontSize(7.5).font("Helvetica-Bold").fillColor(COLORS.white);
    headers.forEach((h, i) => {
      doc.text(h, x + 5, y + 6, { width: colWidths[i] - 6, ellipsis: true });
      x += colWidths[i];
    });
    return y + 20;
  }

  function drawFooter(pageNum: number) {
    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(COLORS.inkSoft)
      .text(
        "AgroIrrig Sénégal — Master 1 IABD, ESP/UCAD Dakar",
        PAGE_MARGIN,
        doc.page.height - 24,
        { width: tableWidth / 2 }
      );
    doc
      .fontSize(7.5)
      .fillColor(COLORS.inkSoft)
      .text(`Page ${pageNum}`, doc.page.width - PAGE_MARGIN - 100, doc.page.height - 24, {
        width: 100,
        align: "right",
      });
  }

  const pdfBuffer: Buffer = await new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    let pageNum = 1;
    drawHeaderBand();
    let y = drawSummary(98);
    y = drawTableHeader(y);
    drawFooter(pageNum);

    doc.font("Helvetica").fontSize(7.5);

    rows.forEach((row, rowIndex) => {
      if (y > doc.page.height - 50) {
        doc.addPage();
        pageNum++;
        drawHeaderBand();
        y = drawTableHeader(98);
        drawFooter(pageNum);
        doc.font("Helvetica").fontSize(7.5);
      }

      let x = tableX;
      if (rowIndex % 2 === 0) {
        doc.rect(tableX, y, tableWidth, 17).fill(COLORS.sand);
      }

      const need = String(row.besoin_irrigation);
      const values = [
        new Date(row.date).toLocaleDateString("fr-FR"),
        String(row.region),
        String(row.culture),
        String(row.stade),
        `${row.surface_ha} ha`,
        String(row.paillage === "Yes" ? "Oui" : "Non"),
        `${row.irrigation_precedente_mm} mm`,
        String(row.sol),
        String(row.ph_sol),
        `${row.temperature_c}°C`,
        `${row.humidite_pct}%`,
        `${row.pluie_mm} mm`,
        null, // badge dessiné à part
        `${row.confiance_pct}%`,
      ];

      values.forEach((v, i) => {
        if (v === null) {
          const badge = NEED_STYLE[need] || { bg: COLORS.line, text: COLORS.ink };
          const badgeW = colWidths[i] - 12;
          doc.roundedRect(x + 6, y + 2.5, badgeW, 12, 3).fill(badge.bg);
          doc.fontSize(7).font("Helvetica-Bold").fillColor(badge.text).text(need, x + 6, y + 5.5, {
            width: badgeW,
            align: "center",
          });
          doc.font("Helvetica").fontSize(7.5);
        } else {
          doc.fillColor(COLORS.ink).text(v, x + 5, y + 4.5, { width: colWidths[i] - 6, ellipsis: true });
        }
        x += colWidths[i];
      });
      y += 16;
    });

    doc.end();
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="historique-agroirrig.pdf"`,
    },
  });
}