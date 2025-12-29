/**
 * Scrape I Ching hexagram texts from ctext.org
 *
 * Usage: npx tsx scripts/scrape-hexagrams.ts
 *
 * This script fetches classical Chinese texts for all 64 hexagrams
 * and outputs them in a format ready to merge into hexagrams.json
 */

const HEXAGRAM_SLUGS = [
  { number: 1, slug: 'qian', chinese: '乾', pinyin: 'qián', english: 'The Creative' },
  { number: 2, slug: 'kun', chinese: '坤', pinyin: 'kūn', english: 'The Receptive' },
  { number: 3, slug: 'zhun', chinese: '屯', pinyin: 'zhūn', english: 'Difficulty at the Beginning' },
  { number: 4, slug: 'meng', chinese: '蒙', pinyin: 'méng', english: 'Youthful Folly' },
  { number: 5, slug: 'xu', chinese: '需', pinyin: 'xū', english: 'Waiting' },
  { number: 6, slug: 'song', chinese: '訟', pinyin: 'sòng', english: 'Conflict' },
  { number: 7, slug: 'shi', chinese: '師', pinyin: 'shī', english: 'The Army' },
  { number: 8, slug: 'bi', chinese: '比', pinyin: 'bǐ', english: 'Holding Together' },
  { number: 9, slug: 'xiao-xu', chinese: '小畜', pinyin: 'xiǎo xù', english: 'Small Accumulating' },
  { number: 10, slug: 'lu', chinese: '履', pinyin: 'lǚ', english: 'Treading' },
  { number: 11, slug: 'tai', chinese: '泰', pinyin: 'tài', english: 'Peace' },
  { number: 12, slug: 'pi', chinese: '否', pinyin: 'pǐ', english: 'Standstill' },
  { number: 13, slug: 'tong-ren', chinese: '同人', pinyin: 'tóng rén', english: 'Fellowship' },
  { number: 14, slug: 'da-you', chinese: '大有', pinyin: 'dà yǒu', english: 'Great Possession' },
  { number: 15, slug: 'qian1', chinese: '謙', pinyin: 'qiān', english: 'Modesty' },
  { number: 16, slug: 'yu', chinese: '豫', pinyin: 'yù', english: 'Enthusiasm' },
  { number: 17, slug: 'sui', chinese: '隨', pinyin: 'suí', english: 'Following' },
  { number: 18, slug: 'gu', chinese: '蠱', pinyin: 'gǔ', english: 'Work on the Decayed' },
  { number: 19, slug: 'lin', chinese: '臨', pinyin: 'lín', english: 'Approach' },
  { number: 20, slug: 'guan', chinese: '觀', pinyin: 'guān', english: 'Contemplation' },
  { number: 21, slug: 'shi-he', chinese: '噬嗑', pinyin: 'shì hé', english: 'Biting Through' },
  { number: 22, slug: 'bi1', chinese: '賁', pinyin: 'bì', english: 'Grace' },
  { number: 23, slug: 'bo', chinese: '剝', pinyin: 'bō', english: 'Splitting Apart' },
  { number: 24, slug: 'fu', chinese: '復', pinyin: 'fù', english: 'Return' },
  { number: 25, slug: 'wu-wang', chinese: '无妄', pinyin: 'wú wàng', english: 'Innocence' },
  { number: 26, slug: 'da-xu', chinese: '大畜', pinyin: 'dà xù', english: 'Great Accumulating' },
  { number: 27, slug: 'yi', chinese: '頤', pinyin: 'yí', english: 'Nourishment' },
  { number: 28, slug: 'da-guo', chinese: '大過', pinyin: 'dà guò', english: 'Great Exceeding' },
  { number: 29, slug: 'kan', chinese: '坎', pinyin: 'kǎn', english: 'The Abysmal' },
  { number: 30, slug: 'li', chinese: '離', pinyin: 'lí', english: 'The Clinging' },
  { number: 31, slug: 'xian', chinese: '咸', pinyin: 'xián', english: 'Influence' },
  { number: 32, slug: 'heng', chinese: '恆', pinyin: 'héng', english: 'Duration' },
  { number: 33, slug: 'dun', chinese: '遯', pinyin: 'dùn', english: 'Retreat' },
  { number: 34, slug: 'da-zhuang', chinese: '大壯', pinyin: 'dà zhuàng', english: 'Great Power' },
  { number: 35, slug: 'jin', chinese: '晉', pinyin: 'jìn', english: 'Progress' },
  { number: 36, slug: 'ming-yi', chinese: '明夷', pinyin: 'míng yí', english: 'Darkening of the Light' },
  { number: 37, slug: 'jia-ren', chinese: '家人', pinyin: 'jiā rén', english: 'The Family' },
  { number: 38, slug: 'kui', chinese: '睽', pinyin: 'kuí', english: 'Opposition' },
  { number: 39, slug: 'jian', chinese: '蹇', pinyin: 'jiǎn', english: 'Obstruction' },
  { number: 40, slug: 'jie', chinese: '解', pinyin: 'jiě', english: 'Deliverance' },
  { number: 41, slug: 'sun', chinese: '損', pinyin: 'sǔn', english: 'Decrease' },
  { number: 42, slug: 'yi1', chinese: '益', pinyin: 'yì', english: 'Increase' },
  { number: 43, slug: 'guai', chinese: '夬', pinyin: 'guài', english: 'Breakthrough' },
  { number: 44, slug: 'gou', chinese: '姤', pinyin: 'gòu', english: 'Coming to Meet' },
  { number: 45, slug: 'cui', chinese: '萃', pinyin: 'cuì', english: 'Gathering Together' },
  { number: 46, slug: 'sheng', chinese: '升', pinyin: 'shēng', english: 'Pushing Upward' },
  { number: 47, slug: 'kun1', chinese: '困', pinyin: 'kùn', english: 'Oppression' },
  { number: 48, slug: 'jing', chinese: '井', pinyin: 'jǐng', english: 'The Well' },
  { number: 49, slug: 'ge', chinese: '革', pinyin: 'gé', english: 'Revolution' },
  { number: 50, slug: 'ding', chinese: '鼎', pinyin: 'dǐng', english: 'The Cauldron' },
  { number: 51, slug: 'zhen', chinese: '震', pinyin: 'zhèn', english: 'The Arousing' },
  { number: 52, slug: 'gen', chinese: '艮', pinyin: 'gèn', english: 'Keeping Still' },
  { number: 53, slug: 'jian1', chinese: '漸', pinyin: 'jiàn', english: 'Development' },
  { number: 54, slug: 'gui-mei', chinese: '歸妹', pinyin: 'guī mèi', english: 'The Marrying Maiden' },
  { number: 55, slug: 'feng', chinese: '豐', pinyin: 'fēng', english: 'Abundance' },
  { number: 56, slug: 'lu1', chinese: '旅', pinyin: 'lǚ', english: 'The Wanderer' },
  { number: 57, slug: 'xun', chinese: '巽', pinyin: 'xùn', english: 'The Gentle' },
  { number: 58, slug: 'dui', chinese: '兌', pinyin: 'duì', english: 'The Joyous' },
  { number: 59, slug: 'huan', chinese: '渙', pinyin: 'huàn', english: 'Dispersion' },
  { number: 60, slug: 'jie1', chinese: '節', pinyin: 'jié', english: 'Limitation' },
  { number: 61, slug: 'zhong-fu', chinese: '中孚', pinyin: 'zhōng fú', english: 'Inner Truth' },
  { number: 62, slug: 'xiao-guo', chinese: '小過', pinyin: 'xiǎo guò', english: 'Small Exceeding' },
  { number: 63, slug: 'ji-ji', chinese: '既濟', pinyin: 'jì jì', english: 'After Completion' },
  { number: 64, slug: 'wei-ji', chinese: '未濟', pinyin: 'wèi jì', english: 'Before Completion' },
];

