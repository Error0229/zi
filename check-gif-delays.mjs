// Usage: node check-gif-delays.mjs <path-to-gif>
import { parseGIF, decompressFrames } from 'gifuct-js';
import { readFileSync } from 'fs';

const gifPath = process.argv[2];
if (!gifPath) {
  console.log('Usage: node check-gif-delays.mjs <path-to-gif>');
  process.exit(1);
}

const buffer = readFileSync(gifPath);
const gif = parseGIF(buffer.buffer);
const frames = decompressFrames(gif, true);

console.log(`GIF: ${gifPath}`);
console.log(`Dimensions: ${gif.lsd.width}x${gif.lsd.height}`);
console.log(`Total frames: ${frames.length}`);
console.log('\nFrame delays:');

frames.forEach((frame, i) => {
  // gifuct-js already converts to ms internally
  const delayMs = frame.delay || 100;
  console.log(`  Frame ${i}: ${delayMs}ms`);
});

// Summary
const delays = frames.map(f => f.delay || 100);
const uniqueDelays = [...new Set(delays)];
console.log(`\nUnique delays: ${uniqueDelays.map(d => `${d}ms`).join(', ')}`);
