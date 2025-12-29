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
} from '../utils/binaryAscii';
import {
  OraclePanel,
  SectionHeader,
  OracleDivider,
  SealButton,
  ImagePreview,
  Toast,
} from './ui/OracleUI';
import { ChevronDown, ChevronUp, Save, History } from 'lucide-react';
import type { DivinationMethod } from '../types/divination';

/* ═══════════════════════════════════════════════════════════════════════════
   Divination Wizard - 易象占卜流程
   With animation: 圖片 → 混沌 → 二元卦象
   ═══════════════════════════════════════════════════════════════════════════ */

type WizardStep = 'upload' | 'divining' | 'result' | 'history';
type AnimationPhase = 'chaos' | 'converge' | 'reveal' | 'done';

const ASCII_WIDTH = 50;
const ASCII_HEIGHT = 25;

export const DivinationWizard: React.FC = () => {
  // Step management
  const [step, setStep] = useState<WizardStep>('upload');

  // Image state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [imageData, setImageData] = useState<ImageData | null>(null);

  // Method selection
  const [method, setMethod] = useState<DivinationMethod>('image');

  // Animation state
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('chaos');
  const [animationFrame, setAnimationFrame] = useState('');
  const [animationProgress, setAnimationProgress] = useState(0);

  // ASCII art for result
  const [hexagramAscii, setHexagramAscii] = useState('');
  const [showAscii, setShowAscii] = useState(true);

  // History
  const { saveResult } = useHistory();
  const [isSaved, setIsSaved] = useState(false);

  // Divination hook
  const { result, interpretation, error, divine, reset } = useDivination();

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const animationRef = useRef<number | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // Handle file selection with camera support
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
    if (step !== 'divining') return;

    let startTime = Date.now();
    const chaosDuration = 2000;
    const convergeDuration = 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < chaosDuration) {
        // Chaos phase
        setAnimationPhase('chaos');
        setAnimationFrame(generateChaosFrame(ASCII_WIDTH, ASCII_HEIGHT));
        setAnimationProgress(elapsed / chaosDuration);
      } else if (elapsed < chaosDuration + convergeDuration) {
        // Convergence phase
        if (animationPhase !== 'converge' && result) {
          setAnimationPhase('converge');
          // Generate final ASCII
          const finalAscii = generateHexagramAscii(result.primaryHexagram.symbol, ASCII_WIDTH);
          setHexagramAscii(finalAscii);
        }
        if (result) {
          const convergeProgress = (elapsed - chaosDuration) / convergeDuration;
          setAnimationProgress(convergeProgress);
          const finalAscii = generateHexagramAscii(result.primaryHexagram.symbol, ASCII_WIDTH);
          setAnimationFrame(generateConvergenceFrame(finalAscii, convergeProgress, false));
        }
      } else {
        // Reveal phase - done
        setAnimationPhase('done');
        setStep('result');
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start divination immediately
    if (imageData) {
      divine(imageData, method);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [step, imageData, method, divine, result, animationPhase]);

  // Generate hexagram ASCII when result is ready
  useEffect(() => {
    if (result && step === 'result' && !hexagramAscii) {
      const ascii = generateHexagramAscii(result.primaryHexagram.symbol, ASCII_WIDTH);
      setHexagramAscii(ascii);
    }
  }, [result, step, hexagramAscii]);

  // Start divination
  const handleDivine = useCallback(() => {
    if (!imageData) {
      showToast('請先上傳圖片');
      return;
    }

    setAnimationPhase('chaos');
    setAnimationProgress(0);
    setIsSaved(false);
    setStep('divining');
  }, [imageData]);

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
    setHexagramAscii('');
    setStep('upload');
    setIsSaved(false);
    reset();
  }, [reset]);

  // History view
  if (step === 'history') {
    return (
      <>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <button
            onClick={() => setStep('upload')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              marginBottom: 'var(--space-md)',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'transparent',
              border: '1px solid var(--ink-light)',
              borderRadius: '4px',
              color: 'var(--paper-shadow)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ← 返回占卜
          </button>
          <HistoryList />
        </div>
      </>
    );
  }

  // Divining animation
  if (step === 'divining') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 'var(--space-xl)',
        }}
      >
        {/* Animation display */}
        <pre
          style={{
            fontFamily: 'var(--font-hexagram)',
            fontSize: '10px',
            lineHeight: 1.2,
            color: animationPhase === 'chaos' ? 'var(--paper-shadow)' : 'var(--gold)',
            textAlign: 'center',
            transition: 'color 0.5s',
            margin: 0,
          }}
        >
          {animationFrame}
        </pre>

        {/* Phase indicator */}
        <div
          style={{
            marginTop: 'var(--space-lg)',
            fontSize: '14px',
            color: 'var(--ink-wash)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {animationPhase === 'chaos' && '混沌...'}
          {animationPhase === 'converge' && '凝聚...'}
        </div>
      </div>
    );
  }

  // Result view
  if (step === 'result' && result && interpretation) {
    return (
      <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 'var(--space-xl)',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          {/* ASCII Art Section (collapsible) */}
          <OraclePanel>
            <button
              onClick={() => setShowAscii(!showAscii)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--paper-cream)',
              }}
            >
              <SectionHeader trigram="䷀">卦象 ASCII</SectionHeader>
              {showAscii ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showAscii && (
              <div
                style={{
                  marginTop: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  background: 'rgba(10, 10, 10, 0.5)',
                  borderRadius: '4px',
                  overflow: 'auto',
                }}
              >
                <pre
                  style={{
                    fontFamily: 'var(--font-hexagram)',
                    fontSize: '8px',
                    lineHeight: 1.1,
                    color: 'var(--gold)',
                    textAlign: 'center',
                    margin: 0,
                  }}
                >
                  {hexagramAscii}
                </pre>
              </div>
            )}
          </OraclePanel>

          {/* Divination Result */}
          <OraclePanel withCorners>
            <ResultView result={result} interpretation={interpretation} />
          </OraclePanel>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-md)',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
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
          </div>
        </div>

        <Toast
          message={toastMessage}
          visible={toastVisible}
          onClose={() => setToastVisible(false)}
        />
      </>
    );
  }

  // Upload view (default)
  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 400px)',
          gap: 'var(--space-xl)',
          justifyContent: 'center',
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        {/* Upload Panel */}
        <OraclePanel withCorners>
          <SectionHeader trigram="☰">上傳圖片</SectionHeader>

          {imageSrc ? (
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <ImagePreview src={imageSrc} alt="待占圖片" />
              <button
                onClick={handleReset}
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
                }}
              >
                清除圖片
              </button>
            </div>
          ) : (
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-2xl) var(--space-lg)',
                border: '2px dashed var(--ink-light)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  color: 'var(--gold)',
                  marginBottom: 'var(--space-md)',
                  opacity: 0.6,
                }}
              >
                ䷀
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: 'var(--paper-cream)',
                  marginBottom: 'var(--space-xs)',
                }}
              >
                <strong>點擊上傳</strong> 或拖放圖片
              </p>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--ink-wash)',
                  marginBottom: 'var(--space-sm)',
                }}
              >
                支援 JPG, PNG, WEBP
              </p>
              {/* Camera button for mobile */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-sm)',
                  marginTop: 'var(--space-sm)',
                }}
              >
                <span
                  style={{
                    padding: 'var(--space-xs) var(--space-sm)',
                    background: 'rgba(201, 169, 98, 0.2)',
                    border: '1px solid var(--gold)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--gold)',
                  }}
                >
                  📷 相機
                </span>
                <span
                  style={{
                    padding: 'var(--space-xs) var(--space-sm)',
                    background: 'rgba(42, 42, 42, 0.5)',
                    border: '1px solid var(--ink-light)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--paper-shadow)',
                  }}
                >
                  🖼️ 相簿
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </OraclePanel>

        {/* Method Selection */}
        <OraclePanel>
          <SectionHeader trigram="☲">占卜方式</SectionHeader>
          <MethodSelector value={method} onChange={setMethod} />
        </OraclePanel>

        {/* Divine Button */}
        <SealButton
          onClick={handleDivine}
          variant="gold"
          fullWidth
          icon={<span style={{ fontSize: '18px' }}>☯</span>}
        >
          起卦
        </SealButton>

        {/* History Button */}
        <button
          onClick={() => setStep('history')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md)',
            background: 'transparent',
            border: '1px solid var(--ink-light)',
            borderRadius: '4px',
            color: 'var(--paper-shadow)',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
          }}
        >
          <History size={16} />
          歷史紀錄
        </button>

        {/* Error display */}
        {error && (
          <div
            style={{
              padding: 'var(--space-md)',
              background: 'rgba(180, 60, 60, 0.2)',
              border: '1px solid rgba(180, 60, 60, 0.5)',
              borderRadius: '4px',
              color: 'var(--cinnabar)',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}
      </div>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          [style*="gridTemplateColumns: minmax(300px, 400px)"] {
            grid-template-columns: 1fr !important;
            padding: 0 var(--space-md) !important;
          }
        }
      `}</style>
    </>
  );
};
