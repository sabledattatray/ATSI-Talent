import { getAlpha2Codes } from "i18n-iso-countries";
const codes = getAlpha2Codes();
const names = new Intl.DisplayNames(["en"], { type: "region" });
export const COUNTRIES = Object.keys(codes).map(code => ({ code, name: names.of(code) || code })).sort((a,b)=>a.name.localeCompare(b.name));
export const isCountryCode = (value:string) => /^[A-Z]{2}$/.test(value) && Object.hasOwn(codes,value);

export function toCountryCode(input: unknown, fallback = "IN"): string {
  if (typeof input !== "string") return fallback;
  const trimmed = input.trim();
  if (!trimmed) return fallback;
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const upper = trimmed.toUpperCase();
    if (Object.hasOwn(codes, upper)) return upper;
  }
  const lower = trimmed.toLowerCase();
  for (const c of COUNTRIES) {
    if (c.name.toLowerCase() === lower) return c.code;
  }
  if (lower.includes("india") || lower.includes("bharat")) return "IN";
  if (lower.includes("united states") || lower === "usa" || lower === "us" || lower === "u.s." || lower === "u.s.a." || lower.includes("america")) return "US";
  if (lower.includes("united kingdom") || lower === "uk" || lower === "u.k." || lower.includes("great britain") || lower.includes("england") || lower.includes("scotland")) return "GB";
  if (lower.includes("canada")) return "CA";
  if (lower.includes("germany") || lower.includes("deutschland")) return "DE";
  if (lower.includes("australia")) return "AU";
  if (lower.includes("singapore")) return "SG";
  if (lower.includes("united arab emirates") || lower === "uae" || lower === "u.a.e." || lower.includes("dubai")) return "AE";
  if (lower.includes("france")) return "FR";
  if (lower.includes("netherlands") || lower.includes("holland")) return "NL";
  if (lower.includes("ireland")) return "IE";
  if (lower.includes("switzerland")) return "CH";
  if (lower.includes("japan")) return "JP";
  
  const matched = COUNTRIES.find(c => lower.includes(c.name.toLowerCase()) || (lower.length >= 4 && c.name.toLowerCase().includes(lower)));
  if (matched) return matched.code;

  return fallback;
}

export function currencyForCountry(country:string) {
  const mapped:Record<string,string>={US:"USD",GB:"GBP",IN:"INR",CA:"CAD",AU:"AUD",NZ:"NZD",SG:"SGD",AE:"AED",SA:"SAR",JP:"JPY",CH:"CHF",ZA:"ZAR",BR:"BRL",MX:"MXN",CN:"CNY",HK:"HKD",KR:"KRW",SE:"SEK",NO:"NOK",DK:"DKK",PL:"PLN",TR:"TRY",TH:"THB",MY:"MYR",ID:"IDR",PH:"PHP"};
  return mapped[country] || (["AT","BE","HR","CY","EE","FI","FR","DE","GR","IE","IT","LV","LT","LU","MT","NL","PT","SK","SI","ES"].includes(country)?"EUR":"USD");
}

