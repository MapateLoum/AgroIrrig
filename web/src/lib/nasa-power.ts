// Client NASA POWER — API publique, gratuite, sans clé.
// NASA POWER a un léger délai de publication (souvent 2-3 jours) : on demande donc
// les 10 derniers jours et on prend le jour le plus récent avec des données complètes,
// plutôt que de supposer que "aujourd'hui" est déjà disponible.

const NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";
const NASA_PARAMS = "T2M,RH2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN,WS2M,GWETROOT";

export interface ClimateData {
  date: string;
  temperatureC: number;
  humidity: number;
  rainfallMm: number;
  windSpeedKmh: number;
  soilMoisture: number;
  sunlightHours: number;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** Heures de jour théoriques (FAO-56 eq. 34), utilisées pour approximer l'ensoleillement réel. */
function daylightHours(latDeg: number, doy: number): number {
  const latRad = (latDeg * Math.PI) / 180;
  const decl = 0.409 * Math.sin((2 * Math.PI * doy) / 365 - 1.39);
  const wsArg = Math.max(-1, Math.min(1, -Math.tan(latRad) * Math.tan(decl)));
  const ws = Math.acos(wsArg);
  return (24 / Math.PI) * ws;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function fetchLatestClimate(lat: number, lon: number): Promise<ClimateData> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 10);

  const params = new URLSearchParams({
    parameters: NASA_PARAMS,
    community: "AG",
    latitude: String(lat),
    longitude: String(lon),
    start: formatDate(start),
    end: formatDate(end),
    format: "JSON",
  });

  const resp = await fetch(`${NASA_POWER_URL}?${params.toString()}`, {
    signal: AbortSignal.timeout(30000),
  });

  if (!resp.ok) {
    throw new Error(`NASA POWER a répondu avec le statut ${resp.status}`);
  }

  const data = await resp.json();
  const param = data?.properties?.parameter;
  if (!param) {
    throw new Error("Réponse NASA POWER inattendue (pas de données climatiques)");
  }

  const dates = Object.keys(param.T2M).sort().reverse(); // du plus récent au plus ancien

  for (const dateStr of dates) {
    const t2m = param.T2M[dateStr];
    const rh2m = param.RH2M[dateStr];
    const precip = param.PRECTOTCORR[dateStr];
    const solar = param.ALLSKY_SFC_SW_DWN[dateStr];
    const wind = param.WS2M[dateStr];
    const gwetroot = param.GWETROOT[dateStr];

    const values = [t2m, rh2m, precip, solar, wind, gwetroot];
    if (values.some((v) => v === -999 || v === null || v === undefined)) {
      continue; // jour incomplet, on essaie le précédent
    }

    const d = new Date(
      Number(dateStr.slice(0, 4)),
      Number(dateStr.slice(4, 6)) - 1,
      Number(dateStr.slice(6, 8))
    );
    const doy = dayOfYear(d);
    const N = daylightHours(lat, doy);
    const sunlightHours = Math.min(N, Math.max(1, N * 0.6));

    return {
      date: dateStr,
      temperatureC: t2m,
      humidity: rh2m,
      rainfallMm: precip,
      windSpeedKmh: wind * 3.6, // m/s -> km/h
      soilMoisture: Math.min(98, Math.max(2, gwetroot * 100)),
      sunlightHours,
    };
  }

  throw new Error("Aucun jour avec des données climatiques complètes trouvé sur les 10 derniers jours");
}

/** Saison agricole sénégalaise déduite de la date. */
export function seasonFromDate(dateStr: string): "Hivernage" | "Saison_seche" {
  const month = Number(dateStr.slice(4, 6));
  return month >= 6 && month <= 10 ? "Hivernage" : "Saison_seche";
}
