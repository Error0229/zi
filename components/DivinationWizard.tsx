import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDivination } from '../hooks/useDivination';
import { useHistory } from '../hooks/useHistory';
import { MethodSelector } from './MethodSelector';
import { ResultView } from './ResultView';
import { HistoryList } from './HistoryList';
import {
  generateBinaryAscii,
  generateChaosFrame,
  generateConvergenceFrame,
  generateHexagramAscii,
  generateImageAscii,
  generateMorphFrame,
  getSortedHexagrams,
} from '../utils/binaryAscii';
import {
  OraclePanel,
  SectionHeader,
  OracleDivider,
  OracleSlider,
  OracleToggle,
  SealButton,
  Toast,
  UploadZone,
} from './ui/OracleUI';
import { ChevronDown, ChevronUp, Save, History, Settings, RotateCcw, Sparkles } from 'lucide-react';
import type { DivinationMethod } from '../types/divination';

/* ═══════════════════════════════════════════════════════════════════════════
   Divination Wizard - 易象占卜流程 (Redesigned)
   RWD Layout: Desktop side-by-side, Mobile stacked
   ASCII as focal point with parameter controls
   ═══════════════════════════════════════════════════════════════════════════ */

type WizardStep = 'setup' | 'divining' | 'result' | 'history';
type AnimationPhase = 'static' | 'chaos' | 'converge' | 'done';

// Default ASCII parameters
const DEFAULT_PARAMS = {
  resolution: 100,
  contrast: 2.0,
  brightness: 0,
  invert: false,
  verticalSampling: 1.0,
  lineHeight: 1.0,
  letterSpacing: 0,
};

// Animation timing (ms)
const STATIC_DURATION = 2000;
const CHAOS_DURATION = 3000;
const CONVERGE_DURATION = 2000;

