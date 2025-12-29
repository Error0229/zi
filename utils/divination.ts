/* ═══════════════════════════════════════════════════════════════════════════
   Divination Utilities - 易經占卜算法
   ═══════════════════════════════════════════════════════════════════════════ */

import type {
  LineValue,
  LineState,
  DivinationResult,
  Hexagram,
  HexagramDatabase,
  ReadingInterpretation,
} from '../types/divination';
import hexagramData from '../src/data/hexagrams.json';

const db = hexagramData as HexagramDatabase;

/* ═══════════════════════════════════════════════════════════════════════════
   Line State Utilities
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Convert LineValue to LineState
 */
export function createLineState(value: LineValue): LineState {
  const isYang = value === 7 || value === 9;
  const isChanging = value === 6 || value === 9;

  return {
    value,
    isChanging,
    currentType: isYang ? 'yang' : 'yin',
    futureType: isChanging ? (isYang ? 'yin' : 'yang') : (isYang ? 'yang' : 'yin'),
  };
}

/**
 * Convert 6 LineStates to binary pattern for hexagram lookup
 * Yang = 1, Yin = 0, bottom to top
 */
function linesToBinary(lines: LineState[], useTransformed: boolean = false): number {
  let binary = 0;
  for (let i = 0; i < 6; i++) {
    const lineType = useTransformed ? lines[i].futureType : lines[i].currentType;
    if (lineType === 'yang') {
      binary |= (1 << i);
    }
  }
  return binary;
}

/**
 * King Wen sequence mapping: binary pattern → hexagram number (1-64)
 * Binary: bit 0 = line 1 (bottom), bit 5 = line 6 (top)
 * Yang = 1, Yin = 0
 */
const KING_WEN_SEQUENCE: Record<number, number> = {
  0b111111: 1,  // 乾
  0b000000: 2,  // 坤
  0b100010: 3,  // 屯
  0b010001: 4,  // 蒙
  0b111010: 5,  // 需
  0b010111: 6,  // 訟
  0b010000: 7,  // 師
  0b000010: 8,  // 比
  0b111011: 9,  // 小畜
  0b110111: 10, // 履
  0b111000: 11, // 泰
  0b000111: 12, // 否
  0b101111: 13, // 同人
  0b111101: 14, // 大有
  0b001000: 15, // 謙
  0b000100: 16, // 豫
  0b100110: 17, // 隨
  0b011001: 18, // 蠱
  0b110000: 19, // 臨
  0b000011: 20, // 觀
  0b100101: 21, // 噬嗑
  0b101001: 22, // 賁
  0b000001: 23, // 剝
  0b100000: 24, // 復
  0b100111: 25, // 无妄
  0b111001: 26, // 大畜
  0b100001: 27, // 頤
  0b011110: 28, // 大過
  0b010010: 29, // 坎
  0b101101: 30, // 離
  0b001110: 31, // 咸
  0b011100: 32, // 恆
  0b001111: 33, // 遯
  0b111100: 34, // 大壯
  0b000101: 35, // 晉
  0b101000: 36, // 明夷
  0b101011: 37, // 家人
  0b110101: 38, // 睽
  0b001010: 39, // 蹇
  0b010100: 40, // 解
  0b110001: 41, // 損
  0b100011: 42, // 益
  0b111110: 43, // 夬
  0b011111: 44, // 姤
  0b000110: 45, // 萃
  0b011000: 46, // 升
  0b010110: 47, // 困
  0b011010: 48, // 井
  0b101110: 49, // 革
  0b011101: 50, // 鼎
  0b100100: 51, // 震
  0b001001: 52, // 艮
  0b001011: 53, // 漸
  0b110100: 54, // 歸妹
  0b101100: 55, // 豐
  0b001101: 56, // 旅
  0b011011: 57, // 巽
  0b110110: 58, // 兌
  0b010011: 59, // 渙
  0b110010: 60, // 節
  0b110011: 61, // 中孚
  0b001100: 62, // 小過
  0b101010: 63, // 既濟
  0b010101: 64, // 未濟
};

/**
 * Look up hexagram by number (1-64)
 */
export function getHexagram(number: number): Hexagram | null {
  if (number < 1 || number > 64) return null;
  return db.hexagrams.find(h => h.number === number) || null;
}

/**
 * Look up hexagram by binary pattern
 */
