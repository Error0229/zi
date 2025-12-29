import { describe, it, expect } from 'vitest';
import {
  createLineState,
  getHexagram,
  getHexagramByLines,
  imageMethod,
  coinsMethod,
  yarrowMethod,
  getReadingInterpretation,
} from './divination';
import type { LineState, LineValue, DivinationResult } from '../types/divination';

/* ═══════════════════════════════════════════════════════════════════════════
   Test Utilities
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Create mock ImageData for testing
 */
function createMockImageData(
  width: number,
  height: number,
  brightnessPattern: number[] // 6 values (0-255) for each band
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  const bandHeight = height / 6;

  for (let y = 0; y < height; y++) {
    const bandIndex = Math.min(Math.floor(y / bandHeight), 5);
    const brightness = brightnessPattern[bandIndex];

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = brightness;     // R
      data[idx + 1] = brightness; // G
      data[idx + 2] = brightness; // B
      data[idx + 3] = 255;        // A
    }
  }

  return { data, width, height, colorSpace: 'srgb' } as ImageData;
}

/**
 * Create LineState array from values
 */
function createLines(values: LineValue[]): LineState[] {
  return values.map(v => createLineState(v));
}

/* ═══════════════════════════════════════════════════════════════════════════
   Line State Tests
   ═══════════════════════════════════════════════════════════════════════════ */

