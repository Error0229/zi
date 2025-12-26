import React from 'react';
import { AsciiGenerator } from './components/AsciiGenerator';
import { BaguaPattern } from './components/ui/OracleUI';

/* ═══════════════════════════════════════════════════════════════════════════
   I-Ching Oracle - Main Application
   Transform reality into the 64 Hexagrams of the Book of Changes
   ═══════════════════════════════════════════════════════════════════════════ */

export default function App() {
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
          易經
        </h1>

        {/* Subtitle */}
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(18px, 3vw, 24px)',
            fontWeight: 400,
            letterSpacing: '0.15em',
            color: 'var(--paper-cream)',
            marginBottom: 'var(--space-lg)',
            textTransform: 'uppercase',
          }}
        >
          I-Ching Oracle
        </h2>

        {/* Description */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            color: 'var(--paper-shadow)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.7,
            fontStyle: 'italic',
          }}
        >
          Transform reality into the 64 Hexagrams of the Book of Changes
          <br />
          through algorithmic density mapping
        </p>

        {/* Decorative line */}
        <div
          style={{
            width: '120px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
            margin: 'var(--space-xl) auto 0',
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
        <AsciiGenerator />
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
          Pure Algorithmic Processing
        </p>
      </footer>
    </div>
  );
}
