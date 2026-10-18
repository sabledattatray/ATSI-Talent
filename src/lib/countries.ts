import { getAlpha2Codes } from "i18n-iso-countries";
const codes = getAlpha2Codes();
const names = new Intl.DisplayNames(["en"], { type: "region" });
export const COUNTRIES = Object.keys(codes).map(code => ({ code, name: names.of(code) || code })).sort((a,b)=>a.name.localeCompare(b.name));
export const isCountryCode = (value:string) => /^[A-Z]{2}$/.test(value) && Object.hasOwn(codes,value);
export function currencyForCountry(country:string) {
  const mapped:Record<string,string>={US:"USD",GB:"GBP",IN:"INR",CA:"CAD",AU:"AUD",NZ:"NZD",SG:"SGD",AE:"AED",SA:"SAR",JP:"JPY",CH:"CHF",ZA:"ZAR",BR:"BRL",MX:"MXN",CN:"CNY",HK:"HKD",KR:"KRW",SE:"SEK",NO:"NOK",DK:"DKK",PL:"PLN",TR:"TRY",TH:"THB",MY:"MYR",ID:"IDR",PH:"PHP"};
  return mapped[country] || (["AT","BE","HR","CY","EE","FI","FR","DE","GR","IE","IT","LV","LT","LU","MT","NL","PT","SK","SI","ES"].includes(country)?"EUR":"USD");
}
