import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDivination } from '../hooks/useDivination';
import { useHistory } from '../hooks/useHistory';
import { MethodSelector } from './MethodSelector';
import { ResultView } from './ResultView';
import { HistoryList } from './HistoryList';
import {
  generateChaosFrame,
  generateConvergenceFrame,
  generateHexagramAscii,
  generateImageAscii,
  getSortedHexagrams,
} from '../utils/binaryAscii';
import {
  OraclePanel,
  SectionHeader,
  OracleDivider,
  SealButton,
  Toast,
} from './ui/OracleUI';
import { Save, History, Sparkles } from 'lucide-react';
import type { DivinationMethod } from '../types/divination';

/* ═══════════════════════════════════════════════════════════════════════════
   Divination Wizard - 易象占卜流程
   RWD Layout with ASCII as focal point (monochrome)
   ═══════════════════════════════════════════════════════════════════════════ */

type WizardStep = 'setup' | 'divining' | 'result' | 'history';
type AnimationPhase = 'static' | 'chaos' | 'converge' | 'done';

// Fixed ASCII parameters (used internally, no UI controls)
const ASCII_PARAMS = {
  resolution: 100,
  contrast: 2.0,
  brightness: 0,
  invert: true,  // true = bright areas show dense chars (correct for dark background)
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

  // Generate preview ASCII when image changes
  useEffect(() => {
    if (!imageData || sortedHexagrams.length === 0) {
      setPreviewAscii('');
      return;
    }

    const ascii = generateImageAscii(
      imageData,
      sortedHexagrams,
      ASCII_PARAMS.resolution,
      ASCII_PARAMS.contrast,
      ASCII_PARAMS.invert,
      ASCII_PARAMS.brightness,
      ASCII_PARAMS.verticalSampling
    );
    setPreviewAscii(ascii);
    previewAsciiRef.current = ascii;
  }, [imageData, sortedHexagrams]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      // Use consistent dimensions from preview ASCII
      const lines = currentPreviewAscii.split('\n').filter(l => l.length > 0);
      const width = lines[0]?.length || ASCII_PARAMS.resolution;
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

        // Dissolve from image to chaos
        if (chaosProgress < 0.3) {
          setAnimationFrame(generateConvergenceFrame(currentPreviewAscii, 1 - chaosProgress * 3, true));
        } else {
          // Pure chaos
          setAnimationFrame(generateChaosFrame(width, height));
        }
      }
      // Phase 3: Convergence - chaos settles into hexagram symbol
      else if (elapsed < STATIC_DURATION + CHAOS_DURATION + CONVERGE_DURATION && currentResult) {
        setAnimationPhase('converge');
        const convergeProgress = (elapsed - STATIC_DURATION - CHAOS_DURATION) / CONVERGE_DURATION;
        setAnimationProgress(convergeProgress);

        // Get line types from result and reverse (result has index 0 = image top, but hexagram line 1 = bottom)
        // We need to reverse so that lineTypes[0] = top line (line 6), displayed at top of screen
        const lineTypes = currentResult.lines.map(l => l.currentType).reverse();
        // Generate hexagram ASCII with EXACT same dimensions as preview
        const hexAscii = generateHexagramAscii(currentResult.primaryHexagram.symbol, lineTypes, width, height);
        setHexagramAscii(hexAscii);

        // Converge from chaos to hexagram (simple random shuffle)
        setAnimationFrame(generateConvergenceFrame(hexAscii, convergeProgress));
      }
      // Done
      else if (elapsed >= STATIC_DURATION + CHAOS_DURATION + CONVERGE_DURATION && currentResult) {
        setAnimationPhase('done');
        const lineTypes = currentResult.lines.map(l => l.currentType).reverse();
        const hexAscii = generateHexagramAscii(currentResult.primaryHexagram.symbol, lineTypes, width, height);
        setHexagramAscii(hexAscii);
        setAnimationFrame(hexAscii);
        startTimeRef.current = 0;
        setStep('result');
        return;
      }
      // Waiting for result - keep showing chaos
      else if (!currentResult) {
        setAnimationFrame(generateChaosFrame(width, height));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [step, imageData, method, divine, sortedHexagrams]);

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
    setHexagramAscii('');
    setIsSaved(false);
    startTimeRef.current = 0;
    setStep('divining');
  }, [imageData, sortedHexagrams]);

  // Save to history
  const handleSave = useCallback(async () => {
    if (!result || !imageSrc || isSaved) return;

    try {
      await saveResult(result, imageSrc, imageName, undefined, hexagramAscii);
      setIsSaved(true);
      showToast('已存入歷史紀錄');
    } catch {
      showToast('儲存失敗');
    }
  }, [result, imageSrc, imageName, hexagramAscii, saveResult, isSaved]);

  // Reset everything
  const handleReset = useCallback(() => {
    setImageSrc(null);
    setImageData(null);
    setImageName('');
    setPreviewAscii('');
    setHexagramAscii('');
    setAnimationPhase('static');
    setAnimationProgress(0);
    startTimeRef.current = 0;
    previewAsciiRef.current = '';
    setStep('setup');
    setIsSaved(false);
    reset();
  }, [reset]);

  // History view
  if (step === 'history') {
    return (
      <div className="divination-history-view">
        <button onClick={() => setStep('setup')} className="back-button">
          ← 返回占卜
        </button>
        <HistoryList />
        <style>{styles}</style>
      </div>
    );
  }

  // Phase labels
  const phaseLabels: Record<AnimationPhase, string> = {
    static: '靜觀',
    chaos: '混沌',
    converge: '凝聚',
    done: '完成',
  };

  // Compute display ASCII
  const displayAscii = step === 'divining' ? animationFrame : (step === 'result' ? hexagramAscii : previewAscii);

  return (
    <div className="divination-container">
      {/* Main ASCII Display */}
      <div className="ascii-viewport">
        <div className="ascii-frame">
          {/* ASCII Content */}
          {!imageSrc ? (
            <label className="upload-area">
              <div className="upload-icon">䷀</div>
              <p className="upload-text">
                <strong>點擊上傳</strong> 或拖放圖片
              </p>
              <p className="upload-hint">支援 JPG, PNG, WEBP, GIF</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          ) : displayAscii ? (
            <pre
              className={`ascii-art ${step === 'divining' ? 'animating' : ''}`}
              style={{
                lineHeight: ASCII_PARAMS.lineHeight,
                letterSpacing: `${ASCII_PARAMS.letterSpacing}em`,
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

          {/* Animation overlay */}
          {step === 'divining' && (
            <div className="animation-overlay">
              <div className="phase-indicator">
                <span className="phase-label">{phaseLabels[animationPhase]}</span>
                <div className="phase-progress">
                  <div
                    className="phase-progress-bar"
                    style={{ width: `${animationProgress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Result badge */}
          {step === 'result' && result && (
            <div className="result-badge">
              <span className="result-hexagram">{result.primaryHexagram.symbol}</span>
              <span className="result-name">{result.primaryHexagram.name.chinese}</span>
            </div>
          )}
        </div>

        {/* Actions under ASCII */}
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

      {/* Controls Panel - Only method selector and history */}
      <div className="controls-panel">
        <OraclePanel>
          <SectionHeader trigram="☳">占卜方式</SectionHeader>
          <MethodSelector value={method} onChange={setMethod} />
        </OraclePanel>

        <button onClick={() => setStep('history')} className="history-button">
          <History size={16} />
          歷史紀錄
        </button>

        {/* Result Details */}
        {step === 'result' && result && interpretation && (
          <>
            <OracleDivider symbol="☯" />
            <OraclePanel withCorners>
              <ResultView result={result} interpretation={interpretation} />
            </OraclePanel>
          </>
        )}
      </div>

      {error && <div className="error-toast">{error}</div>}

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <style>{styles}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════════════════════ */

const styles = `
  .divination-container {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--space-xl);
    min-height: calc(100vh - 300px);
    align-items: start;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     ASCII Viewport
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
    background: #0a0a0a;
    border: 1px solid var(--ink-light);
    border-radius: 4px;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Upload area */
  .upload-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-3xl);
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .upload-area:hover {
    opacity: 0.8;
  }

  .upload-icon {
    font-size: 72px;
    color: var(--paper-cream);
    opacity: 0.3;
    margin-bottom: var(--space-lg);
    font-family: var(--font-hexagram);
  }

  .upload-text {
    font-family: var(--font-body);
    font-size: 16px;
    color: var(--paper-cream);
    margin: 0 0 var(--space-sm) 0;
  }

  .upload-hint {
    font-size: 13px;
    color: var(--ink-wash);
    margin: 0;
  }

  /* ASCII art - MONOCHROME only */
  .ascii-art {
    font-family: var(--font-hexagram);
    font-size: clamp(4px, 0.6vw, 7px);
    white-space: pre;
    margin: 0;
    padding: var(--space-lg);
    text-align: center;
    color: var(--paper-cream);
  }

  .ascii-art.animating {
    animation: ascii-pulse 1.5s ease-in-out infinite;
  }

  @keyframes ascii-pulse {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 1; }
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
    color: var(--paper-cream);
    opacity: 0.5;
    animation: oracle-spin 3s linear infinite;
  }

  /* Animation overlay */
  .animation-overlay {
    position: absolute;
    bottom: var(--space-lg);
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
    font-size: 16px;
    letter-spacing: 0.15em;
    color: var(--paper-cream);
    opacity: 0.8;
  }

  .phase-progress {
    width: 180px;
    height: 3px;
    background: var(--ink-medium);
    border-radius: 2px;
    overflow: hidden;
  }

  .phase-progress-bar {
    height: 100%;
    background: var(--paper-cream);
    transition: width 0.1s linear;
  }

  /* Result badge */
  .result-badge {
    position: absolute;
    top: var(--space-lg);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-lg);
    background: rgba(10, 10, 10, 0.95);
    border: 1px solid var(--ink-light);
    border-radius: 4px;
    z-index: 10;
  }

  .result-hexagram {
    font-size: 28px;
    color: var(--paper-cream);
    font-family: var(--font-hexagram);
  }

  .result-name {
    font-family: var(--font-display);
    font-size: 16px;
    color: var(--paper-cream);
    letter-spacing: 0.1em;
  }

  /* Actions */
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

  /* History view */
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

  /* ─────────────────────────────────────────────────────────────────────────
     Responsive
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
  }

  @media (max-width: 640px) {
    .ascii-frame {
      min-height: 300px;
    }

    .ascii-art {
      font-size: 3px;
      padding: var(--space-md);
    }

    .upload-icon {
      font-size: 56px;
    }

    .upload-text {
      font-size: 14px;
    }

    .phase-progress {
      width: 140px;
    }

    .result-badge {
      flex-direction: column;
      gap: var(--space-xs);
      text-align: center;
    }
  }
`;
