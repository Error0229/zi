/* ═══════════════════════════════════════════════════════════════════════════
   GIF Parser - Extract frames from animated GIFs
   Pure JavaScript implementation without external dependencies
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GifFrame {
  imageData: ImageData;
  delay: number; // Frame delay in milliseconds
}

export interface ParsedGif {
  width: number;
  height: number;
  frames: GifFrame[];
}

/**
 * Parse a GIF file and extract all frames
 * Uses canvas to render each frame and extract ImageData
 */
export async function parseGif(arrayBuffer: ArrayBuffer): Promise<ParsedGif> {
  const bytes = new Uint8Array(arrayBuffer);

  // Verify GIF signature
  const signature = String.fromCharCode(...bytes.slice(0, 6));
  if (!signature.startsWith('GIF')) {
    throw new Error('Not a valid GIF file');
  }

  // Read logical screen descriptor
  const width = bytes[6] | (bytes[7] << 8);
  const height = bytes[8] | (bytes[9] << 8);
  const packed = bytes[10];
  const hasGlobalColorTable = (packed & 0x80) !== 0;
  const globalColorTableSize = 1 << ((packed & 0x07) + 1);

  let offset = 13;

  // Skip global color table if present
  let globalColorTable: Uint8Array | null = null;
  if (hasGlobalColorTable) {
    globalColorTable = bytes.slice(offset, offset + globalColorTableSize * 3);
    offset += globalColorTableSize * 3;
  }

  const frames: { data: Uint8Array; delay: number; left: number; top: number; frameWidth: number; frameHeight: number; localColorTable: Uint8Array | null; disposalMethod: number; transparentIndex: number }[] = [];
  let currentDelay = 100; // Default 100ms
  let transparentIndex = -1;
  let disposalMethod = 0;

  // Parse blocks
  while (offset < bytes.length) {
    const blockType = bytes[offset++];

    if (blockType === 0x21) {
      // Extension block
      const extType = bytes[offset++];

      if (extType === 0xF9) {
        // Graphics Control Extension
        offset++; // Block size (always 4)
        const gcPacked = bytes[offset++];
        disposalMethod = (gcPacked >> 2) & 0x07;
        const hasTransparent = (gcPacked & 0x01) !== 0;
        currentDelay = (bytes[offset] | (bytes[offset + 1] << 8)) * 10;
        offset += 2;
        transparentIndex = hasTransparent ? bytes[offset++] : -1;
        offset++; // Block terminator
      } else {
        // Skip other extensions
        while (bytes[offset] !== 0) {
          offset += bytes[offset] + 1;
        }
        offset++; // Block terminator
      }
    } else if (blockType === 0x2C) {
      // Image descriptor
      const left = bytes[offset] | (bytes[offset + 1] << 8);
      const top = bytes[offset + 2] | (bytes[offset + 3] << 8);
      const frameWidth = bytes[offset + 4] | (bytes[offset + 5] << 8);
      const frameHeight = bytes[offset + 6] | (bytes[offset + 7] << 8);
      const imgPacked = bytes[offset + 8];
      offset += 9;

      const hasLocalColorTable = (imgPacked & 0x80) !== 0;
      const localColorTableSize = 1 << ((imgPacked & 0x07) + 1);
      const interlaced = (imgPacked & 0x40) !== 0;

      let localColorTable: Uint8Array | null = null;
      if (hasLocalColorTable) {
        localColorTable = bytes.slice(offset, offset + localColorTableSize * 3);
        offset += localColorTableSize * 3;
      }

      // Read LZW minimum code size
      const minCodeSize = bytes[offset++];

      // Read image data sub-blocks
      const imageDataBlocks: Uint8Array[] = [];
      while (bytes[offset] !== 0) {
        const blockSize = bytes[offset++];
        imageDataBlocks.push(bytes.slice(offset, offset + blockSize));
        offset += blockSize;
      }
      offset++; // Block terminator

      // Concatenate all data blocks
      const totalSize = imageDataBlocks.reduce((sum, block) => sum + block.length, 0);
      const imageData = new Uint8Array(totalSize);
      let dataOffset = 0;
      for (const block of imageDataBlocks) {
        imageData.set(block, dataOffset);
        dataOffset += block.length;
      }

      // Decompress LZW data
      const pixels = decompressLZW(imageData, minCodeSize, frameWidth * frameHeight);

      // Deinterlace if needed
      const finalPixels = interlaced ? deinterlace(pixels, frameWidth, frameHeight) : pixels;

      frames.push({
        data: finalPixels,
        delay: currentDelay || 100,
        left,
        top,
        frameWidth,
        frameHeight,
        localColorTable,
        disposalMethod,
        transparentIndex,
      });

      // Reset for next frame
      currentDelay = 100;
      transparentIndex = -1;
      disposalMethod = 0;
    } else if (blockType === 0x3B) {
      // Trailer - end of GIF
      break;
    } else if (blockType === 0x00) {
      // Padding
      continue;
    } else {
      // Unknown block, try to skip
      break;
    }
  }

  // Convert indexed frames to ImageData
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const resultFrames: GifFrame[] = [];
  let previousImageData: ImageData | null = null;

  for (const frame of frames) {
    const colorTable = frame.localColorTable || globalColorTable;
    if (!colorTable) continue;

    // Handle disposal method from previous frame
    if (previousImageData) {
      ctx.putImageData(previousImageData, 0, 0);
    }

    // Create frame image data
    const frameImageData = ctx.getImageData(0, 0, width, height);
    const pixels = frameImageData.data;

    // Draw frame pixels
    for (let y = 0; y < frame.frameHeight; y++) {
      for (let x = 0; x < frame.frameWidth; x++) {
        const srcIndex = y * frame.frameWidth + x;
        const colorIndex = frame.data[srcIndex];

        if (colorIndex === frame.transparentIndex) {
          continue; // Skip transparent pixels
        }

        const dstX = frame.left + x;
        const dstY = frame.top + y;
        if (dstX >= width || dstY >= height) continue;

        const dstIndex = (dstY * width + dstX) * 4;
        const colorOffset = colorIndex * 3;

        pixels[dstIndex] = colorTable[colorOffset];
        pixels[dstIndex + 1] = colorTable[colorOffset + 1];
        pixels[dstIndex + 2] = colorTable[colorOffset + 2];
        pixels[dstIndex + 3] = 255;
      }
    }

    ctx.putImageData(frameImageData, 0, 0);

    // Store previous image data based on disposal method
    if (frame.disposalMethod === 1 || frame.disposalMethod === 0) {
      // Do not dispose - keep the frame
      previousImageData = ctx.getImageData(0, 0, width, height);
    } else if (frame.disposalMethod === 2) {
      // Restore to background
      ctx.clearRect(frame.left, frame.top, frame.frameWidth, frame.frameHeight);
      previousImageData = ctx.getImageData(0, 0, width, height);
    } else if (frame.disposalMethod === 3) {
      // Restore to previous - previousImageData stays the same
    }

    resultFrames.push({
      imageData: ctx.getImageData(0, 0, width, height),
      delay: frame.delay,
    });
  }

  return { width, height, frames: resultFrames };
}

