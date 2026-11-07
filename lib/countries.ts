// Countries, groups used by eligibility rules, and spelling help for the nationality field.

export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo",
  "Democratic Republic of the Congo", "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti",
  "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala",
  "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
  "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova",
  "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
  "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
  "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "São Tomé and Príncipe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
] as const;

export const EU = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece",
  "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania",
  "Slovakia", "Slovenia", "Spain", "Sweden",
];
// Countries whose citizens usually pay EU fees at EU universities.
export const EU_FEE_COUNTRIES = [...EU, "Iceland", "Liechtenstein", "Norway", "Switzerland"];
export const WESTERN_BALKANS = ["Albania", "Bosnia and Herzegovina", "Kosovo", "Montenegro", "North Macedonia", "Serbia"];
export const EU_CANDIDATES = ["Albania", "Bosnia and Herzegovina", "Georgia", "Moldova", "Montenegro", "North Macedonia", "Serbia", "Turkey", "Ukraine"];
export const SOUTHEAST_EUROPE = [...WESTERN_BALKANS, "Bulgaria", "Croatia", "Greece", "Romania", "Slovenia", "Turkey", "Moldova"];
export const EUROPE = [
  ...EU, "Albania", "Andorra", "Armenia", "Azerbaijan", "Belarus", "Bosnia and Herzegovina", "Georgia", "Iceland", "Kosovo",
  "Liechtenstein", "Moldova", "Monaco", "Montenegro", "North Macedonia", "Norway", "Russia", "San Marino", "Serbia", "Switzerland",
  "Turkey", "Ukraine", "United Kingdom", "Vatican City",
];

// Other names people type: local names, short forms and nationality words.
const ALIASES: Record<string, string> = {
  shqiperi: "Albania", shqiperia: "Albania", shqiptar: "Albania", shqiptare: "Albania", albanian: "Albania",
  kosova: "Kosovo", kosovar: "Kosovo", kosovan: "Kosovo",
  osterreich: "Austria", oesterreich: "Austria", austrian: "Austria",
  deutschland: "Germany", german: "Germany", italia: "Italy", italian: "Italy",
  macedonia: "North Macedonia", macedonian: "North Macedonia", makedonija: "North Macedonia",
  bosnia: "Bosnia and Herzegovina", bosnian: "Bosnia and Herzegovina", herzegovina: "Bosnia and Herzegovina",
  serbian: "Serbia", srbija: "Serbia", montenegrin: "Montenegro", "crna gora": "Montenegro",
  greek: "Greece", hellas: "Greece", turkish: "Turkey", turkiye: "Turkey", croatian: "Croatia", hrvatska: "Croatia",
  usa: "United States", us: "United States", america: "United States", american: "United States", "united states of america": "United States",
  uk: "United Kingdom", britain: "United Kingdom", "great britain": "United Kingdom", england: "United Kingdom", british: "United Kingdom",
  french: "France", spanish: "Spain", espana: "Spain", polish: "Poland", romanian: "Romania", ukrainian: "Ukraine",
  "czech republic": "Czechia", czech: "Czechia", dutch: "Netherlands", holland: "Netherlands", swiss: "Switzerland", schweiz: "Switzerland",
  indian: "India", chinese: "China", korea: "South Korea", korean: "South Korea", russian: "Russia", "ivory coast": "Côte d'Ivoire",
  uae: "United Arab Emirates", emirates: "United Arab Emirates", nigerian: "Nigeria", pakistani: "Pakistan", egyptian: "Egypt",
  moldovan: "Moldova", georgian: "Georgia", hungarian: "Hungary", bulgarian: "Bulgaria", slovak: "Slovakia", slovenian: "Slovenia",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, "")
    .replace(/(.)\1+/g, "$1") // "Alllbaniii" -> "albani"
    .replace(/\s+/g, " ")
    .trim();
}

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

const CANDIDATES: { key: string; country: string }[] = [
  ...COUNTRIES.map((c) => ({ key: normalize(c), country: c as string })),
  ...Object.entries(ALIASES).map(([k, c]) => ({ key: normalize(k), country: c })),
];

// Best guesses for what the user typed, closest first.
export function suggestCountries(input: string, max = 5): string[] {
  const q = normalize(input);
  if (q.length < 2) return [];
  const scored = CANDIDATES.map(({ key, country }) => {
    let score: number;
    if (key === q) score = 0;
    else if (key.startsWith(q)) score = 0.5;
    else score = 1 + distance(q, key.slice(0, Math.max(q.length, Math.min(key.length, q.length + 2)))) / Math.max(q.length, 1);
    return { country, score };
  })
    .filter((x) => x.score <= 1.45)
    .sort((a, b) => a.score - b.score);
  return [...new Set(scored.map((s) => s.country))].slice(0, max);
}

// The country if the input clearly means one, otherwise null.
export function resolveCountry(input: string): string | null {
  const q = normalize(input);
  if (!q) return null;
  const exact = CANDIDATES.find((c) => c.key === q);
  if (exact) return exact.country;
  const [first] = suggestCountries(input, 1);
  return first ?? null;
}

export function paysEuFees(nationality: string): boolean {
  return EU_FEE_COUNTRIES.includes(nationality);
}
