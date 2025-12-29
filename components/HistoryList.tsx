import React, { useState } from 'react';
import { useHistory } from '../hooks/useHistory';
import { getHexagram } from '../utils/divination';
import { OraclePanel, SectionHeader, OracleDivider, SealButton, EmptyState } from './ui/OracleUI';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { DivinationRecord } from '../utils/storage';

/* ═══════════════════════════════════════════════════════════════════════════
   History List - 歷史紀錄列表
   ═══════════════════════════════════════════════════════════════════════════ */

interface HistoryListProps {
  onSelectRecord?: (record: DivinationRecord) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ onSelectRecord }) => {
  const { records, storageInfo, remove, clearAll, isLoading } = useHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (isLoading) {
    return (
      <OraclePanel>
        <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--ink-wash)' }}>
          載入中...
        </div>
      </OraclePanel>
    );
  }

  if (records.length === 0) {
    return (
      <OraclePanel>
        <EmptyState symbol="☰" message="尚無占卜紀錄" />
      </OraclePanel>
    );
  }

  const methodLabels: Record<string, string> = {
    image: '象數法',
    coins: '加權銅錢',
    yarrow: '大衍之數',
  };

  return (
    <OraclePanel>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-md)',
        }}
      >
        <SectionHeader trigram="☷">歷史紀錄</SectionHeader>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--ink-wash)',
          }}
        >
          {storageInfo.count} 筆 · {storageInfo.sizeKB}KB
        </span>
      </div>

      {/* Record list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
        }}
      >
        {records.map((record) => {
          const hex = getHexagram(record.primaryHexagram);
          const transformedHex = record.transformedHexagram
            ? getHexagram(record.transformedHexagram)
            : null;
          const isExpanded = expandedId === record.id;

          return (
            <div
              key={record.id}
              style={{
                background: 'rgba(42, 42, 42, 0.5)',
                border: '1px solid var(--ink-light)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              {/* Header row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--ink-void)',
                  }}
                >
                  <img
                    src={record.imageData}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '24px',
                        color: 'var(--gold)',
                      }}
                    >
                      {hex?.symbol}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '16px',
                        color: 'var(--paper-cream)',
                      }}
                    >
                      {hex?.name.chinese}
                    </span>
                    {transformedHex && (
                      <>
                        <span style={{ color: 'var(--ink-wash)', fontSize: '14px' }}>→</span>
                        <span style={{ fontSize: '20px', color: 'var(--paper-shadow)' }}>
                          {transformedHex.symbol}
                        </span>
                      </>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--space-sm)',
                      fontSize: '12px',
                      color: 'var(--ink-wash)',
                    }}
                  >
                    <span>{methodLabels[record.method]}</span>
                    <span>·</span>
                    <span>{formatDate(record.timestamp)}</span>
                  </div>
                </div>

                {/* Expand icon */}
                <div style={{ color: 'var(--ink-wash)' }}>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  style={{
                    padding: 'var(--space-md)',
                    borderTop: '1px solid var(--ink-light)',
                    background: 'rgba(10, 10, 10, 0.3)',
                  }}
                >
                  {/* Lines display */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--space-xs)',
                      marginBottom: 'var(--space-md)',
                      justifyContent: 'center',
                    }}
                  >
                    {record.lines.map((value, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background:
                            value === 6 || value === 9
                              ? 'rgba(201, 169, 98, 0.2)'
                              : 'rgba(42, 42, 42, 0.5)',
                          border:
                            value === 6 || value === 9
                              ? '1px solid var(--gold)'
                              : '1px solid var(--ink-light)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: value === 6 || value === 9 ? 'var(--gold)' : 'var(--paper-shadow)',
                        }}
                      >
                        {value}
                      </div>
                    ))}
                  </div>

                  {/* Changing lines */}
                  {record.changingLines.length > 0 && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--ink-wash)',
                        textAlign: 'center',
                        marginBottom: 'var(--space-md)',
                      }}
                    >
                      變爻：{record.changingLines.map((p) => `第${p}爻`).join('、')}
                    </div>
                  )}

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--space-sm)',
                      justifyContent: 'center',
                    }}
                  >
                    {onSelectRecord && (
                      <button
                        onClick={() => onSelectRecord(record)}
                        style={{
                          padding: 'var(--space-xs) var(--space-md)',
                          background: 'transparent',
                          border: '1px solid var(--gold)',
                          borderRadius: '4px',
                          color: 'var(--gold)',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        查看詳情
                      </button>
                    )}
                    <button
                      onClick={() => remove(record.id)}
                      style={{
                        padding: 'var(--space-xs) var(--space-md)',
                        background: 'transparent',
                        border: '1px solid var(--cinnabar)',
                        borderRadius: '4px',
                        color: 'var(--cinnabar)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Trash2 size={14} />
                      刪除
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Clear all */}
      <OracleDivider symbol="☯" />

      {showClearConfirm ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '14px', color: 'var(--cinnabar)' }}>確定要清空所有紀錄？</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              onClick={() => {
                clearAll();
                setShowClearConfirm(false);
              }}
              style={{
                padding: 'var(--space-xs) var(--space-md)',
                background: 'var(--cinnabar)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              確定清空
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              style={{
                padding: 'var(--space-xs) var(--space-md)',
                background: 'transparent',
                border: '1px solid var(--ink-light)',
                borderRadius: '4px',
                color: 'var(--paper-shadow)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowClearConfirm(true)}
          style={{
            width: '100%',
            padding: 'var(--space-sm)',
            background: 'transparent',
            border: '1px solid var(--ink-light)',
            borderRadius: '4px',
            color: 'var(--ink-wash)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          清空全部紀錄
        </button>
      )}
    </OraclePanel>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '剛才';
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  });
}
