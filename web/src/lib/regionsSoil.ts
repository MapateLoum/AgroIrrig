// Valeurs de sol par région, extraites du dataset réel (irrigation_prediction_senegal_REAL.csv),
// lui-même construit à partir de vraies requêtes SoilGrids au moment où l'API fonctionnait encore.
//
// Pourquoi des valeurs figées plutôt qu'un appel API en direct :
// L'API SoilGrids (ISRIC) est en pause indéfinie côté fournisseur depuis fin 2025/2026,
// sans date de retour annoncée. Le sol ne change de toute façon pas d'un jour à l'autre —
// il n'y a donc aucune perte de fraîcheur à utiliser ces valeurs plutôt que de dépendre
// d'un service tiers indisponible. Si SoilGrids revient en ligne, on peut réactiver
// src/lib/soilgrids.ts en remplacement de ce fichier.

export interface StaticSoilData {
  soilType: string;
  soilPh: number;
  organicCarbon: number;
}

export const REGION_SOIL: Record<string, StaticSoilData> = {
  Dakar: { soilType: "Loam", soilPh: 6.6, organicCarbon: 1.56 },
  Diourbel: { soilType: "Sandy", soilPh: 6.2, organicCarbon: 1.05 },
  Fatick: { soilType: "Sandy", soilPh: 5.9, organicCarbon: 0.77 },
  Kaffrine: { soilType: "Loam", soilPh: 6.3, organicCarbon: 0.78 },
  Kaolack: { soilType: "Sandy", soilPh: 6.0, organicCarbon: 0.98 },
  Kedougou: { soilType: "Loam", soilPh: 5.9, organicCarbon: 1.33 },
  Kolda: { soilType: "Loam", soilPh: 5.6, organicCarbon: 2.07 },
  Louga: { soilType: "Sandy", soilPh: 6.8, organicCarbon: 0.85 },
  Matam: { soilType: "Loam", soilPh: 6.7, organicCarbon: 0.47 },
  Saint_Louis: { soilType: "Loam", soilPh: 7.1, organicCarbon: 1.08 },
  Sedhiou: { soilType: "Loam", soilPh: 5.5, organicCarbon: 5.54 },
  Tambacounda: { soilType: "Loam", soilPh: 5.9, organicCarbon: 1.0 },
  Thies: { soilType: "Loam", soilPh: 6.2, organicCarbon: 0.8 },
  Ziguinchor: { soilType: "Loam", soilPh: 5.4, organicCarbon: 3.14 },
};