export const DivinationWizard: React.FC = () => {
  // Step management
  const [step, setStep] = useState<WizardStep>('setup');

  // Image state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [imageData, setImageData] = useState<ImageData | null>(null);

  // ASCII Parameters
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [showControls, setShowControls] = useState(true);

  // Method selection
  const [method, setMethod] = useState<DivinationMethod>('image');

  // Animation state
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('static');
  const [animationFrame, setAnimationFrame] = useState('');
  const [animationProgress, setAnimationProgress] = useState(0);
  const [previewAscii, setPreviewAscii] = useState('');
  const [sortedHexagrams, setSortedHexagrams] = useState<string[]>([]);

  // ASCII art for result
  const [hexagramAscii, setHexagramAscii] = useState('');
  const [binaryAscii, setBinaryAscii] = useState('');

  // History
  const { saveResult } = useHistory();
  const [isSaved, setIsSaved] = useState(false);

  // Divination hook
  const { result, interpretation, error, divine, reset } = useDivination();

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const resultRef = useRef(result);
  const previewAsciiRef = useRef('');

  // Keep resultRef in sync
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  // Preload sorted hexagrams
  useEffect(() => {
    getSortedHexagrams().then(setSortedHexagrams);
  }, []);

  // Generate preview ASCII when image or params change
  useEffect(() => {
    if (!imageData || sortedHexagrams.length === 0) {
      setPreviewAscii('');
      return;
    }

    const ascii = generateImageAscii(
      imageData,
      sortedHexagrams,
      params.resolution,
      params.contrast,
      params.invert,
      params.brightness,
      params.verticalSampling
    );
    setPreviewAscii(ascii);
    previewAsciiRef.current = ascii;
  }, [imageData, sortedHexagrams, params]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const src = event.target.result;
        setImageSrc(src);

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, img.width, img.height);
            setImageData(data);
          }
        };
        img.src = src;
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Animation effect
  useEffect(() => {
    if (step !== 'divining' || !imageData || sortedHexagrams.length === 0) return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
      setAnimationFrame(previewAsciiRef.current);
      divine(imageData, method);
    }

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentResult = resultRef.current;
      const currentPreviewAscii = previewAsciiRef.current;

      // Calculate ASCII dimensions from preview
      const lines = currentPreviewAscii.split('\n');
      const width = lines[0]?.length || params.resolution;
      const height = lines.length;

      // Phase 1: Static - Show original image as ASCII
      if (elapsed < STATIC_DURATION) {
        setAnimationPhase('static');
        setAnimationProgress(elapsed / STATIC_DURATION);
        setAnimationFrame(currentPreviewAscii);
      }
      // Phase 2: Chaos - Random hexagram transformation
      else if (elapsed < STATIC_DURATION + CHAOS_DURATION) {
        setAnimationPhase('chaos');
        const chaosProgress = (elapsed - STATIC_DURATION) / CHAOS_DURATION;
        setAnimationProgress(chaosProgress);

        // Blend between preview and chaos
        if (chaosProgress < 0.3) {
          // Transition into chaos
          setAnimationFrame(generateConvergenceFrame(currentPreviewAscii, 1 - chaosProgress * 3, true));
        } else if (chaosProgress > 0.7 && currentResult) {
          // Transition out of chaos
          const binAscii = generateBinaryAscii(
            imageData,
            currentResult.primaryHexagram.symbol,
            width,
            128 + params.brightness
          );
          setAnimationFrame(generateConvergenceFrame(binAscii, (chaosProgress - 0.7) * 3, false));
        } else {
          setAnimationFrame(generateChaosFrame(width, height));
        }
      }
      // Phase 3: Convergence to final hexagram
      else if (elapsed < STATIC_DURATION + CHAOS_DURATION + CONVERGE_DURATION && currentResult) {
        setAnimationPhase('converge');
        const convergeProgress = (elapsed - STATIC_DURATION - CHAOS_DURATION) / CONVERGE_DURATION;
        setAnimationProgress(convergeProgress);

        const lines = currentPreviewAscii.split('\n');
        const width = lines[0]?.length || params.resolution;

        const binAscii = generateBinaryAscii(
          imageData,
          currentResult.primaryHexagram.symbol,
          width,
          128 + params.brightness
        );
        setBinaryAscii(binAscii);

        const hexAscii = generateHexagramAscii(currentResult.primaryHexagram.symbol, width);
        setHexagramAscii(hexAscii);

        setAnimationFrame(generateMorphFrame(binAscii, hexAscii, convergeProgress));
      }
      // Done
      else if (elapsed >= STATIC_DURATION + CHAOS_DURATION + CONVERGE_DURATION && currentResult) {
        setAnimationPhase('done');
        startTimeRef.current = 0;
        setStep('result');
        return;
      }
      // Waiting for result
      else if (!currentResult) {
        const lines = currentPreviewAscii.split('\n');
        setAnimationFrame(generateChaosFrame(lines[0]?.length || params.resolution, lines.length));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [step, imageData, method, divine, sortedHexagrams, params]);

  // Start divination
  const handleDivine = useCallback(() => {
    if (!imageData) {
      showToast('請先上傳圖片');
      return;
    }

    if (sortedHexagrams.length === 0) {
      showToast('載入中，請稍候...');
      return;
    }

    setAnimationPhase('static');
    setAnimationProgress(0);
    setBinaryAscii('');
    setHexagramAscii('');
    setIsSaved(false);
    startTimeRef.current = 0;
    setStep('divining');
  }, [imageData, sortedHexagrams]);

  // Save to history
  const handleSave = useCallback(async () => {
    if (!result || !imageSrc || isSaved) return;

    try {
      await saveResult(result, imageSrc, imageName, binaryAscii, hexagramAscii);
      setIsSaved(true);
      showToast('已存入歷史紀錄');
    } catch {
      showToast('儲存失敗');
    }
  }, [result, imageSrc, imageName, binaryAscii, hexagramAscii, saveResult, isSaved]);

  // Reset everything
  const handleReset = useCallback(() => {
    setImageSrc(null);
    setImageData(null);
    setImageName('');
    setPreviewAscii('');
    setBinaryAscii('');
    setHexagramAscii('');
    setAnimationPhase('static');
    setAnimationProgress(0);
    startTimeRef.current = 0;
    previewAsciiRef.current = '';
    setStep('setup');
    setIsSaved(false);
    reset();
  }, [reset]);

  // Reset params to default
  const handleResetParams = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  // History view
  if (step === 'history') {
    return (
      <div className="divination-history-view">
        <button onClick={() => setStep('setup')} className="back-button">
          ← 返回占卜
        </button>
        <HistoryList />
        <style>{historyStyles}</style>
      </div>
    );
  }

  // Method labels
  const methodLabels: Record<DivinationMethod, string> = {
    image: '象數法',
    coins: '加權銅錢',
    yarrow: '大衍之數',
  };

  // Phase labels and colors
  const phaseInfo: Record<AnimationPhase, { label: string; color: string }> = {
    static: { label: '靜觀', color: 'var(--paper-cream)' },
    chaos: { label: '混沌', color: 'var(--cinnabar)' },
    converge: { label: '凝聚', color: 'var(--gold)' },
    done: { label: '完成', color: 'var(--jade)' },
  };

  // Compute display ASCII based on step
  const displayAscii = step === 'divining' ? animationFrame : (step === 'result' ? hexagramAscii : previewAscii);
  const displayColor = step === 'divining' ? phaseInfo[animationPhase].color : 'var(--gold)';

  return (
    <div className="divination-container">
      {/* Main ASCII Display - The Focal Point */}
      <div className="ascii-viewport">
        <div className="ascii-frame">
          {/* Corner decorations */}
          <div className="corner-deco top-left">☰</div>
          <div className="corner-deco top-right">☱</div>
          <div className="corner-deco bottom-left">☶</div>
          <div className="corner-deco bottom-right">☷</div>

          {/* ASCII Content */}
          <div className="ascii-content">
            {!imageSrc ? (
              <div className="ascii-placeholder">
                <UploadZone
                  onFileSelect={handleFileSelect}
                  accept="image/*"
                  icon={<span className="upload-icon">䷀</span>}
                />
              </div>
            ) : displayAscii ? (
              <pre
                className={`ascii-art ${step === 'divining' ? 'animating' : ''}`}
                style={{
                  color: displayColor,
                  lineHeight: params.lineHeight,
                  letterSpacing: `${params.letterSpacing}em`,
                }}
              >
                {displayAscii}
              </pre>
            ) : (
              <div className="ascii-loading">
                <span className="loading-symbol">☯</span>
                <span>生成中...</span>
              </div>
            )}
          </div>

          {/* Animation overlay */}
          {step === 'divining' && (
            <div className="animation-overlay">
              <div className="phase-indicator">
                <span className="phase-label" style={{ color: phaseInfo[animationPhase].color }}>
                  {phaseInfo[animationPhase].label}
                </span>
                <div className="phase-progress">
                  <div
                    className="phase-progress-bar"
                    style={{
                      width: `${animationProgress * 100}%`,
                      background: phaseInfo[animationPhase].color,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Result overlay */}
          {step === 'result' && result && (
            <div className="result-badge">
              <span className="result-hexagram">{result.primaryHexagram.symbol}</span>
              <span className="result-name">{result.primaryHexagram.name.chinese}</span>
            </div>
          )}
        </div>

        {/* Quick actions under ASCII */}
        <div className="ascii-actions">
          {imageSrc && step === 'setup' && (
            <>
              <SealButton onClick={handleDivine} variant="gold" icon={<Sparkles size={16} />}>
                起卦
              </SealButton>
              <button onClick={handleReset} className="text-button">
                清除圖片
              </button>
            </>
          )}
          {step === 'result' && (
            <>
              <SealButton
                onClick={handleSave}
                variant={isSaved ? 'jade' : 'gold'}
                icon={<Save size={16} />}
              >
                {isSaved ? '已儲存' : '存入歷史'}
              </SealButton>
              <SealButton onClick={handleReset} variant="cinnabar">
                重新占卜
              </SealButton>
            </>
          )}
        </div>
      </div>

      {/* Controls Panel */}
      <div className={`controls-panel ${showControls ? 'expanded' : 'collapsed'}`}>
        {/* Mobile toggle */}
        <button
          className="controls-toggle"
          onClick={() => setShowControls(!showControls)}
        >
          <Settings size={18} />
          <span>參數設定</span>
          {showControls ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        <div className="controls-content">
          {/* Parameters Section */}
          <OraclePanel>
            <div className="section-header-row">
              <SectionHeader trigram="☰">Parameters</SectionHeader>
              <button onClick={handleResetParams} className="reset-params-btn" title="重置參數">
                <RotateCcw size={14} />
              </button>
            </div>

            <OracleSlider
              label="Resolution"
              value={params.resolution}
              onChange={(v) => setParams((p) => ({ ...p, resolution: v }))}
              min={40}
              max={200}
              step={10}
              displayValue={`${params.resolution} chars`}
            />

            <OracleSlider
              label="Contrast"
              value={params.contrast}
              onChange={(v) => setParams((p) => ({ ...p, contrast: v }))}
              min={0.5}
              max={3}
              step={0.1}
              displayValue={params.contrast.toFixed(1)}
            />

            <OracleSlider
              label="Brightness"
              value={params.brightness}
              onChange={(v) => setParams((p) => ({ ...p, brightness: v }))}
              min={-50}
              max={50}
              step={5}
              displayValue={params.brightness.toString()}
            />

            <OracleToggle
              label="Invert Mapping"
              value={params.invert}
              onChange={(v) => setParams((p) => ({ ...p, invert: v }))}
            />
          </OraclePanel>

          <OracleDivider symbol="☯" />

          {/* Geometry Section */}
          <OraclePanel>
            <SectionHeader trigram="☲">Geometry</SectionHeader>

            <OracleSlider
              label="Vertical Sampling"
              value={params.verticalSampling}
              onChange={(v) => setParams((p) => ({ ...p, verticalSampling: v }))}
              min={0.3}
              max={2}
              step={0.05}
              displayValue={`${params.verticalSampling.toFixed(2)}x`}
              hint="Adjust to correct aspect ratio distortions"
            />

            <OracleSlider
              label="Line Height"
              value={params.lineHeight}
              onChange={(v) => setParams((p) => ({ ...p, lineHeight: v }))}
              min={0.8}
              max={1.5}
              step={0.05}
              displayValue={params.lineHeight.toFixed(2)}
            />

            <OracleSlider
              label="Letter Spacing"
              value={params.letterSpacing}
              onChange={(v) => setParams((p) => ({ ...p, letterSpacing: v }))}
              min={-0.1}
              max={0.2}
              step={0.01}
              displayValue={`${params.letterSpacing.toFixed(2)}em`}
            />
          </OraclePanel>

          <OracleDivider symbol="䷀" />

          {/* Method Selection */}
          <OraclePanel>
            <SectionHeader trigram="☳">占卜方式</SectionHeader>
            <MethodSelector value={method} onChange={setMethod} />
          </OraclePanel>

          {/* History Button */}
          <button onClick={() => setStep('history')} className="history-button">
            <History size={16} />
            歷史紀錄
          </button>

          {/* Result Details (when available) */}
          {step === 'result' && result && interpretation && (
            <>
              <OracleDivider symbol="☯" />
              <OraclePanel withCorners>
                <ResultView result={result} interpretation={interpretation} />
              </OraclePanel>
            </>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="error-toast">
          {error}
        </div>
      )}

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <style>{wizardStyles}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════════════════════ */

const wizardStyles = `
  .divination-container {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: var(--space-xl);
    min-height: calc(100vh - 300px);
    align-items: start;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     ASCII Viewport - The Focal Point
     ───────────────────────────────────────────────────────────────────────── */
  .ascii-viewport {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    position: sticky;
    top: var(--space-xl);
  }

  .ascii-frame {
    position: relative;
    background: linear-gradient(145deg, rgba(13, 13, 13, 0.98) 0%, rgba(10, 10, 10, 1) 100%);
    border: 2px solid var(--ink-light);
    border-radius: 8px;
    padding: var(--space-xl);
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .ascii-frame::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid var(--gold);
    border-radius: 6px;
    margin: 8px;
    opacity: 0.3;
    pointer-events: none;
  }

  .ascii-frame::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(201, 162, 39, 0.03) 100%);
    pointer-events: none;
  }

  /* Corner decorations */
  .corner-deco {
    position: absolute;
    font-size: 20px;
    color: var(--gold);
    opacity: 0.4;
    font-family: var(--font-hexagram);
    z-index: 5;
  }

  .corner-deco.top-left { top: var(--space-md); left: var(--space-md); }
  .corner-deco.top-right { top: var(--space-md); right: var(--space-md); }
  .corner-deco.bottom-left { bottom: var(--space-md); left: var(--space-md); }
  .corner-deco.bottom-right { bottom: var(--space-md); right: var(--space-md); }

  /* ASCII Content */
  .ascii-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    position: relative;
    z-index: 2;
  }

  .ascii-placeholder {
    width: 100%;
    max-width: 500px;
  }

  .upload-icon {
    font-size: 64px;
    display: block;
    animation: breath 4s ease-in-out infinite;
  }

  .ascii-art {
    font-family: var(--font-hexagram);
    font-size: clamp(6px, 1vw, 10px);
    white-space: pre;
    margin: 0;
    text-align: center;
    transition: color 0.5s ease;
    text-shadow: 0 0 10px currentColor;
  }

  .ascii-art.animating {
    animation: ascii-glow 2s ease-in-out infinite;
  }

  @keyframes ascii-glow {
    0%, 100% { filter: drop-shadow(0 0 5px currentColor); }
    50% { filter: drop-shadow(0 0 20px currentColor); }
  }

  .ascii-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    color: var(--ink-wash);
  }

  .loading-symbol {
    font-size: 48px;
    color: var(--gold);
    animation: oracle-spin 3s linear infinite;
  }

  /* Animation overlay */
  .animation-overlay {
    position: absolute;
    bottom: var(--space-xl);
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }

  .phase-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
  }

  .phase-label {
    font-family: var(--font-display);
    font-size: 18px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .phase-progress {
    width: 200px;
    height: 4px;
    background: var(--ink-medium);
    border-radius: 2px;
    overflow: hidden;
  }

  .phase-progress-bar {
    height: 100%;
    transition: width 0.1s linear;
    box-shadow: 0 0 10px currentColor;
  }

  /* Result badge */
  .result-badge {
    position: absolute;
    top: var(--space-xl);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-lg);
    background: rgba(10, 10, 10, 0.9);
    border: 1px solid var(--gold);
    border-radius: 4px;
    z-index: 10;
  }

  .result-hexagram {
    font-size: 32px;
    color: var(--gold);
    font-family: var(--font-hexagram);
  }

  .result-name {
    font-family: var(--font-display);
    font-size: 18px;
    color: var(--paper-cream);
    letter-spacing: 0.1em;
  }

  /* ASCII Actions */
  .ascii-actions {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
    flex-wrap: wrap;
  }

  .text-button {
    background: transparent;
    border: none;
    color: var(--ink-wash);
    font-family: var(--font-body);
    font-size: 13px;
    cursor: pointer;
    padding: var(--space-sm) var(--space-md);
    transition: color var(--transition-fast);
  }

  .text-button:hover {
    color: var(--paper-cream);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Controls Panel
     ───────────────────────────────────────────────────────────────────────── */
  .controls-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    padding-right: var(--space-sm);
  }

  .controls-toggle {
    display: none;
  }

  .controls-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .section-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .reset-params-btn {
    background: transparent;
    border: 1px solid var(--ink-light);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink-wash);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .reset-params-btn:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  .history-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    padding: var(--space-md);
    background: transparent;
    border: 1px solid var(--ink-light);
    border-radius: 4px;
    color: var(--paper-shadow);
    cursor: pointer;
    font-size: 14px;
    font-family: var(--font-body);
    transition: all var(--transition-fast);
  }

  .history-button:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  /* Error toast */
  .error-toast {
    position: fixed;
    bottom: var(--space-xl);
    left: 50%;
    transform: translateX(-50%);
    padding: var(--space-md) var(--space-xl);
    background: var(--ink-dark);
    border: 1px solid var(--cinnabar);
    border-radius: 4px;
    color: var(--cinnabar);
    font-size: 14px;
    z-index: 1000;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Responsive - Mobile
     ───────────────────────────────────────────────────────────────────────── */
  @media (max-width: 1024px) {
    .divination-container {
      grid-template-columns: 1fr;
      gap: var(--space-lg);
    }

    .ascii-viewport {
      position: static;
    }

    .ascii-frame {
      min-height: 400px;
    }

    .controls-panel {
      max-height: none;
      overflow: visible;
      background: var(--ink-dark);
      border: 1px solid var(--ink-light);
      border-radius: 8px;
    }

    .controls-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: var(--space-md) var(--space-lg);
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--ink-light);
      color: var(--gold);
      font-family: var(--font-display);
      font-size: 14px;
      cursor: pointer;
      gap: var(--space-sm);
    }

    .controls-panel.collapsed .controls-content {
      display: none;
    }

    .controls-panel.expanded .controls-content {
      padding: var(--space-md);
    }
  }

  @media (max-width: 640px) {
    .ascii-frame {
      min-height: 300px;
      padding: var(--space-md);
    }

    .ascii-art {
      font-size: 5px;
    }

    .corner-deco {
      font-size: 14px;
    }

    .phase-progress {
      width: 150px;
    }

    .result-badge {
      flex-direction: column;
      gap: var(--space-xs);
    }
  }
`;

const historyStyles = `
  .divination-history-view {
    max-width: 600px;
    margin: 0 auto;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    margin-bottom: var(--space-md);
    padding: var(--space-sm) var(--space-md);
    background: transparent;
    border: 1px solid var(--ink-light);
    border-radius: 4px;
    color: var(--paper-shadow);
    cursor: pointer;
    font-size: 13px;
    transition: all var(--transition-fast);
  }

  .back-button:hover {
    border-color: var(--gold);
    color: var(--gold);
  }
`;
