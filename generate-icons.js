const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, pixelFn) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Warm organic painter: #F8F5ED bg, #F0E9DA card, #185C46 forest green accent
function iconPainter(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radius = w * 0.44;

  if (dist > radius) {
    return [248, 245, 237, 255]; // #F8F5ED
  }

  // Outer border ring: #185C46
  const ringDist = Math.abs(dist - radius * 0.90);
  if (ringDist < w * 0.035) {
    return [24, 92, 70, 255]; // #185C46 Forest Green
  }

  // Inner card circle: #F0E9DA
  if (dist < radius * 0.88) {
    // Leaf / botanical emblem at top
    if (y < cy - h * 0.12 && y > cy - h * 0.35) {
      const leafDx = dx * 1.5;
      const leafDy = y - (cy - h * 0.24);
      if (Math.sqrt(leafDx * leafDx + leafDy * leafDy) < w * 0.12) {
        return [24, 92, 70, 255]; // #185C46
      }
    }

    // Plate & pancake stack at center
    const pc1Y = cy + h * 0.04;
    const pcDy = (y - pc1Y) * 2.5;
    if (Math.sqrt(dx * dx + pcDy * pcDy) < w * 0.26) {
      return [217, 148, 20, 255]; // Golden Carbs #D99414
    }

    const pc2Y = cy + h * 0.14;
    const pc2Dy = (y - pc2Y) * 2.8;
    if (Math.sqrt(dx * dx + pc2Dy * pc2Dy) < w * 0.28) {
      return [180, 123, 22, 255];
    }

    return [240, 233, 218, 255]; // #F0E9DA Soft beige
  }

  return [250, 247, 242, 255]; // #FAF7F2
}

const iconsDir = path.join(__dirname, 'icons');
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPNG(192, 192, iconPainter));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPNG(512, 512, iconPainter));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createPNG(180, 180, iconPainter));

console.log('Warm natural PNG icons created successfully!');
