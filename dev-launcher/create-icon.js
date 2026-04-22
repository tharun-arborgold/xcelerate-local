#!/usr/bin/env node
// Generates assets/icon.png — 512×512 macOS app icon for Xcelerate Dev.
//
// Design:
//   Background : diagonal gradient, violet-600 → violet-950
//   Highlight  : radial white bloom at top-centre (glass feel)
//   Symbol     : geometric "X" — two crossing rounded bars (white, 92% opacity)
//   Radius     : 115px macOS squircle approximation
//   AA         : 2×2 supersampling per pixel for smooth edges

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

const SIZE = 512;
const R    = 115;   // corner radius — macOS standard ≈22.5% of width

// ── Colors ────────────────────────────────────────────────────────────────────
// Diagonal gradient: violet-600 (top-left) → violet-950 (bottom-right)
const FROM = [124,  58, 237];  // #7c3aed violet-600
const TO   = [ 46,  16,  84];  // #2e1054 violet-950 (deeper than Tailwind)

function lerp(a, b, t) { return a + (b - a) * t }

function bgColor(x, y) {
  const t = Math.min(1, Math.max(0, (x + y) / (SIZE * 1.6)));
  return [
    Math.round(lerp(FROM[0], TO[0], t)),
    Math.round(lerp(FROM[1], TO[1], t)),
    Math.round(lerp(FROM[2], TO[2], t)),
  ];
}

// Radial highlight: white overlay centred at (256, 170), radius 280px, max 13%
function highlightAlpha(x, y) {
  const hx = SIZE * 0.5, hy = SIZE * 0.33;
  const maxR = SIZE * 0.56;
  const d = Math.sqrt((x - hx) ** 2 + (y - hy) ** 2);
  return Math.max(0, 1 - d / maxR) * 0.13;
}

// ── Rounded-rect mask ────────────────────────────────────────────────────────
function inRRect(x, y) {
  const cx = x - SIZE / 2, cy = y - SIZE / 2;
  const hw = SIZE / 2 - R, hh = SIZE / 2 - R;
  const qx = Math.max(0, Math.abs(cx) - hw);
  const qy = Math.max(0, Math.abs(cy) - hh);
  return qx * qx + qy * qy <= R * R;
}

// ── X symbol — two rounded bars at ±45° ─────────────────────────────────────
// Bar dimensions: 320px long × 76px wide, 38px end radius
const BAR_HALF_L = 160;
const BAR_HALF_W = 38;
const BAR_R      = 38;

const K = Math.SQRT1_2; // 1/√2 ≈ 0.7071

function inBar(dx, dy, flipped) {
  // Rotate point to bar's local space (±45° bar = ∓45° point rotation)
  const rx = K * (flipped ? (dx - dy) : (dx + dy));
  const ry = K * (flipped ? (dx + dy) : (-dx + dy));

  // Rounded-rect SDF
  const qx = Math.max(0, Math.abs(rx) - (BAR_HALF_L - BAR_R));
  const qy = Math.max(0, Math.abs(ry) - (BAR_HALF_W - BAR_R));
  return qx * qx + qy * qy <= BAR_R * BAR_R;
}

function inX(x, y) {
  const dx = x - SIZE / 2, dy = y - SIZE / 2;
  return inBar(dx, dy, false) || inBar(dx, dy, true);
}

// ── CRC + PNG chunks ─────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const l = Buffer.alloc(4); l.writeUInt32BE(data.length);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([l, t, data, c]);
}

// ── Rasterise ─────────────────────────────────────────────────────────────────
// 2×2 supersampling: sample at (±0.25, ±0.25) offsets, average coverage.
const OFFSETS = [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];

const rows = [];
for (let py = 0; py < SIZE; py++) {
  const row = Buffer.alloc(1 + SIZE * 4);
  row[0] = 0; // filter type: None

  for (let px = 0; px < SIZE; px++) {
    let bgR = 0, bgG = 0, bgB = 0;
    let maskSum = 0, xSum = 0, hlSum = 0;

    for (const [ox, oy] of OFFSETS) {
      const x = px + ox, y = py + oy;
      const inside = inRRect(x, y);
      if (inside) {
        const [r, g, b] = bgColor(x, y);
        bgR += r; bgG += g; bgB += b;
        maskSum += 1;
        if (inX(x, y)) xSum += 1;
        hlSum += highlightAlpha(x, y);
      }
    }

    if (maskSum === 0) {
      // Fully transparent (outside rounded rect)
      row[1 + px * 4]     = 0;
      row[1 + px * 4 + 1] = 0;
      row[1 + px * 4 + 2] = 0;
      row[1 + px * 4 + 3] = 0;
      continue;
    }

    // Average background
    let r = bgR / maskSum;
    let g = bgG / maskSum;
    let b = bgB / maskSum;

    // Blend X symbol (white at 92% opacity, coverage-weighted)
    const xCov = xSum / 4;     // 0–1 anti-aliased X coverage
    const xA   = xCov * 0.92;
    r = r + (255 - r) * xA;
    g = g + (255 - g) * xA;
    b = b + (255 - b) * xA;

    // Blend radial highlight (white overlay)
    const hlA = (hlSum / 4);
    r = r + (255 - r) * hlA;
    g = g + (255 - g) * hlA;
    b = b + (255 - b) * hlA;

    // Pixel alpha (anti-aliased edge of rounded rect)
    const alpha = Math.round((maskSum / 4) * 255);

    row[1 + px * 4]     = Math.min(255, Math.round(r));
    row[1 + px * 4 + 1] = Math.min(255, Math.round(g));
    row[1 + px * 4 + 2] = Math.min(255, Math.round(b));
    row[1 + px * 4 + 3] = alpha;
  }

  rows.push(row);
}

// ── Write PNG ─────────────────────────────────────────────────────────────────
const compressed = zlib.deflateSync(Buffer.concat(rows), { level: 9 });

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; ihdr[9] = 6; // bit depth 8, colour type RGBA

const out = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG magic
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
]);

const dest = path.join(__dirname, 'assets', 'icon.png');
fs.writeFileSync(dest, out);
console.log('✓ icon written to', dest, `(${out.length} bytes)`);
