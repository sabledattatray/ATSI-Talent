import fs from "node:fs";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

// High-Precision Geometric Vector System for ATSAI Technologies
// ViewBox: 0 0 100 100 for mark, 0 0 360 90 for full logo

export function getEmblemVector(id = "atsai-mark") {
  return `
    <defs>
      <!-- Primary Sapphire to Deep Cobalt gradient -->
      <linearGradient id="${id}-g-left" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3B82F6"/>
        <stop offset="45%" stop-color="#2563EB"/>
        <stop offset="100%" stop-color="#1D4ED8"/>
      </linearGradient>

      <!-- Electric Cyan to Sky Azure gradient -->
      <linearGradient id="${id}-g-right" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00F0FF"/>
        <stop offset="35%" stop-color="#06B6D4"/>
        <stop offset="100%" stop-color="#0284C7"/>
      </linearGradient>

      <!-- Central Upward Arrow Ascension gradient -->
      <linearGradient id="${id}-g-arrow" x1="50%" y1="100%" x2="50%" y2="0%">
        <stop offset="0%" stop-color="#1E40AF"/>
        <stop offset="40%" stop-color="#2563EB"/>
        <stop offset="85%" stop-color="#38BDF8"/>
        <stop offset="100%" stop-color="#E0F2FE"/>
      </linearGradient>

      <!-- Bottom fold return gradients for 3D ribbon depth -->
      <linearGradient id="${id}-g-fold-l" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#172554"/>
        <stop offset="100%" stop-color="#1E40AF"/>
      </linearGradient>

      <linearGradient id="${id}-g-fold-r" x1="100%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#082F49"/>
        <stop offset="100%" stop-color="#0369A1"/>
      </linearGradient>

      <!-- Luminous Apex Crest -->
      <linearGradient id="${id}-g-crest" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#93C5FD"/>
        <stop offset="50%" stop-color="#FFFFFF"/>
        <stop offset="100%" stop-color="#A5F3FC"/>
      </linearGradient>

      <!-- High-tech subtle glow -->
      <filter id="${id}-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>

    <!-- Main Icon Group -->
    <g id="${id}-group">
      <!-- Left Outer Pillar of the "A" -->
      <path d="M 50 10 
               L 16 72 
               C 14.5 75 16 78.5 19.5 78.5 
               L 31 78.5 
               C 33 78.5 34.8 77.3 35.8 75.5 
               L 43.5 61 
               L 50 48 
               L 50 10 Z" 
            fill="url(#${id}-g-left)"/>

      <!-- Right Outer Pillar of the "A" -->
      <path d="M 50 10 
               L 84 72 
               C 85.5 75 84 78.5 80.5 78.5 
               L 69 78.5 
               C 67 78.5 65.2 77.3 64.2 75.5 
               L 56.5 61 
               L 50 48 
               L 50 10 Z" 
            fill="url(#${id}-g-right)"/>

      <!-- Lower Left Folded Return Bevel (Adds 3D ribbon precision) -->
      <path d="M 19.5 78.5 
               L 14 86 
               C 13 87.5 14.2 89.5 16 89.5 
               L 33 89.5 
               L 31 78.5 Z" 
            fill="url(#${id}-g-fold-l)"/>

      <!-- Lower Right Folded Return Bevel -->
      <path d="M 80.5 78.5 
               L 86 86 
               C 87 87.5 85.8 89.5 84 89.5 
               L 67 89.5 
               L 69 78.5 Z" 
            fill="url(#${id}-g-fold-r)"/>

      <!-- Upward Ascending Chevron Arrow (Career Advancement & AI matching apex) -->
      <path d="M 50 24 
               L 66 54 
               L 57 54 
               L 50 41 
               L 43 54 
               L 34 54 Z" 
            fill="url(#${id}-g-arrow)"/>

      <!-- Intersecting Hex-Nexus Bridge Bar -->
      <path d="M 33 63 
               L 43 63 
               L 50 51 
               L 57 63 
               L 67 63 
               L 61 73 
               L 39 73 Z" 
            fill="url(#${id}-g-left)" 
            opacity="0.9"/>

      <!-- Apex Prism Cap (Crystal light highlight) -->
      <polygon points="50,10 44,18 50,22 56,18" fill="url(#${id}-g-crest)"/>

      <!-- Central Luminous Spark Node (Convergence of AI & Talent) -->
      <circle cx="50" cy="46" r="3" fill="#FFFFFF"/>
      <circle cx="50" cy="46" r="1.5" fill="#38BDF8"/>
    </g>
  `;
}

