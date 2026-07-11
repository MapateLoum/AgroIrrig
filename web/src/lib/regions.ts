// Coordonnées des 14 chefs-lieux de région du Sénégal + altitude approx (m)
// Mêmes valeurs que le notebook ML (AgroIrrig_dataset_reel_senegal.ipynb) pour rester cohérent
// entre les données d'entraînement et les prédictions en production.

export type RegionKey =
  | "Dakar" | "Thies" | "Diourbel" | "Fatick" | "Kaolack" | "Kaffrine"
  | "Louga" | "Matam" | "Saint_Louis" | "Tambacounda" | "Kedougou"
  | "Kolda" | "Sedhiou" | "Ziguinchor";

export interface RegionInfo {
  label: string;
  lat: number;
  lon: number;
  elevation: number;
}

export const REGIONS: Record<RegionKey, RegionInfo> = {
  Dakar:        { label: "Dakar",        lat: 14.72, lon: -17.47, elevation: 20 },
  Thies:        { label: "Thiès",        lat: 14.79, lon: -16.93, elevation: 70 },
  Diourbel:     { label: "Diourbel",     lat: 14.65, lon: -16.23, elevation: 15 },
  Fatick:       { label: "Fatick",       lat: 14.34, lon: -16.41, elevation: 10 },
  Kaolack:      { label: "Kaolack",      lat: 14.15, lon: -16.07, elevation: 10 },
  Kaffrine:     { label: "Kaffrine",     lat: 14.10, lon: -15.55, elevation: 25 },
  Louga:        { label: "Louga",        lat: 15.62, lon: -16.22, elevation: 30 },
  Matam:        { label: "Matam",        lat: 15.66, lon: -13.26, elevation: 15 },
  Saint_Louis:  { label: "Saint-Louis",  lat: 16.02, lon: -16.49, elevation: 4 },
  Tambacounda:  { label: "Tambacounda",  lat: 13.77, lon: -13.67, elevation: 50 },
  Kedougou:     { label: "Kédougou",     lat: 12.56, lon: -12.18, elevation: 180 },
  Kolda:        { label: "Kolda",        lat: 12.89, lon: -14.94, elevation: 30 },
  Sedhiou:      { label: "Sédhiou",      lat: 12.71, lon: -15.55, elevation: 20 },
  Ziguinchor:   { label: "Ziguinchor",   lat: 12.57, lon: -16.27, elevation: 10 },
};

export const REGION_KEYS = Object.keys(REGIONS) as RegionKey[];

export const CROP_TYPES = ["Arachide", "Riz", "Mil", "Pomme_de_terre"] as const;
export const CROP_STAGES = ["Semis", "Vegetatif", "Floraison", "Recolte"] as const;
