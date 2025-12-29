/* ═══════════════════════════════════════════════════════════════════════════
   Divination Types - 易經占卜類型定義
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 四象 - The Four Line States
 * 6 = 老陰 (old yin, changes to yang)
 * 7 = 少陽 (young yang, stable)
 * 8 = 少陰 (young yin, stable)
 * 9 = 老陽 (old yang, changes to yin)
 */
export type LineValue = 6 | 7 | 8 | 9;

/**
 * Single line state with transformation info
 */
export interface LineState {
  value: LineValue;
  isChanging: boolean;        // 6 or 9 = true (變爻)
  currentType: 'yang' | 'yin'; // 本卦狀態
  futureType: 'yang' | 'yin';  // 之卦狀態
}

/**
 * Hexagram line text data
 */
export interface HexagramLine {
  position: number;           // 1-6 (bottom to top)
  name: string;               // 初九、九二、六三...
  classical: string;          // 經文
  modern: string;             // 白話解釋
}

/**
 * Hexagram data structure (matches hexagrams.json)
 */
export interface Hexagram {
  number: number;             // 1-64
  symbol: string;             // ䷀
  name: {
    chinese: string;          // 乾
    pinyin: string;           // qián
    english: string;          // The Creative
  };
  slug: string;               // qian1
  trigrams: {
    upper: string;            // ☰
    lower: string;            // ☰
  };
  judgment: {
    classical: string;        // 乾：元，亨，利，貞。
    modern: string;           // 白話解釋
  };
  lines: HexagramLine[];      // 六爻
  extra?: {                   // 乾坤卦專有
    name: string;             // 用九 / 用六
    classical: string;
    modern: string;
  };
}

/**
 * Complete divination result
 */
export interface DivinationResult {
  lines: LineState[];                    // 六爻結果 (bottom to top)
  primaryHexagram: Hexagram;             // 本卦
  changingLines: number[];               // 變爻位置 [1, 4, 6]
  transformedHexagram: Hexagram | null;  // 之卦 (無變爻則 null)
  method: DivinationMethod;              // 占卜方法
}

/**
 * Divination methods
 */
export type DivinationMethod = 'image' | 'coins' | 'yarrow';

/**
 * Reading interpretation based on changing lines count
 * Per traditional rules (傳統解讀法則)
 */
export interface ReadingInterpretation {
  changingCount: number;
  focus: 'primary' | 'transformed' | 'both';
  description: string;
  relevantLines: number[];  // Which lines to read
}

/**
 * Hexagram database structure (matches hexagrams.json root)
 */
export interface HexagramDatabase {
  version: number;
  hexagrams: Hexagram[];
}
