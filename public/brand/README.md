# ATSAI brand assets

The same recruitment shield, people and checkmark appear in the header and footer. The wordmark uses upright Helvetica Bold for both ATS and AI, separated by a deliberate gap. Neither word uses italics. AI has a blue accent; the supporting descriptor remains a clean sans serif. Lettering colors adapt for light and dark backgrounds. All lettering is stored as vector outlines, so visitors need no installed fonts.

- `atsai-logo-light.svg`: scalable vector for white/light backgrounds.
- `atsai-logo-dark.svg`: identical geometry with light lettering for navy/dark backgrounds.
- `atsai-logo-light-4k.png` and `atsai-logo-dark-4k.png`: transparent 3840-pixel-wide exports.
- `atsai-symbol.svg` and `atsai-symbol-1024.png`: standalone emblem.
- `atsai-brand-preview.png`: 1920 x 1080 presentation showing both treatments.
- `apple-touch-icon.png`: matching mobile bookmark icon.

Master geometry: `src/lib/brandArtwork.json`. Website component: `src/components/common/BrandLogo.tsx`.

Regenerate assets from the project root with `node scripts/export-brand.mjs`. Logo lettering is stored as vector outlines, so it requires no installed fonts. Leave clear space around the artwork; preserve its aspect ratio; do not add glows, outlines, gradients or a different subtitle to one placement.

Palette: sapphire #2864EA, blue #3478F6, teal #0E9E94, navy #142C49. Dark-background lettering: #F7FAFF with #B0C1D8 descriptor.