/**
 * LZW Decompression for GIF
 */
function decompressLZW(data: Uint8Array, minCodeSize: number, pixelCount: number): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;

  let codeSize = minCodeSize + 1;
  let codeMask = (1 << codeSize) - 1;
  let nextCode = endCode + 1;

  // Initialize code table
  const codeTable: number[][] = [];
  for (let i = 0; i < clearCode; i++) {
    codeTable[i] = [i];
  }
  codeTable[clearCode] = [];
  codeTable[endCode] = [];

  const output = new Uint8Array(pixelCount);
  let outputIndex = 0;

  let bits = 0;
  let bitCount = 0;
  let dataIndex = 0;
  let prevCode = -1;

  const readCode = (): number => {
    while (bitCount < codeSize && dataIndex < data.length) {
      bits |= data[dataIndex++] << bitCount;
      bitCount += 8;
    }
    const code = bits & codeMask;
    bits >>= codeSize;
    bitCount -= codeSize;
    return code;
  };

  while (outputIndex < pixelCount && dataIndex <= data.length) {
    const code = readCode();

    if (code === clearCode) {
      codeSize = minCodeSize + 1;
      codeMask = (1 << codeSize) - 1;
      nextCode = endCode + 1;
      codeTable.length = endCode + 1;
      for (let i = 0; i < clearCode; i++) {
        codeTable[i] = [i];
      }
      prevCode = -1;
      continue;
    }

    if (code === endCode) {
      break;
    }

    let entry: number[];
    if (code < nextCode) {
      entry = codeTable[code];
    } else if (code === nextCode && prevCode !== -1) {
      entry = [...codeTable[prevCode], codeTable[prevCode][0]];
    } else {
      // Invalid code
      break;
    }

    // Output the entry
    for (const pixel of entry) {
      if (outputIndex < pixelCount) {
        output[outputIndex++] = pixel;
      }
    }

    // Add new code to table
    if (prevCode !== -1 && nextCode < 4096) {
      codeTable[nextCode++] = [...codeTable[prevCode], entry[0]];

      if (nextCode > codeMask && codeSize < 12) {
        codeSize++;
        codeMask = (1 << codeSize) - 1;
      }
    }

    prevCode = code;
  }

  return output;
}

/**
 * Deinterlace GIF frame data
 */
function deinterlace(pixels: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(pixels.length);
  const passes = [
    { start: 0, step: 8 },
    { start: 4, step: 8 },
    { start: 2, step: 4 },
    { start: 1, step: 2 },
  ];

  let srcIndex = 0;
  for (const pass of passes) {
    for (let y = pass.start; y < height; y += pass.step) {
      for (let x = 0; x < width; x++) {
        result[y * width + x] = pixels[srcIndex++];
      }
    }
  }

  return result;
}

/**
 * Check if a file is an animated GIF
 */
export function isAnimatedGif(arrayBuffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(arrayBuffer);

  // Check GIF signature
  const signature = String.fromCharCode(...bytes.slice(0, 6));
  if (!signature.startsWith('GIF')) {
    return false;
  }

  // Count image descriptors (0x2C blocks)
  let imageCount = 0;
  let offset = 13;

  // Skip global color table
  const packed = bytes[10];
  if (packed & 0x80) {
    const colorTableSize = 1 << ((packed & 0x07) + 1);
    offset += colorTableSize * 3;
  }

  while (offset < bytes.length) {
    const blockType = bytes[offset++];

    if (blockType === 0x21) {
      // Extension - skip
      offset++;
      while (offset < bytes.length && bytes[offset] !== 0) {
        offset += bytes[offset] + 1;
      }
      offset++;
    } else if (blockType === 0x2C) {
      imageCount++;
      if (imageCount > 1) return true;

      // Skip image descriptor
      offset += 8;
      const imgPacked = bytes[offset++];

      // Skip local color table
      if (imgPacked & 0x80) {
        const localColorTableSize = 1 << ((imgPacked & 0x07) + 1);
        offset += localColorTableSize * 3;
      }

      // Skip LZW data
      offset++; // min code size
      while (offset < bytes.length && bytes[offset] !== 0) {
        offset += bytes[offset] + 1;
      }
      offset++;
    } else if (blockType === 0x3B || blockType === 0x00) {
      break;
    }
  }

  return imageCount > 1;
}