export function getHexagramByLines(lines: LineState[], useTransformed: boolean = false): Hexagram | null {
  const binary = linesToBinary(lines, useTransformed);
  const number = KING_WEN_SEQUENCE[binary];
  return number ? getHexagram(number) : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Image Analysis Utilities
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Get average brightness of a region in ImageData
 * Returns 0-255
 */
function getRegionBrightness(
  imageData: ImageData,
  startY: number,
  endY: number
): number {
  const { data, width } = imageData;
  let totalBrightness = 0;
  let pixelCount = 0;

  for (let y = startY; y < endY; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Luminance formula: 0.299R + 0.587G + 0.114B
      const brightness = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      totalBrightness += brightness;
      pixelCount++;
    }
  }

  return pixelCount > 0 ? totalBrightness / pixelCount : 128;
}

/**
 * Generate a simple hash from ImageData
 * Returns a 32-bit integer
 */
function hashImageData(imageData: ImageData): number {
  const { data } = imageData;
  let hash = 0;

  // Sample every 100th pixel for performance
  for (let i = 0; i < data.length; i += 400) {
    hash = ((hash << 5) - hash + data[i]) | 0;
  }

  return Math.abs(hash);
}

/**
 * Seeded random number generator (Mulberry32)
 */
function createSeededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Divination Methods
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 象數法 - Image Method
 *
 * Image split into 6 horizontal bands
 * Each band's brightness → yin or yang
 * Image hash → determines changing lines
 */
export function imageMethod(imageData: ImageData): DivinationResult {
  const { height } = imageData;
  const bandHeight = height / 6;
  const hash = hashImageData(imageData);
  const random = createSeededRandom(hash);

  const lines: LineState[] = [];

  for (let i = 0; i < 6; i++) {
    const startY = Math.floor(i * bandHeight);
    const endY = Math.floor((i + 1) * bandHeight);
    const brightness = getRegionBrightness(imageData, startY, endY);

    // Brightness > 128 = yang, <= 128 = yin
    const isYang = brightness > 128;

    // Use hash-based random to determine if line changes
    // ~25% chance of being a changing line (老陰 or 老陽)
    const isChanging = random() < 0.25;

    let value: LineValue;
    if (isYang) {
      value = isChanging ? 9 : 7; // 老陽 or 少陽
    } else {
      value = isChanging ? 6 : 8; // 老陰 or 少陰
    }

    lines.push(createLineState(value));
  }

  return buildDivinationResult(lines, 'image');
}

/**
 * 加權銅錢法 - Weighted Coins Method
 *
 * Traditional coin toss probabilities weighted by image features
 * Each toss: 3 coins, heads=3 tails=2
 * Sum: 6(老陰), 7(少陽), 8(少陰), 9(老陽)
 */
export function coinsMethod(imageData: ImageData): DivinationResult {
  const { height } = imageData;
  const bandHeight = height / 6;
  const hash = hashImageData(imageData);
  const random = createSeededRandom(hash);

  const lines: LineState[] = [];

  for (let i = 0; i < 6; i++) {
    const startY = Math.floor(i * bandHeight);
    const endY = Math.floor((i + 1) * bandHeight);
    const brightness = getRegionBrightness(imageData, startY, endY);

    // Brightness affects coin flip probability
    // Brighter = more likely to get heads (yang-favoring)
    const headsProbability = 0.3 + (brightness / 255) * 0.4; // Range: 0.3-0.7

    let sum = 0;
    for (let coin = 0; coin < 3; coin++) {
      sum += random() < headsProbability ? 3 : 2;
    }

    // Sum is 6, 7, 8, or 9
    const value = sum as LineValue;
    lines.push(createLineState(value));
  }

  return buildDivinationResult(lines, 'coins');
}

/**
 * 大衍之數 - Yarrow Stalk Method
 *
 * Traditional 49 stalk division method
 * Image hash seeds the random process
 * Most authentic traditional probabilities:
 * - 老陽(9): 1/16
 * - 少陽(7): 5/16
 * - 少陰(8): 7/16
 * - 老陰(6): 3/16
 */
export function yarrowMethod(imageData: ImageData): DivinationResult {
  const hash = hashImageData(imageData);
  const random = createSeededRandom(hash);

  const lines: LineState[] = [];

  for (let i = 0; i < 6; i++) {
    const value = simulateYarrowStalkDivision(random);
    lines.push(createLineState(value));
  }

  return buildDivinationResult(lines, 'yarrow');
}

