#!/usr/bin/env node
// Generates src/renderer/globals.css with AlignUI design tokens
// Primary: purple, Neutral: slate, Format: hex (dark-mode app)
const fs = require('fs');

const colors = {
  gray:   { 950:"#171717",900:"#1c1c1c",800:"#262626",700:"#333333",600:"#5c5c5c",500:"#7b7b7b",400:"#a3a3a3",300:"#d1d1d1",200:"#ebebeb",100:"#f5f5f5",50:"#f7f7f7",0:"#ffffff","alpha-24":"#a3a3a33d","alpha-16":"#a3a3a329","alpha-10":"#a3a3a31a" },
  slate:  { 950:"#0e121b",900:"#181b25",800:"#222530",700:"#2b303b",600:"#525866",500:"#717784",400:"#99a0ae",300:"#cacfd8",200:"#eaecf0",100:"#f2f5f8",50:"#f5f7fa",0:"#ffffff","alpha-24":"#99a0ae3d","alpha-16":"#99a0ae29","alpha-10":"#99a0ae1a" },
  blue:   { 950:"#122368",900:"#182f8b",800:"#1f3bad",700:"#2547d0",600:"#3559e9",500:"#335cff",400:"#4d82ff",300:"#97baff",200:"#c0d5ff",100:"#d5e2ff",50:"#ebf1ff","alpha-24":"#476cff3d","alpha-16":"#476cff29","alpha-10":"#476cff1a" },
  orange: { 950:"#71330a",900:"#96440d",800:"#b75310",700:"#ce5e12",600:"#e16614",500:"#fa7319",400:"#ffa468",300:"#ffc197",200:"#ffd9c0",100:"#ffe6d5",50:"#fff3eb","alpha-24":"#fa73193d","alpha-16":"#fa731929","alpha-10":"#fa73191a" },
  red:    { 950:"#681219",900:"#8b1822",800:"#ad1f2b",700:"#d02533",600:"#e93544",500:"#fb3748",400:"#ff6875",300:"#ff97a0",200:"#ffc0c5",100:"#ffd5d8",50:"#ffebec","alpha-24":"#fb37483d","alpha-16":"#fb374829","alpha-10":"#fb37481a" },
  green:  { 950:"#0b4627",900:"#16643b",800:"#1a7544",700:"#178c4e",600:"#1daf61",500:"#1fc16b",400:"#3ee089",300:"#84ebb4",200:"#c2f5da",100:"#d6f5e8",50:"#e3f7ec","alpha-24":"#1fc16b3d","alpha-16":"#1fc16b29","alpha-10":"#1fc16b1a" },
  yellow: { 950:"#624c18",900:"#86661d",800:"#a78025",700:"#c99a2c",600:"#e6a819",500:"#f6b51e",400:"#ffd268",300:"#ffe097",200:"#ffecc0",100:"#ffefcc",50:"#fffaeb","alpha-24":"#fbc64b3d","alpha-16":"#fbc64b29","alpha-10":"#fbc64b1a" },
  purple: { 950:"#351a75",900:"#3d1d86",800:"#4c25a7",700:"#5b2cc9",600:"#693ee0",500:"#7d52f4",400:"#8c71f6",300:"#a897ff",200:"#cac0ff",100:"#dcd5ff",50:"#efebff","alpha-24":"#784def3d","alpha-16":"#784def29","alpha-10":"#784def1a" },
  sky:    { 950:"#124b68",900:"#18658b",800:"#1f7ead",700:"#2597d0",600:"#35ade9",500:"#47c2ff",400:"#68cdff",300:"#97dcff",200:"#c0eaff",100:"#d5f1ff",50:"#ebf8ff","alpha-24":"#47c2ff3d","alpha-16":"#47c2ff29","alpha-10":"#47c2ff1a" },
  pink:   { 950:"#68123d",900:"#8b1852",800:"#ad1f66",700:"#d0257a",600:"#e9358f",500:"#fb4ba3",400:"#ff68b3",300:"#ff97cb",200:"#ffc0df",100:"#ffd5ea",50:"#ffebf4","alpha-24":"#fb4ba33d","alpha-16":"#fb4ba329","alpha-10":"#fb4ba31a" },
  teal:   { 950:"#0b463e",900:"#16645a",800:"#1a7569",700:"#178c7d",600:"#1daf9c",500:"#22d3bb",400:"#3fdec9",300:"#84ebdd",200:"#c2f5ee",100:"#d0fbf5",50:"#e4fbf8","alpha-24":"#22d3bb3d","alpha-16":"#22d3bb29","alpha-10":"#22d3bb1a" },
};

// primary = purple, neutral = slate
const primary = colors.purple;
const neutral = colors.slate;

