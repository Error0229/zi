# 易象 - I Ching Divination App Design

## Overview

**易象** - 一款以圖問卦的易經占卜應用

Transform images into ASCII art using Yijing hexagram symbols, then derive divination results based on image features and traditional I Ching methodology.

**Core Flow:**
```
圖片 → ASCII 卦象藝術 → 占卜結果
```

---

## Divination Methods

### Three Methods Supported

| 方法 | 原理 | 風格 |
|------|------|------|
| 象數法 | 圖片六區亮度 → 六爻 | 決定性，圖即是卦 |
| 加權銅錢法 | 圖片特徵影響機率 | 半隨機，圖影響命 |
| 大衍之數 | 圖片雜湊為種子 | 傳統隨機，圖問天 |

### Hexagram Derivation (象數法)

- Image split into 6 horizontal bands
- Each band's average brightness → yin (⚋) or yang (⚊)
- Image hash → determines changing lines (變爻)
- Produces: 本卦 + 變爻 + 之卦

---

## Line States & 變爻 System

### The Four Line States (四象)

| 名稱 | 數值 | 符號 | 變化 |
|------|------|------|------|
| 老陰 | 6 | ⚋ ✕ | 陰 → 陽 |
| 少陽 | 7 | ⚊ | 不變 |
| 少陰 | 8 | ⚋ | 不變 |
| 老陽 | 9 | ⚊ ✕ | 陽 → 陰 |

### Divination Result Flow

```
六爻 [9, 7, 8, 6, 7, 9]
        ↓
本卦: 老陽=陽, 老陰=陰 → ䷀ 乾
變爻: 初爻(9), 四爻(6), 上爻(9) ← 會變的爻
之卦: 老陽→陰, 老陰→陽 → ䷋ 否
```

### Reading Rules (傳統解讀法則)

| 變爻數量 | 解讀方式 |
|----------|----------|
| 0 個變爻 | 只看本卦卦辭 |
| 1 個變爻 | 看本卦該爻爻辭 (最常見) |
| 2 個變爻 | 看本卦兩變爻，以上爻為主 |
| 3 個變爻 | 看本卦 + 之卦卦辭 |
| 4 個變爻 | 看之卦兩不變爻，以下爻為主 |
| 5 個變爻 | 看之卦不變爻爻辭 |
| 6 個變爻 | 乾坤看用辭，餘看之卦卦辭 |

---

## Data Model

### TypeScript Interfaces

```typescript
type LineValue = 6 | 7 | 8 | 9;  // 老陰、少陽、少陰、老陽

interface LineState {
  value: LineValue;
  isChanging: boolean;          // 6 or 9 = true
  currentType: 'yang' | 'yin';  // 本卦狀態
  futureType: 'yang' | 'yin';   // 之卦狀態
}

interface DivinationResult {
  lines: LineState[];           // 六爻結果
  primaryHexagram: Hexagram;    // 本卦
  changingLines: number[];      // 變爻位置 [1, 4, 6]
  transformedHexagram: Hexagram | null;  // 之卦 (無變爻則 null)
}

interface Hexagram {
  number: number;               // 1-64
  symbol: string;               // ䷀
  name: {
    chinese: string;            // 乾
    pinyin: string;             // qián
  };
  trigrams: {
    upper: string;              // ☰ 乾
    lower: string;              // ☰ 乾
  };
  judgment: {
    classical: string;          // 乾：元，亨，利，貞。
    modern: string;             // 乾卦象徵天，代表剛健...
  };
  lines: Line[];                // 六爻
}

interface Line {
  position: number;             // 1-6
  name: {
    yang: string;               // 初九、九二...
    yin: string;                // 初六、六二...
  };
  text: {
    classical: string;          // 經文
    modern: string;             // 白話
  };
}
```

---

## Dataset Strategy

### Sources

1. Fork `iching-wilhelm-dataset` JSON structure as base
2. Manually scrape ctext.org for zh-TW classical texts (卦辭 + 384 爻辭)
3. Add modern zh-TW interpretations

### File Structure

```
src/data/
├── hexagrams.json          # 64卦完整資料
├── trigrams.json           # 8卦基本資料 (☰☱☲☳☴☵☶☷)
└── mappings.json           # 卦象對應表
```