// Generate full horizontal logo SVG (ViewBox 0 0 360 90)
export function getFullLogoSvg(dark = false, id = dark ? "atsai-dark" : "atsai-light") {
  const textColor = dark ? "#FFFFFF" : "#0A192F";
  const descColor = dark ? "#94A3B8" : "#475569";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 90" fill="none" width="360" height="90">
      <title>ATSAI Talent Solutions</title>
      <!-- Emblem Icon -->
      <g transform="translate(4, 3) scale(0.84)">
        ${getEmblemVector(id)}
      </g>

      <!-- Wordmark ATSAI -->
      <g transform="translate(100, 16)">
        <!-- "ATS" Letters in ultra-clean geometric sans-serif -->
        <text x="0" y="44" 
              font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" 
              font-size="44" 
              font-weight="850" 
              letter-spacing="-1" 
              fill="${textColor}">
          ATS
        </text>

        <!-- "AI" highlighted with vibrant tech gradient -->
        <defs>
          <linearGradient id="${id}-ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38BDF8"/>
            <stop offset="60%" stop-color="#2563EB"/>
            <stop offset="100%" stop-color="#1D4ED8"/>
          </linearGradient>
        </defs>

        <text x="96" y="44" 
              font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" 
              font-size="44" 
              font-weight="850" 
              letter-spacing="-1" 
              fill="url(#${id}-ai-grad)">
          AI
        </text>

        <!-- Subtle Tech Pulse Dot next to AI -->
        <circle cx="152" cy="18" r="3" fill="#00F0FF"/>

        <!-- Subtitle: TALENT SOLUTIONS -->
        <text x="2" y="63" 
              font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" 
              font-size="10.5" 
              font-weight="650" 
              letter-spacing="2.6" 
              fill="${descColor}">
          TALENT SOLUTIONS
        </text>
      </g>
    </svg>
  `;
}

// Write master assets
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
  <!-- Sleek rounded app tile -->
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

// 5. Brand Presentation Board (1920x1080 Full HD Preview)
const boardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" fill="none">
  <defs>
    <linearGradient id="board-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070D19"/>
      <stop offset="50%" stop-color="#0A1426"/>
      <stop offset="100%" stop-color="#040711"/>
    </linearGradient>
    <radialGradient id="board-glow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#1E3A8A" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1920" height="1080" fill="url(#board-bg)"/>
  <rect width="1920" height="1080" fill="url(#board-glow)"/>

  <!-- Header -->
  <text x="120" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#38BDF8" letter-spacing="4">
    ATSAI TECHNOLOGIES · OFFICIAL BRAND IDENTITY &amp; DESIGN SYSTEM
  </text>
  <text x="120" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="46" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">
    Intelligent Talent Acquisition. Engineered for Scale.
  </text>
  <text x="120" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#94A3B8">
    The new official high-definition vector logo and application emblem for ATSAI Technologies.
  </text>

  <!-- Card 1: Light Mode Display -->
  <g transform="translate(120, 260)">
    <rect width="800" height="420" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <g transform="translate(180, 160) scale(1.2)">
      ${getFullLogoSvg(false, "board-light")}
    </g>
    <text x="50" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#2563EB" letter-spacing="1.5">
      LIGHT MODE PRESENTATION
    </text>
    <text x="50" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#64748B">
      Master lockup for light headers, white documents, and corporate stationery.
    </text>
  </g>

  <!-- Card 2: Dark Mode Display -->
  <g transform="translate(980, 260)">
    <rect width="820" height="420" rx="20" fill="#0C1424" stroke="#1E293B" stroke-width="2"/>
    <g transform="translate(190, 160) scale(1.2)">
      ${getFullLogoSvg(true, "board-dark")}
    </g>
    <text x="50" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#38BDF8" letter-spacing="1.5">
      DARK MODE PRESENTATION
    </text>
    <text x="50" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#94A3B8">
      Luminous sapphire &amp; electric cyan radiance for dark interfaces and dashboard chrome.
    </text>
  </g>

  <!-- Bottom Row: Emblem Breakdown & Grid -->
  <g transform="translate(120, 720)">
    <rect width="1680" height="260" rx="20" fill="#0E192D" stroke="#1E293B" stroke-width="1.5"/>
    
    <!-- Icon 128px -->
    <g transform="translate(60, 45)">
      <svg width="170" height="170" viewBox="0 0 100 100">
        ${getEmblemVector("board-sym-large")}
      </svg>
    </g>

    <text x="270" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#FFFFFF">
      The Apex Nexus Emblem
    </text>
    <text x="270" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94A3B8" width="600">
      Constructed from geometric precision planes: The dual-pillar 'A' frame represents ATSAI architecture;
    </text>
    <text x="270" y="150" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94A3B8">
      the interior ascending chevron symbolizes career progression &amp; hiring success; the luminous spark node marks AI convergence.
    </text>

    <!-- App Icon preview -->
    <g transform="translate(1360, 45)">
      <svg width="170" height="170" viewBox="0 0 112 112">
        <rect width="112" height="112" rx="26" fill="url(#icon-bg)"/>
        <rect x="1" y="1" width="110" height="110" rx="25" fill="none" stroke="url(#icon-border)" stroke-width="1.5"/>
        <g transform="translate(10, 10) scale(0.92)">
          ${getEmblemVector("app-icon-prev")}
        </g>
      </svg>
    </g>
    <text x="1100" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">
      App Store &amp; Favicon Master
    </text>
    <text x="1100" y="135" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#64748B">
      Pre-rendered in 16px, 32px, 64px, 180px &amp; 1024px.
    </text>
  </g>
</svg>
`;

fs.writeFileSync(new URL("atsai-brand-preview.svg", brandDir), boardSvg);
await sharp(Buffer.from(boardSvg)).png().toFile(fileURLToPath(new URL("atsai-brand-preview.png", brandDir)));

console.log("Master brand identity assets generated successfully!");
