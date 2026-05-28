/**
 * Convert build/icon.png to a proper multi-size ICO file at build/icon.ico
 * ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
 * 
 * We use Jimp to resize the PNG to standard icon sizes (256, 128, 64, 48, 32, 16)
 * then embed each as a PNG entry inside the ICO container.
 */
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const SIZES = [256, 128, 64, 48, 32, 16];

async function createIco() {
  const srcPath = path.join(__dirname, '..', 'build', 'icon.png');
  const outPath = path.join(__dirname, '..', 'build', 'icon.ico');

  console.log('Reading source PNG:', srcPath);
  const src = await Jimp.read(srcPath);

  // Generate PNG buffers for each size
  const pngBuffers = [];
  for (const size of SIZES) {
    const resized = src.clone().resize(size, size, Jimp.RESIZE_LANCZOS3);
    const buf = await resized.getBufferAsync(Jimp.MIME_PNG);
    pngBuffers.push({ size, buf });
    console.log(`  Generated ${size}x${size} (${buf.length} bytes)`);
  }

  // Build ICO file
  // ICO Header: 6 bytes
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * numImages;
  let dataOffset = headerSize + dirSize;

  // Calculate total size
  let totalSize = dataOffset;
  for (const { buf } of pngBuffers) {
    totalSize += buf.length;
  }

  const ico = Buffer.alloc(totalSize);

  // ICO Header
  ico.writeUInt16LE(0, 0);       // Reserved
  ico.writeUInt16LE(1, 2);       // Type: 1 = ICO
  ico.writeUInt16LE(numImages, 4); // Number of images

  // Directory entries + image data
  let offset = dataOffset;
  for (let i = 0; i < pngBuffers.length; i++) {
    const { size, buf } = pngBuffers[i];
    const dirOffset = headerSize + (i * dirEntrySize);

    // Width (0 means 256)
    ico.writeUInt8(size >= 256 ? 0 : size, dirOffset);
    // Height (0 means 256)
    ico.writeUInt8(size >= 256 ? 0 : size, dirOffset + 1);
    // Color palette (0 = no palette)
    ico.writeUInt8(0, dirOffset + 2);
    // Reserved
    ico.writeUInt8(0, dirOffset + 3);
    // Color planes
    ico.writeUInt16LE(1, dirOffset + 4);
    // Bits per pixel
    ico.writeUInt16LE(32, dirOffset + 6);
    // Size of image data
    ico.writeUInt32LE(buf.length, dirOffset + 8);
    // Offset to image data
    ico.writeUInt32LE(offset, dirOffset + 12);

    // Copy PNG data
    buf.copy(ico, offset);
    offset += buf.length;
  }

  fs.writeFileSync(outPath, ico);
  console.log(`\nICO written to: ${outPath} (${ico.length} bytes)`);
}

createIco().catch(err => {
  console.error('Failed to create ICO:', err);
  process.exit(1);
});