---

## UI/UX Design

### Design Principles

```
極簡 · 莊重 · 靜謐
```

### Color Palette

```
背景:   #0a0a0a (近黑)
文字:   #e8e4d9 (古紙白)
強調:   #c9a962 (暗金)
輔助:   #3d3d3d (深灰)
```

### Mobile-First Layout

**Main Flow:**
```
┌──────────────────────┐
│       易 象          │  ← 極簡標題
├──────────────────────┤
│                      │
│    [ 上傳圖片 ]      │  ← 單一入口
│                      │
├──────────────────────┤
│  ○ 象數法            │
│  ○ 加權銅錢          │  ← 占卜方式選擇
│  ○ 大衍之數          │
├──────────────────────┤
│                      │
│     [ 起卦 ]         │  ← 主要動作
│                      │
└──────────────────────┘
```

**Result Page:**
```
┌──────────────────────┐
│  ━━━ ASCII 卦象 ━━━  │  ← 可收合
│  ䷀䷀䷀䷀䷀䷀䷀䷀䷀䷀   │
│  ䷁䷀䷀䷁䷀䷀䷁䷀䷀䷁   │
│  ...                 │
├──────────────────────┤
│                      │
│   ䷀ 乾               │  ← 本卦
│   乾：元，亨，利，貞。│
│                      │
│   【變爻】初九        │
│   潛龍勿用。          │
│                      │
│   ━━━━━━━━━━━━━━━━   │
│                      │
│   之卦：䷁ 坤         │  ← 變化後
│   ...                │
│                      │
├──────────────────────┤
│  [ 存入歷史 ]        │
└──────────────────────┘
```

### Typography

- 卦名/標題: Noto Serif TC (宋體感)
- 經文: Noto Serif TC
- UI 元素: Noto Sans TC
- 卦象符號: Noto Sans Symbols 2

### Responsive Breakpoints

- Desktop: 雙欄並排 (ASCII + 結果)
- Mobile: 單欄堆疊

### Mobile Specific

- 預設 ASCII 寬度: 40-60 字元
- 支援相機拍照 + 相簿選擇
- `<input type="file" accept="image/*" capture>`

---

## Animation Design

### Three Phases

```
Phase 1: 靜態              Phase 2: 混沌              Phase 3: 凝聚
━━━━━━━━━━━━━━━          ━━━━━━━━━━━━━━━          ━━━━━━━━━━━━━━━

  ䷀䷁䷂䷃䷄䷅䷆䷇            ䷿䷸䷱䷪䷣䷜䷕䷎            ䷁䷁䷁䷀䷀䷀䷁䷁䷁
  ䷈䷉䷊䷋䷌䷍䷎䷏     →      ䷇䷀䷹䷲䷫䷤䷝䷖     →      ䷁䷀䷀䷀䷀䷀䷀䷁
  ䷐䷑䷒䷓䷔䷕䷖䷗            ䷏䷈䷁䷺䷳䷬䷥䷞            ䷁䷀      ䷀䷁
  ䷘䷙䷚䷛䷜䷝䷞䷟            ䷗䷐䷉䷂䷻䷴䷭䷦            ䷁䷀䷀䷀䷀䷀䷀䷁
  (圖片形狀)              (隨機抖動)               ䷁䷁䷁䷀䷀䷀䷁䷁䷁

  ~1s 顯示原圖             ~2s 混沌動畫             淡入最終卦象
                         (字元快速切換)
```

### Animation Timing

| Phase | Duration | Effect |
|-------|----------|--------|
| 混沌期 | 1.5-2s | 每格字元隨機切換 (每 50-100ms) |
| 凝聚期 | 0.5-1s | 從邊緣向中心逐漸定型 |
| 揭示 | 0.3s | 最終卦象淡入 + 輕微放大 |

### Binary ASCII Art (Final State)

Use existing ASCII generation algorithm with binary character set:

```
暗區 → ䷁ (坤，最密/暗)
亮區 → 占得之卦 (例如 ䷀)
```