/**
 * Simulate one line of yarrow stalk division
 * Returns 6, 7, 8, or 9
 */
function simulateYarrowStalkDivision(random: () => number): LineValue {
  let remainders: number[] = [];

  // Three divisions
  for (let div = 0; div < 3; div++) {
    const stalks = div === 0 ? 49 : (49 - remainders.reduce((a, b) => a + b, 0));

    // Remove one stalk
    let pile = stalks - 1;

    // Divide randomly
    const leftPile = Math.floor(random() * (pile - 1)) + 1;
    const rightPile = pile - leftPile;

    // Take one from right
    let inHand = 1;
    let right = rightPile - 1;

    // Count off left by 4s
    const leftRemainder = leftPile % 4 || 4;
    inHand += leftRemainder;

    // Count off right by 4s
    const rightRemainder = right % 4 || 4;
    inHand += rightRemainder;

    remainders.push(inHand);
  }

  // Convert remainders to line value
  // First division: 5 or 9
  // Second/Third: 4 or 8
  const first = remainders[0] === 5 ? 3 : 2;
  const second = remainders[1] === 4 ? 3 : 2;
  const third = remainders[2] === 4 ? 3 : 2;
  const sum = first + second + third;

  // Sum → Line value
  // 6 = 老陰, 7 = 少陽, 8 = 少陰, 9 = 老陽
  const valueMap: Record<number, LineValue> = {
    6: 9,  // 老陽
    7: 8,  // 少陰
    8: 8,  // 少陰
    9: 6,  // 老陰
  };

  return valueMap[sum] || 7;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Result Building
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Build complete divination result from line states
 */
function buildDivinationResult(
  lines: LineState[],
  method: 'image' | 'coins' | 'yarrow'
): DivinationResult {
  const changingLines = lines
    .map((line, idx) => line.isChanging ? idx + 1 : 0)
    .filter(pos => pos > 0);

  const primaryHexagram = getHexagramByLines(lines, false);
  const transformedHexagram = changingLines.length > 0
    ? getHexagramByLines(lines, true)
    : null;

  if (!primaryHexagram) {
    throw new Error('Failed to determine primary hexagram');
  }

  return {
    lines,
    primaryHexagram,
    changingLines,
    transformedHexagram,
    method,
  };
}

/**
 * Get reading interpretation based on changing lines count
 * Traditional rules (傳統解讀法則)
 */
export function getReadingInterpretation(result: DivinationResult): ReadingInterpretation {
  const count = result.changingLines.length;

  switch (count) {
    case 0:
      return {
        changingCount: 0,
        focus: 'primary',
        description: '只看本卦卦辭',
        relevantLines: [],
      };
    case 1:
      return {
        changingCount: 1,
        focus: 'primary',
        description: '看本卦該爻爻辭',
        relevantLines: result.changingLines,
      };
    case 2:
      return {
        changingCount: 2,
        focus: 'primary',
        description: '看本卦兩變爻，以上爻為主',
        relevantLines: result.changingLines,
      };
    case 3:
      return {
        changingCount: 3,
        focus: 'both',
        description: '看本卦 + 之卦卦辭',
        relevantLines: [],
      };
    case 4: {
      // Look at the two stable lines in transformed hexagram
      const stableLines = [1, 2, 3, 4, 5, 6].filter(
        pos => !result.changingLines.includes(pos)
      );
      return {
        changingCount: 4,
        focus: 'transformed',
        description: '看之卦兩不變爻，以下爻為主',
        relevantLines: stableLines,
      };
    }
    case 5: {
      const stableLine = [1, 2, 3, 4, 5, 6].find(
        pos => !result.changingLines.includes(pos)
      );
      return {
        changingCount: 5,
        focus: 'transformed',
        description: '看之卦不變爻爻辭',
        relevantLines: stableLine ? [stableLine] : [],
      };
    }
    case 6:
      // Special case for 乾 and 坤
      const isQianOrKun = result.primaryHexagram.number === 1 || result.primaryHexagram.number === 2;
      return {
        changingCount: 6,
        focus: isQianOrKun ? 'primary' : 'transformed',
        description: isQianOrKun ? '乾坤看用辭' : '看之卦卦辭',
        relevantLines: [],
      };
    default:
      return {
        changingCount: count,
        focus: 'primary',
        description: '看本卦卦辭',
        relevantLines: [],
      };
  }
}
