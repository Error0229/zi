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
  invert: boolean = false
): string {
  const { data, width: imgWidth, height: imgHeight } = imageData;

  // Calculate height maintaining aspect ratio
  // Hexagram characters are roughly square, so we use 0.5 vertical scale
  const aspectRatio = imgHeight / imgWidth;
  const height = Math.max(1, Math.floor(width * aspectRatio * 0.5));

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

      // Grayscale with contrast
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;
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
 * Generate binary ASCII art of a hexagram symbol
 * The hexagram is rendered as ASCII using itself for bright areas
 */
export function generateHexagramAscii(
  hexagramSymbol: string,
  width: number = 40
): string {
  const imageData = renderHexagramToImageData(hexagramSymbol);
  return generateBinaryAscii(imageData, hexagramSymbol, width, 200);
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
 * Interpolate between chaos and final state
 * Used for the convergence animation phase
 * @param progress 0-1, where 1 is fully converged
 */
export function generateConvergenceFrame(
  finalAscii: string,
  progress: number,
  fromCenter: boolean = false
): string {
  const lines = finalAscii.split('\n');
  const height = lines.length;
  const width = lines[0]?.length || 0;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  const hexStart = 0x4DC0;
  const hexEnd = 0x4DFF;

  return lines.map((line, y) => {
    return line.split('').map((char, x) => {
      // Calculate distance from center (normalized 0-1)
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;

      // Invert if converging from edges (outside-in)
      const threshold = fromCenter ? dist : 1 - dist;

      // If progress has reached this point, show final char
      if (progress >= threshold) {
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