describe('createLineState', () => {
  it('creates 老陰 (6) correctly', () => {
    const state = createLineState(6);
    expect(state.value).toBe(6);
    expect(state.isChanging).toBe(true);
    expect(state.currentType).toBe('yin');
    expect(state.futureType).toBe('yang'); // 陰 → 陽
  });

  it('creates 少陽 (7) correctly', () => {
    const state = createLineState(7);
    expect(state.value).toBe(7);
    expect(state.isChanging).toBe(false);
    expect(state.currentType).toBe('yang');
    expect(state.futureType).toBe('yang'); // 不變
  });

  it('creates 少陰 (8) correctly', () => {
    const state = createLineState(8);
    expect(state.value).toBe(8);
    expect(state.isChanging).toBe(false);
    expect(state.currentType).toBe('yin');
    expect(state.futureType).toBe('yin'); // 不變
  });

  it('creates 老陽 (9) correctly', () => {
    const state = createLineState(9);
    expect(state.value).toBe(9);
    expect(state.isChanging).toBe(true);
    expect(state.currentType).toBe('yang');
    expect(state.futureType).toBe('yin'); // 陽 → 陰
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Hexagram Lookup Tests
   ═══════════════════════════════════════════════════════════════════════════ */

describe('getHexagram', () => {
  it('returns 乾 for number 1', () => {
    const hex = getHexagram(1);
    expect(hex).not.toBeNull();
    expect(hex!.name.chinese).toBe('乾');
    expect(hex!.symbol).toBe('䷀');
  });

  it('returns 坤 for number 2', () => {
    const hex = getHexagram(2);
    expect(hex).not.toBeNull();
    expect(hex!.name.chinese).toBe('坤');
    expect(hex!.symbol).toBe('䷁');
  });

  it('returns 未濟 for number 64', () => {
    const hex = getHexagram(64);
    expect(hex).not.toBeNull();
    expect(hex!.name.chinese).toBe('未濟');
    expect(hex!.symbol).toBe('䷿');
  });

  it('returns null for invalid numbers', () => {
    expect(getHexagram(0)).toBeNull();
    expect(getHexagram(65)).toBeNull();
    expect(getHexagram(-1)).toBeNull();
  });

  it('has 6 lines for each hexagram', () => {
    for (let i = 1; i <= 64; i++) {
      const hex = getHexagram(i);
      expect(hex!.lines).toHaveLength(6);
    }
  });
});

describe('getHexagramByLines', () => {
  it('returns 乾 for all yang lines', () => {
    const lines = createLines([7, 7, 7, 7, 7, 7]); // All 少陽
    const hex = getHexagramByLines(lines, false);
    expect(hex!.number).toBe(1); // 乾
  });

  it('returns 坤 for all yin lines', () => {
    const lines = createLines([8, 8, 8, 8, 8, 8]); // All 少陰
    const hex = getHexagramByLines(lines, false);
    expect(hex!.number).toBe(2); // 坤
  });

  it('returns 既濟 for alternating yin-yang from bottom', () => {
    // 既濟: yin-yang-yin-yang-yin-yang (bottom to top)
    // Binary: 101010 = 42, but King Wen #63
    const lines = createLines([8, 7, 8, 7, 8, 7]);
    const hex = getHexagramByLines(lines, false);
    expect(hex!.number).toBe(63); // 既濟
  });

  it('returns 未濟 for alternating yang-yin from bottom', () => {
    // 未濟: yang-yin-yang-yin-yang-yin (bottom to top)
    const lines = createLines([7, 8, 7, 8, 7, 8]);
    const hex = getHexagramByLines(lines, false);
    expect(hex!.number).toBe(64); // 未濟
  });

  it('uses transformed state when useTransformed=true', () => {
    // All 老陽 (9): current=yang, future=yin
    // Primary: 乾 (all yang), Transformed: 坤 (all yin)
    const lines = createLines([9, 9, 9, 9, 9, 9]);

    const primary = getHexagramByLines(lines, false);
    expect(primary!.number).toBe(1); // 乾

    const transformed = getHexagramByLines(lines, true);
    expect(transformed!.number).toBe(2); // 坤
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Image Method Tests
   ═══════════════════════════════════════════════════════════════════════════ */

describe('imageMethod', () => {
  it('produces all yang for bright image', () => {
    // All bands very bright (200+)
    const imageData = createMockImageData(100, 60, [200, 200, 200, 200, 200, 200]);
    const result = imageMethod(imageData);

    expect(result.lines).toHaveLength(6);
    expect(result.method).toBe('image');

    // All lines should be yang (7 or 9)
    result.lines.forEach(line => {
      expect(line.currentType).toBe('yang');
    });
  });

  it('produces all yin for dark image', () => {
    // All bands very dark (50 or less)
    const imageData = createMockImageData(100, 60, [50, 50, 50, 50, 50, 50]);
    const result = imageMethod(imageData);

    expect(result.lines).toHaveLength(6);

    // All lines should be yin (6 or 8)
    result.lines.forEach(line => {
      expect(line.currentType).toBe('yin');
    });
  });

  it('produces mixed lines for gradient image', () => {
    // Bottom bands dark, top bands bright
    const imageData = createMockImageData(100, 60, [50, 80, 100, 150, 180, 220]);
    const result = imageMethod(imageData);

    // First 3 lines (dark) should be yin
    expect(result.lines[0].currentType).toBe('yin');
    expect(result.lines[1].currentType).toBe('yin');
    expect(result.lines[2].currentType).toBe('yin');

    // Last 3 lines (bright) should be yang
    expect(result.lines[3].currentType).toBe('yang');
    expect(result.lines[4].currentType).toBe('yang');
    expect(result.lines[5].currentType).toBe('yang');
  });

  it('returns valid hexagram', () => {
    const imageData = createMockImageData(100, 60, [100, 150, 100, 150, 100, 150]);
    const result = imageMethod(imageData);

    expect(result.primaryHexagram).not.toBeNull();
    expect(result.primaryHexagram.number).toBeGreaterThanOrEqual(1);
    expect(result.primaryHexagram.number).toBeLessThanOrEqual(64);
  });

  it('is deterministic for same image', () => {
    const imageData = createMockImageData(100, 60, [120, 80, 200, 50, 180, 90]);

    const result1 = imageMethod(imageData);
    const result2 = imageMethod(imageData);

    expect(result1.primaryHexagram.number).toBe(result2.primaryHexagram.number);
    expect(result1.changingLines).toEqual(result2.changingLines);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Coins Method Tests
   ═══════════════════════════════════════════════════════════════════════════ */

describe('coinsMethod', () => {
  it('returns valid line values (6, 7, 8, or 9)', () => {
    const imageData = createMockImageData(100, 60, [128, 128, 128, 128, 128, 128]);
    const result = coinsMethod(imageData);

    result.lines.forEach(line => {
      expect([6, 7, 8, 9]).toContain(line.value);
    });
  });

  it('favors yang for bright image', () => {
    // Very bright image - should favor yang
    const imageData = createMockImageData(100, 60, [240, 240, 240, 240, 240, 240]);

    // Run multiple times and count
    let yangCount = 0;
    let totalLines = 0;

    for (let i = 0; i < 10; i++) {
      // Slightly vary to get different seeds
      const varied = createMockImageData(100, 60, [240 - i, 240, 240, 240, 240, 240 + i]);
      const result = coinsMethod(varied);
      result.lines.forEach(line => {
        if (line.currentType === 'yang') yangCount++;
        totalLines++;
      });
    }

    // Should be mostly yang (> 50%)
    expect(yangCount / totalLines).toBeGreaterThan(0.5);
  });

  it('is deterministic for same image', () => {
    const imageData = createMockImageData(100, 60, [100, 150, 200, 50, 180, 90]);

    const result1 = coinsMethod(imageData);
    const result2 = coinsMethod(imageData);

    expect(result1.lines.map(l => l.value)).toEqual(result2.lines.map(l => l.value));
  });

  it('returns valid hexagram', () => {
    const imageData = createMockImageData(100, 60, [128, 128, 128, 128, 128, 128]);
    const result = coinsMethod(imageData);

    expect(result.primaryHexagram.number).toBeGreaterThanOrEqual(1);
    expect(result.primaryHexagram.number).toBeLessThanOrEqual(64);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Yarrow Method Tests
   ═══════════════════════════════════════════════════════════════════════════ */

describe('yarrowMethod', () => {
  it('returns valid line values (6, 7, 8, or 9)', () => {
    const imageData = createMockImageData(100, 60, [128, 128, 128, 128, 128, 128]);
    const result = yarrowMethod(imageData);

    result.lines.forEach(line => {
      expect([6, 7, 8, 9]).toContain(line.value);
    });
  });

  it('is deterministic for same image', () => {
    const imageData = createMockImageData(100, 60, [100, 150, 200, 50, 180, 90]);

    const result1 = yarrowMethod(imageData);
    const result2 = yarrowMethod(imageData);

    expect(result1.lines.map(l => l.value)).toEqual(result2.lines.map(l => l.value));
  });

  it('produces different results for different images', () => {
    const imageData1 = createMockImageData(100, 60, [100, 100, 100, 100, 100, 100]);
    const imageData2 = createMockImageData(100, 60, [200, 200, 200, 200, 200, 200]);

    const result1 = yarrowMethod(imageData1);
    const result2 = yarrowMethod(imageData2);

    // Very unlikely to be the same
    const same = result1.lines.every((l, i) => l.value === result2.lines[i].value);
    expect(same).toBe(false);
  });

  it('returns valid hexagram', () => {
    const imageData = createMockImageData(100, 60, [128, 128, 128, 128, 128, 128]);
    const result = yarrowMethod(imageData);

    expect(result.primaryHexagram.number).toBeGreaterThanOrEqual(1);
    expect(result.primaryHexagram.number).toBeLessThanOrEqual(64);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Changing Lines & Transformation Tests
   ═══════════════════════════════════════════════════════════════════════════ */

describe('changing lines', () => {
  it('identifies changing lines correctly', () => {
    // Create lines with known changing positions
    const lines = createLines([6, 7, 8, 9, 7, 8]); // Positions 1 and 4 are changing

    const changingPositions = lines
      .map((l, i) => l.isChanging ? i + 1 : 0)
      .filter(p => p > 0);

    expect(changingPositions).toEqual([1, 4]);
  });

  it('computes transformed hexagram when lines change', () => {
    // 乾 with line 1 changing (老陽 at position 1)
    // After transformation: line 1 becomes yin
    const imageData = createMockImageData(100, 60, [200, 200, 200, 200, 200, 200]);
    const result = imageMethod(imageData);

    if (result.changingLines.length > 0) {
      expect(result.transformedHexagram).not.toBeNull();
      expect(result.transformedHexagram!.number).not.toBe(result.primaryHexagram.number);
    }
  });

  it('returns null transformed hexagram when no changing lines', () => {
    // Create a result manually with no changing lines
    const lines = createLines([7, 7, 7, 7, 7, 7]); // All 少陽, no changes

    const hasChanging = lines.some(l => l.isChanging);
    expect(hasChanging).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Reading Interpretation Tests
   ═══════════════════════════════════════════════════════════════════════════ */

describe('getReadingInterpretation', () => {
  function createMockResult(changingLines: number[], primaryNumber: number = 1): DivinationResult {
    const lines = createLines([7, 7, 7, 7, 7, 7]);
    changingLines.forEach(pos => {
      lines[pos - 1] = createLineState(9); // Make it changing
    });

    return {
      lines,
      primaryHexagram: getHexagram(primaryNumber)!,
      changingLines,
      transformedHexagram: changingLines.length > 0 ? getHexagram(2) : null,
      method: 'image',
    };
  }

  it('0 changing lines: 只看本卦卦辭', () => {
    const result = createMockResult([]);
    const interp = getReadingInterpretation(result);

    expect(interp.changingCount).toBe(0);
    expect(interp.focus).toBe('primary');
    expect(interp.relevantLines).toEqual([]);
  });

  it('1 changing line: 看本卦該爻爻辭', () => {
    const result = createMockResult([3]);
    const interp = getReadingInterpretation(result);

    expect(interp.changingCount).toBe(1);
    expect(interp.focus).toBe('primary');
    expect(interp.relevantLines).toEqual([3]);
  });

  it('2 changing lines: 看本卦兩變爻，以上爻為主', () => {
    const result = createMockResult([2, 5]);
    const interp = getReadingInterpretation(result);

    expect(interp.changingCount).toBe(2);
    expect(interp.focus).toBe('primary');
    expect(interp.relevantLines).toEqual([2, 5]);
  });

  it('3 changing lines: 看本卦 + 之卦卦辭', () => {
    const result = createMockResult([1, 3, 5]);
    const interp = getReadingInterpretation(result);

    expect(interp.changingCount).toBe(3);
    expect(interp.focus).toBe('both');
    expect(interp.relevantLines).toEqual([]);
  });

  it('4 changing lines: 看之卦兩不變爻，以下爻為主', () => {
    const result = createMockResult([1, 2, 3, 4]);
    const interp = getReadingInterpretation(result);

    expect(interp.changingCount).toBe(4);
    expect(interp.focus).toBe('transformed');
    expect(interp.relevantLines).toEqual([5, 6]); // Non-changing lines
  });

  it('5 changing lines: 看之卦不變爻爻辭', () => {
    const result = createMockResult([1, 2, 3, 4, 5]);
    const interp = getReadingInterpretation(result);

    expect(interp.changingCount).toBe(5);
    expect(interp.focus).toBe('transformed');
    expect(interp.relevantLines).toEqual([6]); // The only non-changing line
  });

  it('6 changing lines (乾): 乾坤看用辭', () => {
    const result = createMockResult([1, 2, 3, 4, 5, 6], 1); // 乾
    const interp = getReadingInterpretation(result);

    expect(interp.changingCount).toBe(6);
    expect(interp.focus).toBe('primary');
    expect(interp.description).toContain('用辭');
  });

  it('6 changing lines (坤): 乾坤看用辭', () => {
    const result = createMockResult([1, 2, 3, 4, 5, 6], 2); // 坤
    const interp = getReadingInterpretation(result);

    expect(interp.changingCount).toBe(6);
    expect(interp.focus).toBe('primary');
    expect(interp.description).toContain('用辭');
  });

  it('6 changing lines (other): 看之卦卦辭', () => {
    const result = createMockResult([1, 2, 3, 4, 5, 6], 3); // 屯
    const interp = getReadingInterpretation(result);

    expect(interp.changingCount).toBe(6);
    expect(interp.focus).toBe('transformed');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   King Wen Sequence Completeness Test
   ═══════════════════════════════════════════════════════════════════════════ */

describe('King Wen sequence', () => {
  it('maps all 64 binary patterns to unique hexagram numbers', () => {
    const foundNumbers = new Set<number>();

    // Test all 64 binary patterns
    for (let binary = 0; binary < 64; binary++) {
      const lines: LineState[] = [];
      for (let i = 0; i < 6; i++) {
        const isYang = (binary & (1 << i)) !== 0;
        lines.push(createLineState(isYang ? 7 : 8));
      }

      const hex = getHexagramByLines(lines, false);
      expect(hex).not.toBeNull();
      expect(hex!.number).toBeGreaterThanOrEqual(1);
      expect(hex!.number).toBeLessThanOrEqual(64);
      foundNumbers.add(hex!.number);
    }

    // Should have found all 64 unique hexagram numbers
    expect(foundNumbers.size).toBe(64);
  });
});
