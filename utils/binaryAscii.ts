/* ═══════════════════════════════════════════════════════════════════════════
   Binary ASCII Art Generator - 二元卦象 ASCII 藝術
   Uses two hexagram characters: ䷁ (坤/dark) and the divined hexagram (bright)
   ═══════════════════════════════════════════════════════════════════════════ */

import { getAllHexagrams, calculateCharacterDensities } from './hexagrams';

const DARK_CHAR = '䷁'; // 坤 - used for dark areas

// Cache for sorted hexagrams by density
let sortedHexagramsCache: string[] | null = null;

/**
 * Get hexagrams sorted by visual density (cached)
 */
export async function getSortedHexagrams(): Promise<string[]> {
  if (sortedHexagramsCache) return sortedHexagramsCache;
  const allHexs = getAllHexagrams();
  sortedHexagramsCache = await calculateCharacterDensities(allHexs);
  return sortedHexagramsCache;
}

/**
 * Generate grayscale ASCII art from ImageData using all 64 hexagrams
 * This creates the "original image" ASCII representation
 */
export function generateImageAscii(
  imageData: ImageData,
  sortedHexagrams: string[],
  width: number = 50,
  contrast: number = 1.2,
  invert: boolean = false,
  brightness: number = 0,
  verticalSampling: number = 1.0
): string {
  const { data, width: imgWidth, height: imgHeight } = imageData;

  // Calculate height maintaining aspect ratio
  // Use verticalSampling to adjust for character aspect ratio
  const aspectRatio = imgHeight / imgWidth;
  const height = Math.max(1, Math.floor(width * aspectRatio * verticalSampling));

  const xStep = imgWidth / width;
  const yStep = imgHeight / height;
  const maxIndex = sortedHexagrams.length - 1;

  let ascii = '';

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sampleX = Math.floor(x * xStep);
      const sampleY = Math.floor(y * yStep);
      const idx = (sampleY * imgWidth + sampleX) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Grayscale with contrast and brightness
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;
      // Apply brightness (-50 to 50 maps to -0.2 to 0.2)
      gray = gray + brightness * 2.55;
      gray = Math.max(0, Math.min(255, gray));
      // Apply contrast
      const normalized = gray / 255 - 0.5;
      const contrasted = normalized * contrast + 0.5;
      gray = Math.max(0, Math.min(1, contrasted)) * 255;

      // Map to hexagram
      let index = invert
        ? Math.floor((gray / 255) * maxIndex)
        : Math.floor((1 - gray / 255) * maxIndex);
      index = Math.max(0, Math.min(maxIndex, index));

      ascii += sortedHexagrams[index];
    }
    ascii += '\n';
  }

  return ascii;
}

/**
 * Generate binary ASCII art from ImageData
 * Dark pixels → ䷁ (坤)
 * Bright pixels → the divined hexagram symbol
 */
export function generateBinaryAscii(
  imageData: ImageData,
  brightChar: string,
  width: number = 60,
  threshold: number = 128
): string {
  const { data, width: imgWidth, height: imgHeight } = imageData;

  // Calculate height maintaining aspect ratio
  // Hexagram characters are roughly square, so we use 0.5 vertical scale
  const aspectRatio = imgHeight / imgWidth;
  const height = Math.max(1, Math.floor(width * aspectRatio * 0.5));

  // Create sampling grid
  const xStep = imgWidth / width;
  const yStep = imgHeight / height;

  let ascii = '';

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Sample pixel at grid position
      const sampleX = Math.floor(x * xStep);
      const sampleY = Math.floor(y * yStep);
      const idx = (sampleY * imgWidth + sampleX) * 4;

      // Calculate brightness
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      // Binary choice
      ascii += brightness > threshold ? brightChar : DARK_CHAR;
    }
    ascii += '\n';
  }

  return ascii;
}

/**
 * Render a hexagram symbol to ImageData
 * Used to create ASCII art of the hexagram itself
 */
