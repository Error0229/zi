import React from 'react';
import type { DivinationResult, ReadingInterpretation, Hexagram, LineState } from '../types/divination';
import { OracleDivider } from './ui/OracleUI';

/* ═══════════════════════════════════════════════════════════════════════════
   Result View - 占卜結果顯示
   ═══════════════════════════════════════════════════════════════════════════ */

interface ResultViewProps {
  result: DivinationResult;
  interpretation: ReadingInterpretation;
}

export const ResultView: React.FC<ResultViewProps> = ({ result, interpretation }) => {
  const { primaryHexagram, transformedHexagram, changingLines, lines } = result;

  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        color: 'var(--paper-cream)',
      }}
    >
      {/* Primary Hexagram - 本卦 */}
      <HexagramCard
        hexagram={primaryHexagram}
        title="本卦"
        lines={lines}
        changingLines={changingLines}
        showLineTexts={interpretation.focus === 'primary' && interpretation.relevantLines.length > 0}
        relevantLines={interpretation.relevantLines}
      />

      {/* Changing Lines Summary */}
      {changingLines.length > 0 && (
        <div
          style={{
            margin: 'var(--space-lg) 0',
            padding: 'var(--space-md)',
            background: 'rgba(201, 169, 98, 0.1)',
            border: '1px solid rgba(201, 169, 98, 0.3)',
            borderRadius: '4px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: 'var(--gold)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            變爻：{changingLines.map(pos => getLineName(pos)).join('、')}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--paper-shadow)',
            }}
          >
            {interpretation.description}
          </div>
        </div>
      )}

      {/* Transformed Hexagram - 之卦 */}
      {transformedHexagram && (
        <>
          <OracleDivider symbol="→" />
          <HexagramCard
            hexagram={transformedHexagram}
            title="之卦"
            showLineTexts={interpretation.focus === 'transformed' && interpretation.relevantLines.length > 0}
            relevantLines={interpretation.relevantLines}
          />
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Hexagram Card - 卦象卡片
   ═══════════════════════════════════════════════════════════════════════════ */

interface HexagramCardProps {
  hexagram: Hexagram;
  title: string;
  lines?: LineState[];
  changingLines?: number[];
  showLineTexts?: boolean;
  relevantLines?: number[];
}

const HexagramCard: React.FC<HexagramCardProps> = ({
  hexagram,
  title,
  lines,
  changingLines = [],
  showLineTexts = false,
  relevantLines = [],
}) => {
  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-md)',
        }}
      >
        {/* Hexagram Symbol */}
        <div
          style={{
            fontSize: '64px',
            lineHeight: 1,
            color: 'var(--gold)',
            filter: 'drop-shadow(0 0 20px var(--gold-glow))',
          }}
        >
          {hexagram.symbol}
        </div>

        {/* Name and meta */}
        <div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--ink-wash)',
              marginBottom: '2px',
              letterSpacing: '0.1em',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: 'var(--paper-cream)',
              marginBottom: '4px',
            }}
          >
            {hexagram.name.chinese}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--paper-shadow)',
            }}
          >
            {hexagram.name.pinyin} · {hexagram.trigrams.upper}{hexagram.trigrams.lower}
          </div>
        </div>
      </div>

      {/* Six Lines Visual */}
      {lines && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column-reverse', // Bottom to top
            gap: '4px',
            marginBottom: 'var(--space-md)',
            padding: 'var(--space-sm)',
            background: 'rgba(10, 10, 10, 0.5)',
            borderRadius: '4px',
          }}
        >
          {lines.map((line, idx) => {
            const position = idx + 1;
            const isChanging = changingLines.includes(position);
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                }}
              >
                {/* Line visual */}
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    width: '60px',
                  }}
                >
                  {line.currentType === 'yang' ? (
                    <div
                      style={{
                        flex: 1,
                        height: '8px',
                        background: isChanging ? 'var(--gold)' : 'var(--paper-cream)',
                        borderRadius: '2px',
                      }}
                    />
                  ) : (
                    <>
                      <div
                        style={{
                          flex: 1,
                          height: '8px',
                          background: isChanging ? 'var(--gold)' : 'var(--paper-cream)',
                          borderRadius: '2px',
                        }}
                      />
                      <div style={{ width: '12px' }} />
                      <div
                        style={{
                          flex: 1,
                          height: '8px',
                          background: isChanging ? 'var(--gold)' : 'var(--paper-cream)',
                          borderRadius: '2px',
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Line label */}
                <span
                  style={{
                    fontSize: '11px',
                    color: isChanging ? 'var(--gold)' : 'var(--ink-wash)',
                    width: '30px',
                  }}
                >
                  {getLineLabel(position, line.currentType)}
                </span>

                {/* Value indicator */}
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--ink-wash)',
                    opacity: 0.6,
                  }}
                >
                  {line.value}
                </span>

                {/* Changing indicator */}
                {isChanging && (
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--gold)',
                    }}
                  >
                    ✕
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Judgment - 卦辭 */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--gold)',
            marginBottom: 'var(--space-xs)',
            letterSpacing: '0.1em',
          }}
        >
          卦辭
        </div>
        <div
          style={{
            fontSize: '16px',
            lineHeight: 1.8,
            color: 'var(--paper-cream)',
            fontFamily: 'var(--font-display)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          {hexagram.judgment.classical}
        </div>
        <div
          style={{
            fontSize: '14px',
            lineHeight: 1.7,
            color: 'var(--paper-shadow)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {hexagram.judgment.modern}
        </div>
      </div>

      {/* Line Texts - 爻辭 */}
      {showLineTexts && relevantLines.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--gold)',
              marginBottom: 'var(--space-sm)',
              letterSpacing: '0.1em',
            }}
          >
            爻辭
          </div>
          {relevantLines.map(pos => {
            const line = hexagram.lines[pos - 1];
            if (!line) return null;
            return (
              <div
                key={pos}
                style={{
                  marginBottom: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  background: 'rgba(201, 169, 98, 0.08)',
                  borderLeft: '3px solid var(--gold)',
                  borderRadius: '0 4px 4px 0',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--gold)',
                    marginBottom: 'var(--space-xs)',
                  }}
                >
                  {line.name}
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.7,
                    color: 'var(--paper-cream)',
                    fontFamily: 'var(--font-display)',
                    marginBottom: 'var(--space-xs)',
                  }}
                >
                  {line.classical}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: 'var(--paper-shadow)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {line.modern}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extra (用九/用六) for Qian/Kun */}
      {hexagram.extra && changingLines?.length === 6 && (
        <div
          style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md)',
            background: 'rgba(201, 169, 98, 0.08)',
            borderLeft: '3px solid var(--gold)',
            borderRadius: '0 4px 4px 0',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: 'var(--gold)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            {hexagram.extra.name}
          </div>
          <div
            style={{
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'var(--paper-cream)',
              fontFamily: 'var(--font-display)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            {hexagram.extra.classical}
          </div>
          <div
            style={{
              fontSize: '13px',
              lineHeight: 1.6,
              color: 'var(--paper-shadow)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {hexagram.extra.modern}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function getLineName(position: number): string {
  const names = ['初', '二', '三', '四', '五', '上'];
  return names[position - 1] + '爻';
}

function getLineLabel(position: number, type: 'yang' | 'yin'): string {
  const posNames = ['初', '二', '三', '四', '五', '上'];
  const prefix = posNames[position - 1];
  const suffix = type === 'yang' ? '九' : '六';

  // Special case for first and last positions
  if (position === 1) return `初${suffix}`;
  if (position === 6) return `上${suffix}`;
  return `${suffix}${prefix}`;
}