**Implementation:**
```typescript
function generateBinaryHexagramArt(
  hexagramSymbol: string,  // 占得之卦 e.g. ䷀
  width: number,
  settings: Settings
): string {
  // 1. Render hexagram symbol to canvas
  const imageData = renderHexagramToCanvas(hexagramSymbol);

  // 2. For each pixel, binary choice:
  //    brightness > threshold → hexagramSymbol
  //    brightness <= threshold → ䷁
  const darkChar = '䷁';  // 坤 for dark
  const brightChar = hexagramSymbol;  // 本卦 for bright

  return generateBinaryAscii(imageData, darkChar, brightChar);
}
```

---

## History & Storage

### LocalStorage Schema

```typescript
interface DivinationRecord {
  id: string;                    // UUID
  timestamp: number;             // Unix timestamp

  // 輸入
  imageData: string;             // Base64 thumbnail (壓縮後)
  imageName: string;             // 原始檔名
  method: 'image' | 'coins' | 'yarrow';  // 占卜方法

  // 結果
  lines: LineValue[];            // [9, 7, 8, 6, 7, 9]
  primaryHexagram: number;       // 1-64
  changingLines: number[];       // [1, 4, 6]
  transformedHexagram: number | null;  // 1-64 or null

  // ASCII Art (可選，用於快速顯示)
  asciiArt?: string;             // 原圖 ASCII
  hexagramArt?: string;          // 卦象 ASCII
}

interface StorageSchema {
  version: number;               // Schema 版本，便於遷移
  records: DivinationRecord[];
}
```

### Storage Limits

```
單筆圖片: 壓縮至 ~50KB (thumbnail)
總上限:   ~5MB (約 100 筆紀錄)
超限策略: 刪除最舊紀錄
```

### Operations

- 查看歷史列表
- 展開檢視完整結果
- 刪除單筆紀錄
- 清空全部 (需確認)

---

## Project Structure

```
src/
├── components/
│   ├── DivinationWizard.tsx    # 主流程元件
│   ├── ImageUploader.tsx       # 圖片上傳 (相機/相簿)
│   ├── MethodSelector.tsx      # 占卜方式選擇
│   ├── AsciiDisplay.tsx        # ASCII 顯示 + 動畫
│   ├── ResultView.tsx          # 結果顯示
│   └── HistoryList.tsx         # 歷史紀錄
├── data/
│   ├── hexagrams.json          # 64卦資料 (經文 + 白話)
│   ├── trigrams.json           # 8卦
│   └── mappings.json           # 對應表
├── utils/
│   ├── hexagrams.ts            # (現有) 密度計算
│   ├── divination.ts           # 占卜算法
│   │   ├── imageMethod()       # 象數法
│   │   ├── coinsMethod()       # 加權銅錢
│   │   └── yarrowMethod()      # 大衍之數
│   ├── asciiGenerator.ts       # ASCII 生成
│   ├── binaryAscii.ts          # 二元卦象 ASCII
│   └── storage.ts              # LocalStorage 操作
├── hooks/
│   ├── useDivination.ts        # 占卜邏輯 hook
│   └── useHistory.ts           # 歷史紀錄 hook
└── types/
    ├── hexagram.ts             # 卦象類型
    ├── divination.ts           # 占卜結果類型
    └── settings.ts             # (現有) 設定類型
```

---

## Feature Priorities

### Must-Have (v1)

- [ ] 三種占卜方法實作
- [ ] 四象 + 變爻系統
- [ ] 64卦資料集 (經文 + 白話)
- [ ] Mobile-first 響應式 UI
- [ ] 起卦動畫 (圖片 → 混沌 → 二元卦象)
- [ ] 歷史紀錄 (LocalStorage)

### Nice-to-Have (v2)

- [ ] 圖片匯出 (分享用)
- [ ] 文字複製
- [ ] 更多經典註解 (彖傳、象傳)

### Skip

- [ ] 浮水印/品牌
- [ ] AI 生成綜合建議

---

## External Resources

### Dataset Sources

- [iching-wilhelm-dataset](https://github.com/adamblvck/iching-wilhelm-dataset) - JSON structure reference
- [ctext.org](https://ctext.org/book-of-changes/yi-jing) - Authoritative zh-TW classical texts

---

## App Identity

- **Name**: 易象
- **Tagline**: None (minimal approach)
- **Aesthetic**: 極簡 · 莊重 · 靜謐
