import React, { ReactNode, forwardRef, useState, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   Oracle UI Components - I-Ching Mystical Design System
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// Oracle Panel - Main container with golden top accent
// ─────────────────────────────────────────────────────────────────────────────
interface OraclePanelProps {
  children: ReactNode;
  className?: string;
  withCorners?: boolean;
}

export const OraclePanel: React.FC<OraclePanelProps> = ({
  children,
  className = '',
  withCorners = false,
}) => {
  return (
    <div
      className={`oracle-panel ${withCorners ? 'trigram-corners' : ''} ${className}`}
      style={{ padding: 'var(--space-lg)' }}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section Header - With I-Ching trigram icon
// ─────────────────────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  icon?: ReactNode;
  trigram?: string;
  children: ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  trigram,
  children,
}) => {
  return (
    <h3 className="section-header">
      {trigram && <span className="section-header-icon">{trigram}</span>}
      {icon && <span className="section-header-icon">{icon}</span>}
      {children}
    </h3>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Oracle Divider - Section separator with symbol
// ─────────────────────────────────────────────────────────────────────────────
interface OracleDividerProps {
  symbol?: string;
}

export const OracleDivider: React.FC<OracleDividerProps> = ({
  symbol = '☯',
}) => {
  return (
    <div className="oracle-divider" style={{ margin: 'var(--space-lg) 0' }}>
      <span className="oracle-divider-symbol">{symbol}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Oracle Slider - Golden orb thumb slider
// ─────────────────────────────────────────────────────────────────────────────
interface OracleSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  displayValue?: string;
  hint?: string;
}

export const OracleSlider: React.FC<OracleSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  displayValue,
  hint,
}) => {
  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-xs)',
        }}
      >
        <label
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--paper-cream)',
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--gold)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displayValue ?? value}
        </span>
      </div>
      <input
        type="range"
        className="oracle-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      {hint && (
        <p
          style={{
            marginTop: 'var(--space-xs)',
            fontSize: '11px',
            color: 'var(--ink-wash)',
            fontStyle: 'italic',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Oracle Toggle - Yin-Yang toggle switch
// ─────────────────────────────────────────────────────────────────────────────
interface OracleToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

export const OracleToggle: React.FC<OracleToggleProps> = ({
  value,
  onChange,
  label,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-sm) var(--space-md)',
        background: 'rgba(42, 42, 42, 0.5)',
        borderRadius: '4px',
        marginBottom: 'var(--space-md)',
      }}
    >
      <label
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--paper-cream)',
        }}
      >
        {label}
      </label>
      <button
        type="button"
        className={`oracle-toggle ${value ? 'active' : ''}`}
        onClick={() => onChange(!value)}
        aria-pressed={value}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Oracle Select - Dropdown with custom styling
// ─────────────────────────────────────────────────────────────────────────────
interface OracleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
  hint?: string;
}

