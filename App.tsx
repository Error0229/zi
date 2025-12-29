import React, { useState } from 'react';
import { AsciiGenerator } from './components/AsciiGenerator';
import { DivinationWizard } from './components/DivinationWizard';
import { BaguaPattern } from './components/ui/OracleUI';

/* ═══════════════════════════════════════════════════════════════════════════
   易象 - I-Ching Divination App
   以圖問卦的易經占卜應用
   ═══════════════════════════════════════════════════════════════════════════ */

type AppMode = 'divination' | 'ascii';

export default function App() {
  const [mode, setMode] = useState<AppMode>('divination');

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Decorative background pattern */}
      <BaguaPattern />

      {/* Header */}
      <header
        style={{
          textAlign: 'center',
          padding: 'var(--space-3xl) var(--space-lg) var(--space-2xl)',
          position: 'relative',
        }}
      >
        {/* Decorative trigrams */}
        <div
          style={{
            position: 'absolute',
            top: 'var(--space-lg)',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 'var(--space-xl)',
            opacity: 0.3,
            color: 'var(--gold)',
            fontSize: '14px',
          }}
        >
          <span>☰</span>
          <span>☱</span>
          <span>☲</span>
          <span>☳</span>
          <span style={{ opacity: 0 }}>·</span>
          <span>☴</span>
          <span>☵</span>
          <span>☶</span>
          <span>☷</span>
        </div>

        {/* Main title */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 6vw, 56px)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            marginBottom: 'var(--space-md)',
            background: 'linear-gradient(135deg, var(--gold-light) 0%, var(--gold) 40%, var(--gold-dark) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 0 60px var(--gold-glow)',
          }}
        >
          易象
        </h1>

        {/* Mode Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          <button
            onClick={() => setMode('divination')}
            style={{
              padding: 'var(--space-sm) var(--space-lg)',
              background: mode === 'divination' ? 'rgba(201, 169, 98, 0.2)' : 'transparent',
              border: mode === 'divination' ? '1px solid var(--gold)' : '1px solid var(--ink-light)',
              borderRadius: '4px',
              color: mode === 'divination' ? 'var(--gold)' : 'var(--paper-shadow)',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              letterSpacing: '0.05em',
              transition: 'all var(--transition-fast)',
            }}
          >
            占卜
          </button>
          <button
            onClick={() => setMode('ascii')}
            style={{
              padding: 'var(--space-sm) var(--space-lg)',
              background: mode === 'ascii' ? 'rgba(201, 169, 98, 0.2)' : 'transparent',
              border: mode === 'ascii' ? '1px solid var(--gold)' : '1px solid var(--ink-light)',
              borderRadius: '4px',
              color: mode === 'ascii' ? 'var(--gold)' : 'var(--paper-shadow)',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              letterSpacing: '0.05em',
              transition: 'all var(--transition-fast)',
            }}
          >
            ASCII 藝術
          </button>
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: '120px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
            margin: '0 auto',
            opacity: 0.5,
          }}
        />
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 var(--space-lg) var(--space-2xl)',
        }}
      >
        {mode === 'divination' ? <DivinationWizard /> : <AsciiGenerator />}
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: 'var(--space-xl) var(--space-lg)',
          borderTop: '1px solid var(--ink-light)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--ink-wash)',
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-sm)',
          }}
        >
          Using Unicode Range U+4DC0..U+4DFF
          <span style={{ margin: '0 var(--space-md)', opacity: 0.3 }}>|</span>
          Yijing Hexagram Symbols
        </p>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '12px',
            color: 'var(--gold)',
            opacity: 0.5,
            letterSpacing: '0.1em',
          }}
        >
          以圖問卦
        </p>
      </footer>
    </div>
  );
}