// Hexagram Unicode symbols ䷀ to ䷿
const getHexagramSymbol = (number: number): string => {
  return String.fromCodePoint(0x4DC0 + number - 1);
};

// Upper and lower trigrams for each hexagram
const TRIGRAM_MAPPING: Record<number, { upper: string; lower: string }> = {
  1: { upper: '☰', lower: '☰' },  // 乾 = 天天
  2: { upper: '☷', lower: '☷' },  // 坤 = 地地
  3: { upper: '☵', lower: '☳' },  // 屯 = 水雷
  4: { upper: '☶', lower: '☵' },  // 蒙 = 山水
  5: { upper: '☵', lower: '☰' },  // 需 = 水天
  6: { upper: '☰', lower: '☵' },  // 訟 = 天水
  7: { upper: '☷', lower: '☵' },  // 師 = 地水
  8: { upper: '☵', lower: '☷' },  // 比 = 水地
  9: { upper: '☴', lower: '☰' },  // 小畜 = 風天
  10: { upper: '☰', lower: '☱' }, // 履 = 天澤
  11: { upper: '☷', lower: '☰' }, // 泰 = 地天
  12: { upper: '☰', lower: '☷' }, // 否 = 天地
  13: { upper: '☰', lower: '☲' }, // 同人 = 天火
  14: { upper: '☲', lower: '☰' }, // 大有 = 火天
  15: { upper: '☷', lower: '☶' }, // 謙 = 地山
  16: { upper: '☳', lower: '☷' }, // 豫 = 雷地
  17: { upper: '☱', lower: '☳' }, // 隨 = 澤雷
  18: { upper: '☶', lower: '☴' }, // 蠱 = 山風
  19: { upper: '☷', lower: '☱' }, // 臨 = 地澤
  20: { upper: '☴', lower: '☷' }, // 觀 = 風地
  21: { upper: '☲', lower: '☳' }, // 噬嗑 = 火雷
  22: { upper: '☶', lower: '☲' }, // 賁 = 山火
  23: { upper: '☶', lower: '☷' }, // 剝 = 山地
  24: { upper: '☷', lower: '☳' }, // 復 = 地雷
  25: { upper: '☰', lower: '☳' }, // 无妄 = 天雷
  26: { upper: '☶', lower: '☰' }, // 大畜 = 山天
  27: { upper: '☶', lower: '☳' }, // 頤 = 山雷
  28: { upper: '☱', lower: '☴' }, // 大過 = 澤風
  29: { upper: '☵', lower: '☵' }, // 坎 = 水水
  30: { upper: '☲', lower: '☲' }, // 離 = 火火
  31: { upper: '☱', lower: '☶' }, // 咸 = 澤山
  32: { upper: '☳', lower: '☴' }, // 恆 = 雷風
  33: { upper: '☰', lower: '☶' }, // 遯 = 天山
  34: { upper: '☳', lower: '☰' }, // 大壯 = 雷天
  35: { upper: '☲', lower: '☷' }, // 晉 = 火地
  36: { upper: '☷', lower: '☲' }, // 明夷 = 地火
  37: { upper: '☴', lower: '☲' }, // 家人 = 風火
  38: { upper: '☲', lower: '☱' }, // 睽 = 火澤
  39: { upper: '☵', lower: '☶' }, // 蹇 = 水山
  40: { upper: '☳', lower: '☵' }, // 解 = 雷水
  41: { upper: '☶', lower: '☱' }, // 損 = 山澤
  42: { upper: '☴', lower: '☳' }, // 益 = 風雷
  43: { upper: '☱', lower: '☰' }, // 夬 = 澤天
  44: { upper: '☰', lower: '☴' }, // 姤 = 天風
  45: { upper: '☱', lower: '☷' }, // 萃 = 澤地
  46: { upper: '☷', lower: '☴' }, // 升 = 地風
  47: { upper: '☱', lower: '☵' }, // 困 = 澤水
  48: { upper: '☵', lower: '☴' }, // 井 = 水風
  49: { upper: '☱', lower: '☲' }, // 革 = 澤火
  50: { upper: '☲', lower: '☴' }, // 鼎 = 火風
  51: { upper: '☳', lower: '☳' }, // 震 = 雷雷
  52: { upper: '☶', lower: '☶' }, // 艮 = 山山
  53: { upper: '☴', lower: '☶' }, // 漸 = 風山
  54: { upper: '☳', lower: '☱' }, // 歸妹 = 雷澤
  55: { upper: '☳', lower: '☲' }, // 豐 = 雷火
  56: { upper: '☲', lower: '☶' }, // 旅 = 火山
  57: { upper: '☴', lower: '☴' }, // 巽 = 風風
  58: { upper: '☱', lower: '☱' }, // 兌 = 澤澤
  59: { upper: '☴', lower: '☵' }, // 渙 = 風水
  60: { upper: '☵', lower: '☱' }, // 節 = 水澤
  61: { upper: '☴', lower: '☱' }, // 中孚 = 風澤
  62: { upper: '☳', lower: '☶' }, // 小過 = 雷山
  63: { upper: '☵', lower: '☲' }, // 既濟 = 水火
  64: { upper: '☲', lower: '☵' }, // 未濟 = 火水
};

