import fs from "node:fs";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { getEmblemVector, getFullLogoSvg } from "./generate-master-brand.mjs";

const brandDir = new URL("../public/brand/", import.meta.url);
fs.mkdirSync(brandDir, { recursive: true });

// 1. Full Light Logo SVG & 4K PNG
const lightSvg = getFullLogoSvg(false, "logo-light");
fs.writeFileSync(new URL("atsai-logo-light.svg", brandDir), lightSvg);
await sharp(Buffer.from(lightSvg)).resize({ width: 3840 }).png().toFile(fileURLToPath(new URL("atsai-logo-light-4k.png", brandDir)));

// 2. Full Dark Logo SVG & 4K PNG
const darkSvg = getFullLogoSvg(true, "logo-dark");
fs.writeFileSync(new URL("atsai-logo-dark.svg", brandDir), darkSvg);
await sharp(Buffer.from(darkSvg)).resize({ width: 3840 }).png().toFile(fileURLToPath(new URL("atsai-logo-dark-4k.png", brandDir)));

// 3. Standalone Symbol SVG & 1024x1024 PNG
const symbolSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" width="100" height="100">
  <title>ATSAI Emblem</title>
  ${getEmblemVector("symbol-master")}
</svg>`;
fs.writeFileSync(new URL("atsai-symbol.svg", brandDir), symbolSvg);
await sharp(Buffer.from(symbolSvg)).resize(1024, 1024).png().toFile(fileURLToPath(new URL("atsai-symbol-1024.png", brandDir)));

// 4. App Icon (icon.svg) & Apple Touch Icon & Favicon
const appIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" fill="none" width="112" height="112">
  <defs>
    <linearGradient id="icon-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="icon-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(56, 189, 248, 0.4)"/>
      <stop offset="100%" stop-color="rgba(37, 99, 235, 0.1)"/>
    </linearGradient>
  </defs>
  <rect width="112" height="112" rx="26" fill="url(#icon-bg)"/>
  <rect x="1" y="1" width="110" height="110" rx="25" fill="none" stroke="url(#icon-border)" stroke-width="1.5"/>
  <g transform="translate(10, 10) scale(0.92)">
    ${getEmblemVector("app-icon")}
  </g>
</svg>`;
fs.writeFileSync(new URL("../src/app/icon.svg", import.meta.url), appIconSvg);

const appleTouchPng = await sharp(Buffer.from(appIconSvg)).resize(180, 180).png().toBuffer();
fs.writeFileSync(new URL("apple-touch-icon.png", brandDir), appleTouchPng);

// Build favicon.ico from 64x64 PNG
const iconPng = await sharp(Buffer.from(appIconSvg)).resize(64, 64).png().toBuffer();
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(1, 2); 
icoHeader.writeUInt16LE(1, 4);
icoHeader[6] = 64; 
icoHeader[7] = 64;
icoHeader.writeUInt16LE(1, 10); 
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(iconPng.length, 14); 
icoHeader.writeUInt32LE(22, 18);
fs.writeFileSync(new URL("../src/app/favicon.ico", import.meta.url), Buffer.concat([icoHeader, iconPng]));

console.log("Official brand assets exported from the shared vector master.");
