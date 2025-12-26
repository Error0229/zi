/**
 * Generates the array of all 64 Yijing Hexagram characters (U+4DC0 to U+4DFF).
 */
export const getAllHexagrams = (): string[] => {
  const hexagrams: string[] = [];
  // U+4DC0 is the start, U+4DFF is the end (total 64)
  const start = 0x4DC0;
  const end = 0x4DFF;

  for (let code = start; code <= end; code++) {
    hexagrams.push(String.fromCodePoint(code));
  }
  return hexagrams;
};

/**
 * Calculates the visual density (brightness) of a character by rendering it to an off-screen canvas
 * and counting the non-transparent pixels.
 */
export const calculateCharacterDensities = (chars: string[]): Promise<string[]> => {
  return new Promise((resolve) => {
    // Create an off-screen canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // Fallback if canvas context is not available
      resolve(chars);
      return;
    }

    const fontSize = 40; // Large font size for better precision
    canvas.width = fontSize * 1.5;
    canvas.height = fontSize * 1.5;

    const densityMap: { char: string; density: number }[] = [];

    // Font settings
    ctx.font = `${fontSize}px "Noto Sans Symbols 2", "Segoe UI Symbol", "Arial Unicode MS", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    chars.forEach((char) => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw text
      ctx.fillStyle = 'black';
      ctx.fillText(char, canvas.width / 2, canvas.height / 2);

      // Get pixel data
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      let pixelCount = 0;
      // RGBA data. We only need to check alpha or color channel since we drew black on transparent.
      // Since we cleared to transparent (0,0,0,0) and drew black (0,0,0,255), 
      // any pixel with alpha > 0 is part of the character.
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) {
          pixelCount++;
        }
      }

      densityMap.push({ char, density: pixelCount });
    });

    // Sort from least dense (lightest) to most dense (darkest)
    densityMap.sort((a, b) => a.density - b.density);

    // Return just the characters
    resolve(densityMap.map((item) => item.char));
  });
};