function colorVars(prefix, palette) {
  return Object.entries(palette)
    .map(([k, v]) => `  --color-${prefix}-${k}: ${v};`)
    .join('\n');
}

const css = `@import "tailwindcss";

@theme {
  /* ── AlignUI Raw Colors ──────────────────────────────────────── */
${Object.entries(colors).map(([name, palette]) => colorVars(name, palette)).join('\n')}

  /* ── Semantic: Neutral (slate) ───────────────────────────────── */
  --color-neutral-950: ${neutral[950]};
  --color-neutral-900: ${neutral[900]};
  --color-neutral-800: ${neutral[800]};
  --color-neutral-700: ${neutral[700]};
  --color-neutral-600: ${neutral[600]};
  --color-neutral-500: ${neutral[500]};
  --color-neutral-400: ${neutral[400]};
  --color-neutral-300: ${neutral[300]};
  --color-neutral-200: ${neutral[200]};
  --color-neutral-100: ${neutral[100]};
  --color-neutral-50: ${neutral[50]};
  --color-neutral-0: ${neutral[0]};
  --color-neutral-alpha-24: ${neutral['alpha-24']};
  --color-neutral-alpha-16: ${neutral['alpha-16']};
  --color-neutral-alpha-10: ${neutral['alpha-10']};

  /* ── Semantic: Primary (purple) ──────────────────────────────── */
  --color-primary-darker: ${primary[700]};
  --color-primary-dark: ${primary[600]};
  --color-primary-base: ${primary[500]};
  --color-primary-light: ${primary[400]};
  --color-primary-lighter: ${primary[300]};
  --color-primary-lightest: ${primary[200]};
  --color-primary-100: ${primary[100]};
  --color-primary-50: ${primary[50]};
  --color-primary-alpha-24: ${primary['alpha-24']};
  --color-primary-alpha-16: ${primary['alpha-16']};
  --color-primary-alpha-10: ${primary['alpha-10']};

  /* ── Semantic: Backgrounds ───────────────────────────────────── */
  --color-bg-white-0: ${neutral[0]};
  --color-bg-weak-50: ${neutral[50]};
  --color-bg-soft-200: ${neutral[200]};
  --color-bg-sub-300: ${neutral[300]};
  --color-bg-strong-950: ${neutral[950]};

  /* ── Semantic: State ─────────────────────────────────────────── */
  --color-error-base: ${colors.red[500]};
  --color-error-dark: ${colors.red[600]};
  --color-error-light: ${colors.red[400]};
  --color-error-alpha-10: ${colors.red['alpha-10']};

  --color-warning-base: ${colors.yellow[500]};
  --color-success-base: ${colors.green[500]};
  --color-information-base: ${colors.sky[500]};

  /* ── Semantic: Text ──────────────────────────────────────────── */
  --color-text-strong-950: ${neutral[950]};
  --color-text-sub-600: ${neutral[600]};
  --color-text-soft-400: ${neutral[400]};
  --color-text-disabled-300: ${neutral[300]};
  --color-text-white-0: ${neutral[0]};

  /* ── Semantic: Stroke ────────────────────────────────────────── */
  --color-stroke-strong-950: ${neutral[950]};
  --color-stroke-sub-300: ${neutral[300]};
  --color-stroke-soft-200: ${neutral[200]};
  --color-stroke-white-0: ${neutral[0]};
  --color-stroke-disabled-300: ${neutral[300]};

  /* ── Semantic: Icon ──────────────────────────────────────────── */
  --color-icon-strong-950: ${neutral[950]};
  --color-icon-sub-600: ${neutral[600]};
  --color-icon-soft-400: ${neutral[400]};
  --color-icon-disabled-300: ${neutral[300]};
  --color-icon-white-0: ${neutral[0]};

  /* ── Border radius ───────────────────────────────────────────── */
  --radius-10: 0.625rem;
  --radius-20: 1.25rem;

  /* ── Shadows ─────────────────────────────────────────────────── */
  --shadow-xs: 0 1px 2px 0 #0a0d1408;
  --shadow-sm: 0 2px 4px #1b1c1d0a;
  --shadow-md: 0 16px 32px -12px #0e121b1a;
  --shadow-button-primary-focus: 0 0 0 2px var(--color-bg-white-0), 0 0 0 4px var(--color-primary-alpha-10);
  --shadow-button-error-focus: 0 0 0 2px var(--color-bg-white-0), 0 0 0 4px var(--color-error-alpha-10);
  --shadow-tooltip: 0 12px 24px 0 #0e121b0f, 0 1px 2px 0 #0e121b08;

  /* ── Animations ──────────────────────────────────────────────── */
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}

@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}
@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}
`;

fs.writeFileSync('src/renderer/globals.css', css);
console.log('✓ globals.css written with AlignUI tokens (purple primary, slate neutral, hex format)');
