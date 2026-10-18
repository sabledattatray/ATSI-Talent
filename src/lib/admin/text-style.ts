export function richColor(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(value);
  if (rgb && rgb.slice(1).every(part => Number(part) <= 255)) return `#${rgb.slice(1).map(part => Number(part).toString(16).padStart(2,"0")).join("")}`;
}
export function richFontSize(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^\d{1,2}px$/.test(value)) return;
  const size = Number(value.slice(0,-2));
  return size >= 8 && size <= 96 ? value : undefined;
}
export function validTextStyle(attrs: unknown): boolean {
  if (!attrs || typeof attrs !== "object" || Array.isArray(attrs)) return false;
  return Object.entries(attrs).every(([key,value]) => ["color","fontSize"].includes(key) && (value === null || (key === "color" ? !!richColor(value) : !!richFontSize(value))));
}