export function renderHexagramToImageData(
  hexagramSymbol: string,
  size: number = 200
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);

  // Draw hexagram
  ctx.fillStyle = 'black';
  ctx.font = `${size * 0.8}px "Noto Sans Symbols 2", "Segoe UI Symbol", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(hexagramSymbol, size / 2, size / 2);

  return ctx.getImageData(0, 0, size, size);
}

/**
 * Generate ASCII art of a hexagram's 6-line pattern
 * @param hexagramSymbol - the hexagram Unicode character to use for filled areas
 * @param lineTypes - array of 6 line types ('yang'|'yin'), index 0 = bottom line
 * @param width - exact character width to match viewport
 * @param height - exact character height to match viewport
 */
export function generateHexagramAscii(
  hexagramSymbol: string,
  lineTypes: ('yang' | 'yin')[],
  width: number,
  height: number
): string {
  const SPACE = '\u3000'; // Full-width space for correct spacing

  // Calculate layout - 6 lines with gaps between them
  const totalLines = 6;
  const totalGaps = 5;
  const lineHeight = Math.max(2, Math.floor(height / 10));
  const gapHeight = Math.max(1, Math.floor(height / 20));
  const contentHeight = totalLines * lineHeight + totalGaps * gapHeight;
  const marginY = Math.floor((height - contentHeight) / 2);
  const marginX = Math.floor(width * 0.2); // 20% margin on each side
  const lineWidth = width - 2 * marginX;
  const breakWidth = Math.max(3, Math.floor(lineWidth * 0.2)); // 20% break in middle for yin
  const breakStart = Math.floor((lineWidth - breakWidth) / 2);

  let ascii = '';

  for (let y = 0; y < height; y++) {
    let row = '';
    const contentY = y - marginY;

    // Determine which line (0-5) this row belongs to
    // Lines are drawn top to bottom: line 5 (top) to line 0 (bottom)
    let lineIndex = -1;
    let isInLineRow = false;

    if (contentY >= 0 && contentY < contentHeight) {
      const lineSlotHeight = lineHeight + gapHeight;
      const slot = Math.floor(contentY / lineSlotHeight);
      const posInSlot = contentY % lineSlotHeight;

      if (slot < 6 && posInSlot < lineHeight) {
        // lineTypes array is passed pre-reversed: [0]=top line, [5]=bottom line
        // slot 0 = top of screen, slot 5 = bottom of screen
        // Direct mapping: slot N uses lineTypes[N]
        lineIndex = slot;
        isInLineRow = true;
      }
    }

    for (let x = 0; x < width; x++) {
      if (!isInLineRow || lineIndex < 0 || lineIndex >= 6) {
        row += SPACE;
        continue;
      }

      const contentX = x - marginX;
      if (contentX < 0 || contentX >= lineWidth) {
        row += SPACE;
        continue;
      }

      const isYang = lineTypes[lineIndex] === 'yang';
      const isInBreak = contentX >= breakStart && contentX < breakStart + breakWidth;

      // Yang = solid line, Yin = broken line (gap in middle)
      if (isYang || !isInBreak) {
        row += hexagramSymbol;
      } else {
        row += SPACE;
      }
    }

    ascii += row + '\n';
  }

  return ascii;
}

/**
 * Animation frame generator for chaos phase
 * Returns random hexagram characters
 */
export function generateChaosFrame(
  width: number,
  height: number
): string {
  const hexStart = 0x4DC0;
  const hexEnd = 0x4DFF;
  let frame = '';

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const code = hexStart + Math.floor(Math.random() * (hexEnd - hexStart + 1));
      frame += String.fromCodePoint(code);
    }
    frame += '\n';
  }

  return frame;
}

/**
 * Simple random shuffle convergence - each character randomly settles into place
 * @param progress 0-1, where 1 is fully converged
 */
export function generateConvergenceFrame(
  finalAscii: string,
  progress: number,
  _fromCenter: boolean = false // kept for API compatibility but unused
): string {
  const lines = finalAscii.split('\n');
  const hexStart = 0x4DC0;
  const hexEnd = 0x4DFF;

  return lines.map((line) => {
    return line.split('').map((char) => {
      // Each character has a random chance to show final state based on progress
      if (Math.random() < progress) {
        return char;
      }
      // Otherwise show random hexagram
      const code = hexStart + Math.floor(Math.random() * (hexEnd - hexStart + 1));
      return String.fromCodePoint(code);
    }).join('');
  }).join('\n');
}

/* ═══════════════════════════════════════════════════════════════════════════
   Method-Specific Animations
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 象數法 animation: Show 6 horizontal bands lighting up
 * Each band represents one 爻 being determined
 */
export function generateBandRevealFrame(
  sourceAscii: string,
  bandIndex: number, // 0-5, which band is currently highlighted
  highlightChar: string = '━'
): string {
  const lines = sourceAscii.split('\n').filter(l => l.length > 0);
  const height = lines.length;
  const bandHeight = Math.floor(height / 6);

  return lines.map((line, y) => {
    const currentBand = Math.floor(y / bandHeight);
    if (currentBand === bandIndex) {
      // Highlight this band
      return line.split('').map(() => highlightChar).join('');
    }
    return line;
  }).join('\n');
}

/**
 * 加權銅錢法 animation: Coin flip effect
 * Shows coins (○/●) flipping for each line
 */
export function generateCoinFlipFrame(
  width: number,
  height: number,
  lineResults: ('yang' | 'yin' | null)[], // Results so far, null = still flipping
  flipPhase: number // 0-1 for current flip animation
): string {
  const yangCoin = '○';
  const yinCoin = '●';
  const flipChars = ['◐', '◑', '◒', '◓'];

  let frame = '';

  // Show 6 lines of coins (3 coins per line)
  for (let line = 0; line < 6; line++) {
    const result = lineResults[line];
    const lineY = Math.floor((height / 6) * line + height / 12);

    // Pad to center
    const padding = Math.floor((width - 20) / 2);
    frame += ' '.repeat(padding);

    if (result !== null) {
      // Show result
      const coin = result === 'yang' ? yangCoin : yinCoin;
      frame += `${coin} ${coin} ${coin}  →  ${result === 'yang' ? '⚊' : '⚋'}`;
    } else {
      // Show flipping
      const flipIdx = Math.floor(flipPhase * flipChars.length) % flipChars.length;
      frame += `${flipChars[flipIdx]} ${flipChars[(flipIdx + 1) % 4]} ${flipChars[(flipIdx + 2) % 4]}  →  ?`;
    }

    frame += '\n';

    // Add spacing
    if (line < 5) {
      frame += '\n';
    }
  }

  return frame;
}

/**
 * 大衍之數 animation: Slow meditative particle gathering
 * Characters slowly drift and settle into place
 */
export function generateYarrowFrame(
  finalAscii: string,
  progress: number, // 0-1
  seed: number
): string {
  const lines = finalAscii.split('\n');
  const height = lines.length;
  const width = lines[0]?.length || 0;

  const hexStart = 0x4DC0;
  const hexEnd = 0x4DFF;

  // Use seed for deterministic randomness
  const random = (x: number, y: number) => {
    const n = Math.sin(seed + x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };

  return lines.map((line, y) => {
    return line.split('').map((char, x) => {
      // Each character has its own "settle time" based on position
      const settleTime = random(x, y) * 0.7 + 0.3; // 0.3-1.0

      if (progress >= settleTime) {
        return char;
      }

      // Slowly reduce chaos intensity
      const chaosIntensity = 1 - (progress / settleTime);
      if (Math.random() > chaosIntensity * 0.5) {
        return char;
      }

      const code = hexStart + Math.floor(Math.random() * (hexEnd - hexStart + 1));
      return String.fromCodePoint(code);
    }).join('');
  }).join('\n');
}

/**
 * Transition from source ASCII to target ASCII
 * Used for smooth morphing between states
 */
export function generateMorphFrame(
  sourceAscii: string,
  targetAscii: string,
  progress: number // 0-1
): string {
  const sourceLines = sourceAscii.split('\n');
  const targetLines = targetAscii.split('\n');
  const height = Math.max(sourceLines.length, targetLines.length);
  const width = Math.max(
    sourceLines[0]?.length || 0,
    targetLines[0]?.length || 0
  );

  const hexStart = 0x4DC0;
  const hexEnd = 0x4DFF;

  const result: string[] = [];

  for (let y = 0; y < height; y++) {
    const sourceLine = sourceLines[y] || '';
    const targetLine = targetLines[y] || '';
    let line = '';

    for (let x = 0; x < width; x++) {
      const sourceChar = sourceLine[x] || ' ';
      const targetChar = targetLine[x] || ' ';

      if (sourceChar === targetChar || Math.random() < progress) {
        line += targetChar;
      } else if (Math.random() < 0.3) {
        // Random chaos during transition
        const code = hexStart + Math.floor(Math.random() * (hexEnd - hexStart + 1));
        line += String.fromCodePoint(code);
      } else {
        line += sourceChar;
      }
    }
    result.push(line);
  }

  return result.join('\n');
}
