/* ═══════════════════════════════════════════════════════════════════════════
   Binary ASCII Art Generator - 二元卦象 ASCII 藝術
   Uses two hexagram characters: ䷁ (坤/dark) and the divined hexagram (bright)
   ═══════════════════════════════════════════════════════════════════════════ */

const DARK_CHAR = '䷁'; // 坤 - used for dark areas

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
