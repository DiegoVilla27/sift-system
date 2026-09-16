export interface CompanyTarget {
  name: string;
  slug: string;
  ats: "greenhouse" | "lever";
  region: "SPAIN" | "LATAM";
  defaultLocation?: string;
}

export const TARGET_COMPANIES: CompanyTarget[] = [
  // España / LATAM — Greenhouse ATS
  { name: "Factorial HR", slug: "factorial", ats: "greenhouse", region: "SPAIN", defaultLocation: "Barcelona, España" },
  { name: "Cabify", slug: "cabify", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Jobandtalent", slug: "jobandtalent", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Seedtag", slug: "seedtag", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Wallapop", slug: "wallapop", ats: "greenhouse", region: "SPAIN", defaultLocation: "Barcelona, España" },
  { name: "Fever", slug: "fever", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Rappi", slug: "rappi", ats: "greenhouse", region: "LATAM", defaultLocation: "Bogotá, Colombia" },
  { name: "Nubank", slug: "nubank", ats: "greenhouse", region: "LATAM", defaultLocation: "Medellín / Remoto Colombia" },
  { name: "Typeform", slug: "typeform", ats: "greenhouse", region: "SPAIN", defaultLocation: "Barcelona, España" },
  { name: "Belvo", slug: "belvo", ats: "greenhouse", region: "LATAM", defaultLocation: "Colombia / Remoto" },

  // España / LATAM — Lever ATS
  { name: "TravelPerk", slug: "travelperk", ats: "lever", region: "SPAIN", defaultLocation: "Barcelona / Madrid" },
  { name: "Platzi", slug: "platzi", ats: "lever", region: "LATAM", defaultLocation: "Bogotá / Remoto Colombia" },
  { name: "Malt España", slug: "malt", ats: "lever", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Truora", slug: "truora", ats: "lever", region: "LATAM", defaultLocation: "Colombia (Remoto)" },
  { name: "Habi", slug: "habi", ats: "lever", region: "LATAM", defaultLocation: "Bogotá, Colombia" },
];