export const OracleSelect: React.FC<OracleSelectProps> = ({
  value,
  onChange,
  options,
  label,
  hint,
}) => {
  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-xs)',
        }}
      >
        <label
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--paper-cream)',
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--gold)',
            textTransform: 'capitalize',
          }}
        >
          {value}
        </span>
      </div>
      <select
        className="oracle-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && (
        <p
          style={{
            marginTop: 'var(--space-xs)',
            fontSize: '11px',
            color: 'var(--ink-wash)',
            fontStyle: 'italic',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Icon Button - Circular icon button with variants
// ─────────────────────────────────────────────────────────────────────────────
interface IconButtonProps {
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  variant = 'default',
  size = 'md',
  title,
  disabled = false,
}) => {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  return (
    <button
      type="button"
      className={`icon-button ${variant}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {icon}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Seal Button - Traditional Chinese seal stamp button
// ─────────────────────────────────────────────────────────────────────────────
interface SealButtonProps {
  children: ReactNode;
  onClick: () => void;
  icon?: ReactNode;
  fullWidth?: boolean;
  variant?: 'cinnabar' | 'gold' | 'jade';
}

export const SealButton: React.FC<SealButtonProps> = ({
  children,
  onClick,
  icon,
  fullWidth = false,
  variant = 'cinnabar',
}) => {
  const variantStyles = {
    cinnabar: {
      borderColor: 'var(--cinnabar)',
      color: 'var(--cinnabar)',
      hoverBg: 'var(--cinnabar)',
    },
    gold: {
      borderColor: 'var(--gold)',
      color: 'var(--gold)',
      hoverBg: 'var(--gold)',
    },
    jade: {
      borderColor: 'var(--jade)',
      color: 'var(--jade)',
      hoverBg: 'var(--jade)',
    },
  };

  const style = variantStyles[variant];

  return (
    <button
      type="button"
      className="seal-button"
      onClick={onClick}
      style={{
        width: fullWidth ? '100%' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-sm)',
        borderColor: style.borderColor,
        color: style.color,
      }}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Oracle Progress - Timeline progress bar
// ─────────────────────────────────────────────────────────────────────────────
interface OracleProgressProps {
  value: number; // 0-100
  showOrb?: boolean;
}

export const OracleProgress: React.FC<OracleProgressProps> = ({
  value,
  showOrb = true,
}) => {
  return (
    <div className="oracle-progress">
      <div
        className="oracle-progress-bar"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Oracle Loading - Spinning hexagram loader
// ─────────────────────────────────────────────────────────────────────────────
interface OracleLoadingProps {
  message?: string;
  symbol?: string;
}

export const OracleLoading: React.FC<OracleLoadingProps> = ({
  message = 'Consulting the oracle...',
  symbol = '☯',
}) => {
  return (
    <div className="oracle-loading">
      <div className="oracle-loading-symbol">{symbol}</div>
      <div className="oracle-loading-text">{message}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Upload Zone - Drag and drop area with mystical styling
// ─────────────────────────────────────────────────────────────────────────────
interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  icon?: ReactNode;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  accept = 'image/*',
  icon,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <label
      className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="upload-zone-icon">{icon || '䷀'}</div>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--paper-cream)',
          marginBottom: 'var(--space-xs)',
        }}
      >
        <strong>Click to upload</strong> or drag and drop
      </p>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--ink-wash)',
        }}
      >
        JPG, PNG, WEBP, GIF
      </p>
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </label>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Image Preview - With golden frame
// ─────────────────────────────────────────────────────────────────────────────
interface ImagePreviewProps {
  src: string;
  alt?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt = 'Preview',
}) => {
  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '16/9',
        width: '100%',
        borderRadius: '4px',
        overflow: 'hidden',
        background: 'var(--ink-void)',
        border: '1px solid var(--ink-light)',
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
      {/* Corner accents */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '20px',
          height: '20px',
          borderTop: '2px solid var(--gold)',
          borderLeft: '2px solid var(--gold)',
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '20px',
          height: '20px',
          borderTop: '2px solid var(--gold)',
          borderRight: '2px solid var(--gold)',
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '20px',
          height: '20px',
          borderBottom: '2px solid var(--gold)',
          borderLeft: '2px solid var(--gold)',
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '20px',
          height: '20px',
          borderBottom: '2px solid var(--gold)',
          borderRight: '2px solid var(--gold)',
          opacity: 0.5,
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Toast Notification
// ─────────────────────────────────────────────────────────────────────────────
interface ToastProps {
  message: string;
  visible: boolean;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, visible, onClose }) => {
  useEffect(() => {
    if (visible && onClose) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <div className={`oracle-toast ${visible ? 'visible' : ''}`}>
      <span style={{ marginRight: 'var(--space-sm)' }}>☯</span>
      {message}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Stats Display - For showing metrics
// ─────────────────────────────────────────────────────────────────────────────
interface StatsDisplayProps {
  stats: { label: string; value: string | number }[];
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-lg)',
        padding: 'var(--space-md) 0',
        borderTop: '1px solid var(--ink-light)',
        marginTop: 'var(--space-md)',
      }}
    >
      {stats.map((stat, i) => (
        <div key={i} className="info-badge">
          <span style={{ opacity: 0.7 }}>{stat.label}:</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{stat.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hexagram Display Container
// ─────────────────────────────────────────────────────────────────────────────
interface HexagramDisplayProps {
  children: ReactNode;
  className?: string;
}

export const HexagramDisplay = forwardRef<HTMLDivElement, HexagramDisplayProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`hexagram-scroll ${className}`}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--space-lg)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          minHeight: '400px',
        }}
      >
        {children}
      </div>
    );
  }
);

HexagramDisplay.displayName = 'HexagramDisplay';

// ─────────────────────────────────────────────────────────────────────────────
// Empty State - Placeholder for when no content
// ─────────────────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  symbol?: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  symbol = '䷀',
  message,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-3xl) var(--space-lg)',
        color: 'var(--ink-wash)',
      }}
    >
      <div
        className="animate-breath"
        style={{
          fontSize: '72px',
          color: 'var(--gold)',
          opacity: 0.4,
          marginBottom: 'var(--space-lg)',
          filter: 'drop-shadow(0 0 20px var(--gold-glow))',
        }}
      >
        {symbol}
      </div>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '16px',
          letterSpacing: '0.1em',
          textAlign: 'center',
        }}
      >
        {message}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Bagua Background Pattern (decorative)
// ─────────────────────────────────────────────────────────────────────────────
export const BaguaPattern: React.FC = () => {
  const trigrams = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        opacity: 0.02,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {trigrams.map((t, i) => {
        const angle = (i * 45 - 90) * (Math.PI / 180);
        const x = Math.cos(angle) * 200 + 300;
        const y = Math.sin(angle) * 200 + 300;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              fontSize: '48px',
              transform: 'translate(-50%, -50%)',
              color: 'var(--gold)',
            }}
          >
            {t}
          </span>
        );
      })}
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '120px',
          color: 'var(--gold)',
        }}
      >
        ☯
      </span>
    </div>
  );
};