interface HexagramData {
  number: number;
  symbol: string;
  name: { chinese: string; pinyin: string; english: string };
  slug: string;
  trigrams: { upper: string; lower: string };
  judgment: { classical: string; modern: string };
  lines: Array<{ position: number; name: string; classical: string; modern: string }>;
  extra?: { name: string; classical: string; modern: string };
}

async function fetchHexagramPage(slug: string): Promise<string> {
  const url = `https://ctext.org/book-of-changes/${slug}/zh`;
  console.log(`Fetching: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function parseHexagramHtml(html: string, hexInfo: typeof HEXAGRAM_SLUGS[0]): Partial<HexagramData> {
  // This is a simplified parser - in practice you'd use a proper HTML parser
  // For now, we'll output what we can extract and note what needs manual review

  const result: Partial<HexagramData> = {
    number: hexInfo.number,
    symbol: getHexagramSymbol(hexInfo.number),
    name: {
      chinese: hexInfo.chinese,
      pinyin: hexInfo.pinyin,
      english: hexInfo.english,
    },
    slug: hexInfo.slug,
    trigrams: TRIGRAM_MAPPING[hexInfo.number],
    judgment: { classical: '', modern: '待補充' },
    lines: [],
  };

  // Note: In a real implementation, you'd parse the HTML properly
  // ctext.org pages have a specific structure that can be parsed

  return result;
}

async function scrapeHexagram(hexInfo: typeof HEXAGRAM_SLUGS[0]): Promise<HexagramData | null> {
  try {
    const html = await fetchHexagramPage(hexInfo.slug);
    const data = parseHexagramHtml(html, hexInfo);
    return data as HexagramData;
  } catch (error) {
    console.error(`Error scraping hexagram ${hexInfo.number} (${hexInfo.chinese}):`, error);
    return null;
  }
}

async function main() {
  console.log('I Ching Hexagram Scraper');
  console.log('========================\n');

  // For now, just output the metadata for hexagrams 21-64
  // The actual scraping would require proper HTML parsing

  const hexagrams: HexagramData[] = [];

  for (let i = 20; i < HEXAGRAM_SLUGS.length; i++) {
    const hexInfo = HEXAGRAM_SLUGS[i];
    const hexagram: HexagramData = {
      number: hexInfo.number,
      symbol: getHexagramSymbol(hexInfo.number),
      name: {
        chinese: hexInfo.chinese,
        pinyin: hexInfo.pinyin,
        english: hexInfo.english,
      },
      slug: hexInfo.slug,
      trigrams: TRIGRAM_MAPPING[hexInfo.number],
      judgment: {
        classical: `TODO: 從 ctext.org/book-of-changes/${hexInfo.slug}/zh 獲取`,
        modern: '待補充'
      },
      lines: [
        { position: 1, name: '初爻', classical: 'TODO', modern: '待補充' },
        { position: 2, name: '二爻', classical: 'TODO', modern: '待補充' },
        { position: 3, name: '三爻', classical: 'TODO', modern: '待補充' },
        { position: 4, name: '四爻', classical: 'TODO', modern: '待補充' },
        { position: 5, name: '五爻', classical: 'TODO', modern: '待補充' },
        { position: 6, name: '上爻', classical: 'TODO', modern: '待補充' },
      ],
    };

    hexagrams.push(hexagram);
    console.log(`Generated template for: ${hexInfo.number}. ${hexInfo.chinese} (${hexInfo.english})`);
  }

  // Output JSON
  console.log('\n--- JSON Output (hexagrams 21-64) ---\n');
  console.log(JSON.stringify(hexagrams, null, 2));

  console.log('\n--- Instructions ---');
  console.log('1. The above JSON contains templates for hexagrams 21-64');
  console.log('2. Visit each ctext.org URL to manually extract the classical texts');
  console.log('3. Or use a proper HTML parser (cheerio, jsdom) to automate extraction');
  console.log('4. Merge the results into src/data/hexagrams.json');
}

main().catch(console.error);
