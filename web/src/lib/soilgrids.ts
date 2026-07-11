// Client SoilGrids (ISRIC) — API publique, gratuite, sans clé, résolution 250m.
// Certains points (zones urbaines denses, eau) renvoient des valeurs `null` -> on
// décale légèrement les coordonnées vers l'intérieur des terres jusqu'à trouver un
// pixel valide. Même logique que celle validée dans le notebook ML.

const SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query";
const SOIL_PROPERTIES = ["phh2o", "soc", "clay", "sand", "silt"];
const HEADERS = { "User-Agent": "Mozilla/5.0 (AgroIrrigSenegal M1-IABD project)" };

// Décalages orientés vers l'est (intérieur des terres) en priorité, pour éviter l'océan
// sur les régions côtières (Dakar, Saint-Louis, Ziguinchor).
const OFFSETS: [number, number][] = [
  [0, 0],
  [0, 0.15], [0, 0.3], [0, 0.45],
  [0.15, 0.15], [-0.15, 0.15],
  [0.15, 0.3], [-0.15, 0.3],
];

export interface SoilData {
  soilType: "Sandy" | "Clay" | "Loam" | "Silt";
  soilPh: number;
  organicCarbon: number;
}

function classifySoilTexture(sand: number, clay: number, silt: number): SoilData["soilType"] {
  if (sand >= 70 && clay < 15) return "Sandy";
  if (clay >= 35) return "Clay";
  if (silt >= 40 && clay < 35) return "Silt";
  return "Loam";
}

async function queryOnce(lat: number, lon: number): Promise<Record<string, number | null>> {
  const params = new URLSearchParams({
    lon: String(lon),
    lat: String(lat),
    depth: "0-5cm",
    value: "mean",
  });
  for (const p of SOIL_PROPERTIES) params.append("property", p);

  const resp = await fetch(`${SOILGRIDS_URL}?${params.toString()}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(30000),
  });

  if (!resp.ok) {
    throw new Error(`SoilGrids a répondu avec le statut ${resp.status}`);
  }

  const data = await resp.json();
  const layers = data?.properties?.layers ?? [];
  const out: Record<string, number | null> = {};
  for (const layer of layers) {
    out[layer.name] = layer.depths?.[0]?.values?.mean ?? null;
  }
  return out;
}

/**
 * Cache en mémoire (process) : le sol d'une région ne change pas d'une prédiction à
 * l'autre, inutile de re-taper l'API à chaque requête utilisateur. Simple Map,
 * suffisant pour un service mono-instance ; passer à Redis si on scale horizontalement.
 */
const soilCache = new Map<string, SoilData>();

export async function fetchSoil(lat: number, lon: number, cacheKey: string): Promise<SoilData> {
  const cached = soilCache.get(cacheKey);
  if (cached) return cached;

  for (const [dlat, dlon] of OFFSETS) {
    try {
      const out = await queryOnce(lat + dlat, lon + dlon);
      const allPresent = SOIL_PROPERTIES.every((p) => out[p] !== null && out[p] !== undefined);
      if (allPresent) {
        const result: SoilData = {
          soilPh: (out.phh2o as number) / 10,
          organicCarbon: (out.soc as number) / 100,
          soilType: classifySoilTexture(
            (out.sand as number) / 10,
            (out.clay as number) / 10,
            (out.silt as number) / 10
          ),
        };
        soilCache.set(cacheKey, result);
        return result;
      }
      // valeurs null -> pixel masqué, on essaie le décalage suivant
      await new Promise((r) => setTimeout(r, 1200)); // respecter ~5 req/min
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  throw new Error(
    `Impossible de récupérer les données de sol pour (${lat}, ${lon}) après tous les décalages testés`
  );
}
