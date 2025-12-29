/* ═══════════════════════════════════════════════════════════════════════════
   GIF Parser - Extract frames from animated GIFs
   Uses gifuct-js for reliable GIF parsing
   ═══════════════════════════════════════════════════════════════════════════ */

import { parseGIF, decompressFrames } from 'gifuct-js';

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
 */
export async function parseGif(arrayBuffer: ArrayBuffer): Promise<ParsedGif> {
  // Parse the GIF structure
  const gif = parseGIF(arrayBuffer);

  // Decompress all frames
  const frames = decompressFrames(gif, true);

  if (frames.length === 0) {
    throw new Error('No frames found in GIF');
  }

  const width = gif.lsd.width;
  const height = gif.lsd.height;

  // Create a canvas for compositing frames
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Temporary canvas for frame patches
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;

  const resultFrames: GifFrame[] = [];

  for (const frame of frames) {
    // Get frame dimensions and position
    const frameWidth = frame.dims.width;
    const frameHeight = frame.dims.height;
    const frameLeft = frame.dims.left;
    const frameTop = frame.dims.top;

    // Create ImageData for this frame's patch
    tempCanvas.width = frameWidth;
    tempCanvas.height = frameHeight;
    const frameImageData = tempCtx.createImageData(frameWidth, frameHeight);

    // Copy pixel data (gifuct-js gives us RGBA data)
    frameImageData.data.set(frame.patch);

    // Draw the frame patch onto the temp canvas
    tempCtx.putImageData(frameImageData, 0, 0);

    // Draw the patch onto the main canvas at the correct position
    ctx.drawImage(tempCanvas, frameLeft, frameTop);

    // Capture the full composited frame
    const fullFrame = ctx.getImageData(0, 0, width, height);

    // gifuct-js returns delay in centiseconds (1/100s)
    // delay: 0 should be treated as 10cs (100ms) per browser behavior
    const delayMs = (frame.delay || 10) * 10;

    resultFrames.push({
      imageData: fullFrame,
      delay: delayMs,
    });

    // Handle disposal method
    if (frame.disposalType === 2) {
      // Restore to background color (clear the frame area)
      ctx.clearRect(frameLeft, frameTop, frameWidth, frameHeight);
    } else if (frame.disposalType === 3) {
      // Restore to previous - we'd need to save/restore canvas state
      // For simplicity, we'll treat it like disposal type 1 (do not dispose)
    }
    // disposalType 0 or 1: do not dispose, leave as is
  }

  return { width, height, frames: resultFrames };
}

/**
 * Check if a file is an animated GIF (has more than one frame)
 */
export function isAnimatedGif(arrayBuffer: ArrayBuffer): boolean {
  try {
    const gif = parseGIF(arrayBuffer);
    const frames = decompressFrames(gif, true);
    return frames.length > 1;
  } catch {
    return false;
  }
}
