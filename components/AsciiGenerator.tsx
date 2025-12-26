import React, { useState, useEffect, useRef, useCallback } from 'react';
import { calculateCharacterDensities, getAllHexagrams } from '../utils/hexagrams';
import { Play, Download, Copy, RotateCcw } from 'lucide-react';
import { BadApplePlayer } from './BadApplePlayer';
import {
  OraclePanel,
  SectionHeader,
  OracleDivider,
  OracleSlider,
  OracleToggle,
  IconButton,
  SealButton,
  UploadZone,
  ImagePreview,
  HexagramDisplay,
  EmptyState,
  OracleLoading,
  StatsDisplay,
  Toast,
} from './ui/OracleUI';

/* ═══════════════════════════════════════════════════════════════════════════
   ASCII Generator - Convert images to I-Ching Hexagram art
   ═══════════════════════════════════════════════════════════════════════════ */

interface GeneratorSettings {
  resolutionWidth: number;
  contrast: number;
  brightness: number;
  invert: boolean;
  letterSpacing: number;
  lineHeight: number;
  verticalScale: number;
}

export const AsciiGenerator: React.FC = () => {
  // Mode state
  const [mode, setMode] = useState<'generator' | 'badapple'>('generator');

  // Image state
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Generation state
  const [asciiArt, setAsciiArt] = useState<string>('');
  const [sortedHexagrams, setSortedHexagrams] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Settings
  const [settings, setSettings] = useState<GeneratorSettings>({
    resolutionWidth: 100,
    contrast: 1.2,
    brightness: 0,
    invert: false,
    letterSpacing: 0,
    lineHeight: 1.0,
    verticalScale: 0.55,
  });

  const outputRef = useRef<HTMLPreElement>(null);

  // Initialize hexagrams sorted by density
  useEffect(() => {
    const initHexagrams = async () => {
      const allHexs = getAllHexagrams();
      const sorted = await calculateCharacterDensities(allHexs);
      setSortedHexagrams(sorted);
      setIsInitializing(false);
    };
    initHexagrams();
  }, []);

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageSrc(event.target.result);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  // Main generation logic
  const generateAscii = useCallback(() => {
    if (!imageSrc || sortedHexagrams.length === 0) return;

    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      const width = settings.resolutionWidth;
      const aspectRatio = img.height / img.width;
      const height = Math.max(1, Math.floor(width * aspectRatio * settings.verticalScale));

      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const { data } = imageData;

      let asciiString = '';

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 4;
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];

          // Grayscale
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // Contrast & Brightness
          const normalized = gray / 255 - 0.5;
          const contrasted = normalized * settings.contrast + 0.5 + settings.brightness / 255;
          gray = Math.max(0, Math.min(1, contrasted)) * 255;

          // Mapping
          const maxIndex = sortedHexagrams.length - 1;
          let index = settings.invert
            ? Math.floor((gray / 255) * maxIndex)
            : Math.floor((1 - gray / 255) * maxIndex);

          index = Math.max(0, Math.min(maxIndex, index));
          asciiString += sortedHexagrams[index];
        }
        asciiString += '\n';
      }

      setAsciiArt(asciiString);
      setIsProcessing(false);
    };
  }, [imageSrc, sortedHexagrams, settings]);

  // Re-generate on dependency change
  useEffect(() => {
    const timer = setTimeout(() => {
      generateAscii();
    }, 100);
    return () => clearTimeout(timer);
  }, [generateAscii]);

  // Show toast helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!asciiArt) return;
    await navigator.clipboard.writeText(asciiArt);
    showToast('Copied to clipboard');
  };

  // Download as text file
  const downloadText = () => {
    if (!asciiArt) return;
    const blob = new Blob([asciiArt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'yijing-oracle.txt';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded yijing-oracle.txt');
  };

  // Reset to defaults
  const resetSettings = () => {
    setSettings({
      resolutionWidth: 100,
      contrast: 1.2,
      brightness: 0,
      invert: false,
      letterSpacing: 0,
      lineHeight: 1.0,
      verticalScale: 0.55,
    });
    showToast('Settings restored');
  };

  // Show Bad Apple player
  if (mode === 'badapple') {
    return <BadApplePlayer onBack={() => setMode('generator')} />;
  }

  // Loading state
  if (isInitializing) {
    return (
      <div style={{ padding: 'var(--space-3xl)' }}>
        <OracleLoading message="Preparing the oracle..." symbol="☯" />
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: 'var(--space-xl)',
          alignItems: 'start',
        }}
      >
        {/* ─────────────────────────────────────────────────────────────────────
            Left Panel - Controls
            ───────────────────────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'sticky',
            top: 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-lg)',
          }}
        >
          {/* Bad Apple Button */}
          <SealButton
            onClick={() => setMode('badapple')}
            icon={<Play size={18} />}
            fullWidth
            variant="cinnabar"
          >
            Bad Apple!!
          </SealButton>

          {/* Upload Panel */}
          <OraclePanel withCorners>
            <SectionHeader trigram="☰">Source Image</SectionHeader>

            {imageSrc ? (
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <ImagePreview src={imageSrc} alt="Source" />
                <button
                  onClick={() => {
                    setFile(null);
                    setImageSrc(null);
                    setAsciiArt('');
                  }}
                  style={{
                    width: '100%',
                    marginTop: 'var(--space-sm)',
                    padding: 'var(--space-sm)',
                    background: 'transparent',
                    border: '1px solid var(--ink-light)',
                    borderRadius: '4px',
                    color: 'var(--paper-shadow)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'var(--font-body)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--cinnabar)';
                    e.currentTarget.style.color = 'var(--cinnabar)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ink-light)';
                    e.currentTarget.style.color = 'var(--paper-shadow)';
                  }}
                >
                  Clear Image
                </button>
              </div>
            ) : (
              <UploadZone onFileSelect={handleFileSelect} icon="䷀" />
            )}
          </OraclePanel>

          {/* Parameters Panel */}
          <OraclePanel>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-md)',
              }}
            >
              <SectionHeader trigram="☲">Parameters</SectionHeader>
              <IconButton
                icon={<RotateCcw size={14} />}
                onClick={resetSettings}
                size="sm"
                title="Reset to defaults"
              />
            </div>

            <OracleSlider
              label="Resolution"
              value={settings.resolutionWidth}
              onChange={(v) => setSettings({ ...settings, resolutionWidth: Math.round(v) })}
              min={20}
              max={200}
              step={1}
              displayValue={`${settings.resolutionWidth} chars`}
            />

            <OracleSlider
              label="Contrast"
              value={settings.contrast}
              onChange={(v) => setSettings({ ...settings, contrast: v })}
              min={0.5}
              max={3}
              step={0.1}
              displayValue={settings.contrast.toFixed(1)}
            />

            <OracleSlider
              label="Brightness"
              value={settings.brightness}
              onChange={(v) => setSettings({ ...settings, brightness: v })}
              min={-100}
              max={100}
              step={1}
              displayValue={settings.brightness.toString()}
            />

            <OracleToggle
              label="Invert Mapping"
              value={settings.invert}
              onChange={(v) => setSettings({ ...settings, invert: v })}
            />

            <OracleDivider symbol="☯" />

            <SectionHeader trigram="☵">Geometry</SectionHeader>

            <OracleSlider
              label="Vertical Sampling"
              value={settings.verticalScale}
              onChange={(v) => setSettings({ ...settings, verticalScale: v })}
              min={0.2}
              max={1.5}
              step={0.05}
              displayValue={`${settings.verticalScale.toFixed(2)}x`}
              hint="Adjust to correct aspect ratio distortions"
            />

            <OracleSlider
              label="Line Height"
              value={settings.lineHeight}
              onChange={(v) => setSettings({ ...settings, lineHeight: v })}
              min={0.5}
              max={2}
              step={0.05}
              displayValue={settings.lineHeight.toFixed(2)}
            />

            <OracleSlider
              label="Letter Spacing"
              value={settings.letterSpacing}
              onChange={(v) => setSettings({ ...settings, letterSpacing: v })}
              min={-0.2}
              max={0.5}
              step={0.01}
              displayValue={`${settings.letterSpacing.toFixed(2)}em`}
            />
          </OraclePanel>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            Right Panel - Output
            ───────────────────────────────────────────────────────────────────── */}
        <OraclePanel>
          {/* Header with actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-md)',
            }}
          >
            <SectionHeader trigram="☷">Oracle Reading</SectionHeader>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <IconButton
                icon={<Copy size={18} />}
                onClick={copyToClipboard}
                title="Copy to clipboard"
                disabled={!asciiArt}
              />
              <IconButton
                icon={<Download size={18} />}
                onClick={downloadText}
                title="Download as .txt"
                disabled={!asciiArt}
              />
            </div>
          </div>

          {/* Hexagram output display */}
          <HexagramDisplay>
            {isProcessing && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(10, 10, 10, 0.8)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <OracleLoading message="Divining..." symbol="☯" />
              </div>
            )}

            {asciiArt ? (
              <pre
                ref={outputRef}
                style={{
                  fontFamily: 'var(--font-hexagram)',
                  fontSize: '8px',
                  color: 'var(--paper-aged)',
                  whiteSpace: 'pre',
                  letterSpacing: `${settings.letterSpacing}em`,
                  lineHeight: settings.lineHeight,
                  margin: 0,
                }}
              >
                {asciiArt}
              </pre>
            ) : (
              <EmptyState
                symbol="䷀"
                message="Upload an image to receive your reading"
              />
            )}
          </HexagramDisplay>

          {/* Stats */}
          {asciiArt && (
            <StatsDisplay
              stats={[
                { label: 'Characters', value: asciiArt.length },
                { label: 'Grid', value: `${settings.resolutionWidth} × ${asciiArt.split('\n').length - 1}` },
                { label: 'Hexagrams', value: 64 },
              ]}
            />
          )}
        </OraclePanel>
      </div>

      {/* Toast notification */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          [style*="grid-template-columns: 340px 1fr"] {
            grid-template-columns: 1fr !important;
          }
          [style*="position: sticky"] {
            position: relative !important;
            top: 0 !important;
          }
        }
      `}</style>
    </>
  );
};
