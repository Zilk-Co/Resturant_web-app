const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  // Image data (raw RGB with filter bytes)
  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const offset = y * (1 + width * 3);
    rawData[offset] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3;
      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
    }
  }
  
  const compressed = zlib.deflateSync(rawData);
  
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuffer = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = crc32(crcData);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuffer, data, crcBuffer]);
  }
  
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const assetsDir = path.join(__dirname, 'assets');

// THB brand green: #1A3525
const icon1024 = createPNG(1024, 1024, 0x1A, 0x35, 0x25);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon1024);
console.log('icon.png created:', icon1024.length, 'bytes');

const adaptive1024 = createPNG(1024, 1024, 0x1A, 0x35, 0x25);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptive1024);
console.log('adaptive-icon.png created:', adaptive1024.length, 'bytes');

const splash1284 = createPNG(1284, 2778, 0x1A, 0x35, 0x25);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), splash1284);
console.log('splash.png created:', splash1284.length, 'bytes');

const favicon = createPNG(48, 48, 0x1A, 0x35, 0x25);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), favicon);
console.log('favicon.png created:', favicon.length, 'bytes');
