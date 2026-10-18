import fs from "node:fs";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
const a = JSON.parse(fs.readFileSync(new URL("../src/lib/brandArtwork.json", import.meta.url), "utf8"));
const dir = new URL("../public/brand/", import.meta.url);
fs.mkdirSync(dir, { recursive: true });
const mark = a.mark.map(p => `<path d="${p.path}" fill="${p.fill}" transform="${p.transform || ""}" fill-rule="evenodd"/>`).join("");
const l = a.layout;
function contents(dark = false) {
  return `<g transform="translate(0 ${l.markY})">${mark}</g><g transform="translate(${l.wordmarkX} ${l.wordmarkY}) scale(${l.wordmarkWidth/a.wordmark.width} ${l.wordmarkHeight/a.wordmark.height})"><path d="${a.wordmark.path}" fill="${dark ? "#F7FAFF" : "#142C49"}"/><path d="${a.wordmark.accentPath}" transform="translate(${a.wordmark.accentX} 0)" fill="${dark ? "#82AEFF" : "#2864EA"}"/></g><path d="${a.descriptor.path}" transform="translate(${l.descriptorX} ${l.descriptorY}) scale(${l.descriptorWidth/a.descriptor.width} ${l.descriptorHeight/a.descriptor.height})" fill="${dark ? "#B0C1D8" : "#4B627E"}"/>`;
}
for (const dark of [false, true]) {
  const name = dark ? "atsai-logo-dark" : "atsai-logo-light";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${a.viewBox}" fill="none"><title>ATS AI Talent Solutions</title>${contents(dark)}</svg>`;
  fs.writeFileSync(new URL(`${name}.svg`, dir), svg);
  await sharp(Buffer.from(svg)).resize({width:3840}).png().toFile(fileURLToPath(new URL(`${name}-4k.png`,dir)));
}
const symbol = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><title>ATSAI emblem</title>${mark}</svg>`;
fs.writeFileSync(new URL("atsai-symbol.svg",dir),symbol);
await sharp(Buffer.from(symbol)).resize(1024,1024).png().toFile(fileURLToPath(new URL("atsai-symbol-1024.png",dir)));
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" fill="none"><rect width="112" height="112" rx="24" fill="#FFFFFF"/><g transform="translate(6 6)">${mark}</g></svg>`;
fs.writeFileSync(new URL("../src/app/icon.svg",import.meta.url),favicon);
const iconPng = await sharp(Buffer.from(favicon)).resize(64,64).png().toBuffer();
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(1,2); icoHeader.writeUInt16LE(1,4);
icoHeader[6]=64; icoHeader[7]=64;
icoHeader.writeUInt16LE(1,10); icoHeader.writeUInt16LE(32,12);
icoHeader.writeUInt32LE(iconPng.length,14); icoHeader.writeUInt32LE(22,18);
fs.writeFileSync(new URL("../src/app/favicon.ico",import.meta.url),Buffer.concat([icoHeader,iconPng]));
fs.writeFileSync(new URL("apple-touch-icon.png",dir),await sharp(Buffer.from(favicon)).resize(180,180).png().toBuffer());

const board = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="#F3F6FA"/><text x="100" y="100" font-family="Segoe UI,Arial,sans-serif" font-size="18" font-weight="600" fill="#65758B" letter-spacing="5">ATS AI / BRAND IDENTITY</text><text x="100" y="175" font-family="Segoe UI,Arial,sans-serif" font-size="46" font-weight="600" fill="#142C49">Connecting talent. Empowering careers.</text><rect x="100" y="245" width="1720" height="335" rx="18" fill="white"/><g transform="translate(490 300) scale(2.32)">${contents(false)}</g><rect x="100" y="610" width="1720" height="335" rx="18" fill="#0B1728"/><g transform="translate(490 665) scale(2.32)">${contents(true)}</g><text x="100" y="1015" font-family="Segoe UI,Arial,sans-serif" font-size="16" fill="#65758B">One emblem. One wordmark. Consistent across every touchpoint.</text><text x="1635" y="1015" font-family="Segoe UI,Arial,sans-serif" font-size="16" fill="#65758B">VECTOR MASTER / 4K</text></svg>`;
fs.writeFileSync(new URL("atsai-brand-preview.svg",dir),board);
await sharp(Buffer.from(board)).png().toFile(fileURLToPath(new URL("atsai-brand-preview.png",dir)));
console.log("Brand assets exported from the shared vector master.");
