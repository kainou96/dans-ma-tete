import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Ensure public directories exist
fs.mkdirSync('public/icons', { recursive: true });

// 1. Create beautiful SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="70%" stop-color="#090a16" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <linearGradient id="roseAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="50%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
    <linearGradient id="metallic" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.7" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGlow)"/>
  <rect width="512" height="512" rx="112" fill="none" stroke="url(#roseAccent)" stroke-width="6" stroke-opacity="0.4"/>

  <!-- Outer Vinyl Ring -->
  <circle cx="256" cy="256" r="190" fill="#0b0d17" stroke="#1f2438" stroke-width="4"/>
  <circle cx="256" cy="256" r="160" fill="none" stroke="#252b42" stroke-width="1.5" stroke-dasharray="12 6"/>
  <circle cx="256" cy="256" r="130" fill="none" stroke="#2a3250" stroke-width="1.5"/>
  <circle cx="256" cy="256" r="100" fill="none" stroke="#333d60" stroke-width="1"/>

  <!-- Vinyl Center Label -->
  <circle cx="256" cy="256" r="75" fill="url(#roseAccent)" opacity="0.95"/>
  <circle cx="256" cy="256" r="22" fill="#020617"/>
  <circle cx="256" cy="256" r="10" fill="#f43f5e"/>

  <!-- Stylish Soundwave Bars in Top/Bottom Arc -->
  <path d="M190 256 A66 66 0 0 1 322 256" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
  <path d="M210 256 A46 46 0 0 1 302 256" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.95"/>

  <!-- Glowing Sound Sparks -->
  <circle cx="256" cy="115" r="5" fill="#f43f5e"/>
  <circle cx="370" cy="210" r="4" fill="#ec4899"/>
  <circle cx="145" cy="305" r="4" fill="#a855f7"/>
</svg>`;

fs.writeFileSync('public/icons/icon.svg', svgContent);
fs.writeFileSync('public/favicon.svg', svgContent);

// Helper to write a basic uncompressed PNG
function createPNG(size, primaryColor = [244, 63, 94]) {
  const width = size;
  const height = size;

  // Buffer for raw image data (height rows, each with 1 filter byte + width * 4 bytes RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.46;
  const rVinyl = width * 0.38;
  const rCenter = width * 0.16;
  const rHole = width * 0.045;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = 2;
      let g = 6;
      let b = 23;
      let a = 255;

      if (dist <= rHole) {
        // Center spindle hole
        r = 2;
        g = 6;
        b = 23;
        a = 255;
      } else if (dist <= rCenter) {
        // Center label (rose-pink vibrant)
        const t = dist / rCenter;
        r = Math.round(244 * (1 - t * 0.2));
        g = Math.round(63 * (1 - t * 0.2));
        b = Math.round(94 + 80 * t);
        a = 255;
      } else if (dist <= rVinyl) {
        // Vinyl grooves
        const ring = Math.sin(dist * 0.8) * 0.5 + 0.5;
        const val = 12 + Math.round(ring * 24);
        r = val;
        g = val + 4;
        b = val + 14;
        a = 255;
      } else if (dist <= rOuter) {
        // Outer dark ring
        r = 8;
        g = 10;
        b = 20;
        a = 255;
      } else {
        // App icon rounded squircle background
        const margin = width * 0.08;
        const inSquircle = x >= margin && x <= width - margin && y >= margin && y <= height - margin;
        if (inSquircle) {
          r = 3;
          g = 7;
          b = 20;
          a = 255;
        } else {
          r = 2;
          g = 6;
          b = 23;
          a = 255;
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // Helper chunk writer
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc32(body), 0);

    return Buffer.concat([len, body, crcBuf]);
  }

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Minimal CRC32 implementation
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return ~c;
}

const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

// Generate files
const png192 = createPNG(192);
const png512 = createPNG(512);

fs.writeFileSync('public/icons/icon-192.png', png192);
fs.writeFileSync('public/icons/icon-512.png', png512);
fs.writeFileSync('public/apple-touch-icon.png', png192);
console.log('Successfully generated PWA icons!');
