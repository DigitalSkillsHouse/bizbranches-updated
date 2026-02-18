/**
 * Pakistani city slug <-> canonical name.
 * Uses static list for consistency and SEO; matches backend pakistan-cities.json id/name.
 */

const PAKISTAN_CITIES: Array<{ id: string; name: string }> = [
  { id: "karachi", name: "Karachi" },
  { id: "lahore", name: "Lahore" },
  { id: "faisalabad", name: "Faisalabad" },
  { id: "rawalpindi", name: "Rawalpindi" },
  { id: "islamabad", name: "Islamabad" },
  { id: "multan", name: "Multan" },
  { id: "peshawar", name: "Peshawar" },
  { id: "quetta", name: "Quetta" },
  { id: "sialkot", name: "Sialkot" },
  { id: "gujranwala", name: "Gujranwala" },
  { id: "hyderabad", name: "Hyderabad" },
  { id: "sargodha", name: "Sargodha" },
  { id: "bahawalpur", name: "Bahawalpur" },
  { id: "sukkur", name: "Sukkur" },
  { id: "jhelum", name: "Jhelum" },
  { id: "sheikhupura", name: "Sheikhupura" },
  { id: "mardan", name: "Mardan" },
  { id: "gujrat", name: "Gujrat" },
  { id: "kasur", name: "Kasur" },
  { id: "dera-ghazi-khan", name: "Dera Ghazi Khan" },
  { id: "sahiwal", name: "Sahiwal" },
  { id: "okara", name: "Okara" },
  { id: "wah-cantonment", name: "Wah Cantonment" },
  { id: "dera-ismail-khan", name: "Dera Ismail Khan" },
  { id: "mirpur-khas", name: "Mirpur Khas" },
  { id: "nawabshah", name: "Nawabshah" },
  { id: "mingora", name: "Mingora" },
  { id: "chiniot", name: "Chiniot" },
  { id: "kamoke", name: "Kamoke" },
  { id: "mandi-bahauddin", name: "Mandi Bahauddin" },
  { id: "khanewal", name: "Khanewal" },
  { id: "hafizabad", name: "Hafizabad" },
  { id: "kohat", name: "Kohat" },
  { id: "jacobabad", name: "Jacobabad" },
  { id: "muzaffargarh", name: "Muzaffargarh" },
  { id: "khanpur", name: "Khanpur" },
  { id: "muridke", name: "Muridke" },
  { id: "pakpattan", name: "Pakpattan" },
  { id: "abbottabad", name: "Abbottabad" },
  { id: "turbat", name: "Turbat" },
  { id: "bannu", name: "Bannu" },
  { id: "swabi", name: "Swabi" },
  { id: "mansehra", name: "Mansehra" },
  { id: "jhang", name: "Jhang" },
  { id: "larkana", name: "Larkana" },
  { id: "khairpur", name: "Khairpur" },
  { id: "burewala", name: "Burewala" },
  { id: "vehari", name: "Vehari" },
  { id: "kot-addu", name: "Kot Addu" },
  { id: "muzaffarabad", name: "Muzaffarabad" },
  { id: "attock", name: "Attock" },
  { id: "wazirabad", name: "Wazirabad" },
  { id: "layyah", name: "Layyah" },
  { id: "rajanpur", name: "Rajanpur" },
  { id: "gwadar", name: "Gwadar" },
];

const slugToName = new Map(PAKISTAN_CITIES.map((c) => [c.id, c.name]));
const nameToSlug = new Map(PAKISTAN_CITIES.map((c) => [c.name.toLowerCase(), c.id]));

/** Canonical city name from URL slug (e.g. multan -> Multan, dera-ghazi-khan -> Dera Ghazi Khan). */
export function citySlugToName(slug: string): string {
  const normalized = String(slug || "").trim().toLowerCase().replace(/\s+/g, "-");
  return slugToName.get(normalized) ?? slugToTitleCase(slug);
}

/** URL slug from city name (e.g. Multan -> multan). */
export function cityNameToSlug(name: string): string {
  const n = String(name || "").trim().toLowerCase();
  return nameToSlug.get(n) ?? n.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** Fallback when slug not in list: title-case the slug. */
function slugToTitleCase(slug: string): string {
  return String(slug || "")
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}

/** Normalize area/locality for display and URL (e.g. Cantt, CANTT -> cantt for URL). */
export function areaToSlug(area: string): string {
  return String(area || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
