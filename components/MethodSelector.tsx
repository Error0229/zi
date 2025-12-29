import React from 'react';
import type { DivinationMethod } from '../types/divination';

/* ═══════════════════════════════════════════════════════════════════════════
   Method Selector - 占卜方式選擇
   ═══════════════════════════════════════════════════════════════════════════ */

interface MethodOption {
  value: DivinationMethod;
  label: string;
  description: string;
  symbol: string;
}

const METHODS: MethodOption[] = [
  {
    value: 'image',
    label: '象數法',
    description: '圖片六區亮度 → 六爻',
    symbol: '☰',
  },
  {
    value: 'coins',
    label: '加權銅錢',
    description: '圖片特徵影響機率',
    symbol: '☯',
  },
  {
    value: 'yarrow',
    label: '大衍之數',
    description: '圖片雜湊為種子',
    symbol: '䷀',
  },
];

interface MethodSelectorProps {
  value: DivinationMethod;
  onChange: (method: DivinationMethod) => void;
  disabled?: boolean;
}

export const MethodSelector: React.FC<MethodSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
      }}
    >
      {METHODS.map((method) => (
        <button
          key={method.value}
          type="button"
          onClick={() => onChange(method.value)}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            padding: 'var(--space-md)',
            background: value === method.value
              ? 'rgba(201, 169, 98, 0.15)'
              : 'rgba(42, 42, 42, 0.5)',
            border: value === method.value
              ? '1px solid var(--gold)'
              : '1px solid var(--ink-light)',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all var(--transition-fast)',
            textAlign: 'left',
          }}
        >
          {/* Radio indicator */}
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: value === method.value
                ? '2px solid var(--gold)'
                : '2px solid var(--ink-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {value === method.value && (
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--gold)',
                }}
              />
            )}
          </div>

          {/* Symbol */}
          <span
            style={{
              fontSize: '24px',
              color: value === method.value ? 'var(--gold)' : 'var(--paper-shadow)',
              width: '32px',
              textAlign: 'center',
            }}
          >
            {method.symbol}
          </span>

          {/* Label and description */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '15px',
                color: value === method.value ? 'var(--gold)' : 'var(--paper-cream)',
                marginBottom: '2px',
              }}
            >
              {method.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                color: 'var(--ink-wash)',
              }}
            >
              {method.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
