import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 2; // Color type: 2 (Truecolor RGB)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines: Each scanline starts with filter byte 0
  const rowBytes = width * 3;
  const rawData = Buffer.alloc((rowBytes + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = width * 0.42;
  const innerRadius = width * 0.22;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < innerRadius) {
        // Emerald center
        rawData[offset++] = 16;  // R
        rawData[offset++] = 185; // G
        rawData[offset++] = 129; // B
      } else if (dist < outerRadius) {
        // Dark slate
        rawData[offset++] = 30;  // R
        rawData[offset++] = 41;  // G
        rawData[offset++] = 59;  // B
      } else {
        // Background Navy
        rawData[offset++] = 15;  // R
        rawData[offset++] = 23;  // G
        rawData[offset++] = 42;  // B
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const buf = Buffer.alloc(8 + length + 4);
  buf.writeUInt32BE(length, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  // CRC32
  const crcTarget = buf.subarray(4, 8 + length);
  const crcVal = crc32(crcTarget);
  buf.writeInt32BE(crcVal, 8 + length);
  return buf;
}

// Simple CRC32 implementation
function crc32(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (c ^ buf[n]) >>> 0;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) | 0;
}

const p192 = createPng(192, 192);
fs.writeFileSync('./public/pwa-192x192.png', p192);

const p512 = createPng(512, 512);
fs.writeFileSync('./public/pwa-512x512.png', p512);
fs.writeFileSync('./public/pwa-maskable-512x512.png', p512);
fs.writeFileSync('./public/apple-touch-icon.png', createPng(180, 180));
fs.writeFileSync('./public/favicon.ico', createPng(32, 32));

console.log('PNG icons created successfully');
