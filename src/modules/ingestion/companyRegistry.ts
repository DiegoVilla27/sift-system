export interface CompanyTarget {
  name: string;
  slug: string;
  ats: "greenhouse" | "lever";
  region: "SPAIN" | "LATAM";
  defaultLocation?: string;
}

export const TARGET_COMPANIES: CompanyTarget[] = [
  // ─── España — Greenhouse ATS ───
  { name: "Factorial HR", slug: "factorial", ats: "greenhouse", region: "SPAIN", defaultLocation: "Barcelona, España" },
  { name: "Cabify", slug: "cabify", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Jobandtalent", slug: "jobandtalent", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Seedtag", slug: "seedtag", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Wallapop", slug: "wallapop", ats: "greenhouse", region: "SPAIN", defaultLocation: "Barcelona, España" },
  { name: "Fever", slug: "fever", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Typeform", slug: "typeform", ats: "greenhouse", region: "SPAIN", defaultLocation: "Barcelona, España" },
  { name: "Adevinta", slug: "adevinta", ats: "greenhouse", region: "SPAIN", defaultLocation: "Barcelona, España" },
  { name: "Idealista", slug: "idealista", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Spotahome", slug: "spotahome", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Glovo", slug: "glovo", ats: "greenhouse", region: "SPAIN", defaultLocation: "Barcelona, España" },
  { name: "Flywire", slug: "flywire", ats: "greenhouse", region: "SPAIN", defaultLocation: "Valencia, España" },
  { name: "Liferay", slug: "liferay", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Mercadona Tech", slug: "mercadonatech", ats: "greenhouse", region: "SPAIN", defaultLocation: "Valencia / Madrid, España" },
  { name: "Mango Tech", slug: "mango", ats: "greenhouse", region: "SPAIN", defaultLocation: "Barcelona, España" },
  { name: "Inditex Tech", slug: "inditex", ats: "greenhouse", region: "SPAIN", defaultLocation: "A Coruña / Madrid, España" },

  // ─── España — Lever ATS ───
  { name: "TravelPerk", slug: "travelperk", ats: "lever", region: "SPAIN", defaultLocation: "Barcelona, España" },
  { name: "Malt España", slug: "malt", ats: "lever", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Manfred", slug: "manfred", ats: "lever", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Revolut", slug: "revolut", ats: "lever", region: "SPAIN", defaultLocation: "España / Remoto" },

  // ─── LATAM — Greenhouse ATS ───
  { name: "Rappi", slug: "rappi", ats: "greenhouse", region: "LATAM", defaultLocation: "Bogotá, Colombia" },
  { name: "Nubank", slug: "nubank", ats: "greenhouse", region: "LATAM", defaultLocation: "Colombia / Remoto" },
  { name: "Belvo", slug: "belvo", ats: "greenhouse", region: "LATAM", defaultLocation: "Colombia / Remoto" },
  { name: "Kavak", slug: "kavak", ats: "greenhouse", region: "LATAM", defaultLocation: "México / Remoto" },
  { name: "Clip", slug: "clip", ats: "greenhouse", region: "LATAM", defaultLocation: "México / Remoto" },
  { name: "MercadoLibre", slug: "mercadolibre", ats: "greenhouse", region: "LATAM", defaultLocation: "Buenos Aires / Remoto" },
  { name: "Ualá", slug: "uala", ats: "greenhouse", region: "LATAM", defaultLocation: "Buenos Aires / Remoto" },
  { name: "dLocal", slug: "dlocal", ats: "greenhouse", region: "LATAM", defaultLocation: "Montevideo / Remoto" },

  // ─── LATAM — Lever ATS ───
  { name: "Platzi", slug: "platzi", ats: "lever", region: "LATAM", defaultLocation: "Bogotá / Remoto" },
  { name: "Truora", slug: "truora", ats: "lever", region: "LATAM", defaultLocation: "Colombia / Remoto" },
  { name: "Habi", slug: "habi", ats: "lever", region: "LATAM", defaultLocation: "Bogotá, Colombia" },
  { name: "Crehana", slug: "crehana", ats: "lever", region: "LATAM", defaultLocation: "Perú / Remoto" },
  { name: "Betterfly", slug: "betterfly", ats: "lever", region: "LATAM", defaultLocation: "Chile / Remoto" },
  { name: "Konfio", slug: "konfio", ats: "lever", region: "LATAM", defaultLocation: "México / Remoto" },

  // ─── Consultoras Tech Hispanohablantes — Greenhouse ───
  { name: "Globant", slug: "globant", ats: "greenhouse", region: "LATAM", defaultLocation: "Buenos Aires / España / Remoto" },
  { name: "GFT Technologies", slug: "gft", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid / Barcelona, España" },
  { name: "Indra / Minsait", slug: "indra", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "NTT Data (Everis)", slug: "nttdata", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid / Barcelona, España" },
  { name: "Sopra Steria", slug: "soprasteria", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Capgemini", slug: "capgemini", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid / Barcelona, España" },
  { name: "Cognizant", slug: "cognizant", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
  { name: "Thoughtworks", slug: "thoughtworks", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid / Barcelona, España" },
  { name: "EPAM Systems", slug: "epam", ats: "greenhouse", region: "SPAIN", defaultLocation: "Málaga / Madrid, España" },

  // ─── Gigantes Tecnológicos & Producto Global con vacantes en español ───
  { name: "Stripe", slug: "stripe", ats: "greenhouse", region: "SPAIN", defaultLocation: "Remoto / España" },
  { name: "Spotify", slug: "spotify", ats: "greenhouse", region: "SPAIN", defaultLocation: "Remoto / Madrid" },
  { name: "Vercel", slug: "vercel", ats: "greenhouse", region: "SPAIN", defaultLocation: "100% Remoto" },
  { name: "Supabase", slug: "supabase", ats: "greenhouse", region: "SPAIN", defaultLocation: "100% Remoto" },
  { name: "Cloudflare", slug: "cloudflare", ats: "greenhouse", region: "SPAIN", defaultLocation: "Remoto / Lisboa / Madrid" },
  { name: "GitLab", slug: "gitlab", ats: "greenhouse", region: "SPAIN", defaultLocation: "100% Remoto" },
  { name: "Automattic", slug: "automattic", ats: "greenhouse", region: "SPAIN", defaultLocation: "100% Remoto" },
  { name: "N26", slug: "n26", ats: "greenhouse", region: "SPAIN", defaultLocation: "Barcelona / Madrid" },
  { name: "Eventbrite", slug: "eventbrite", ats: "greenhouse", region: "SPAIN", defaultLocation: "Madrid, España" },
];
