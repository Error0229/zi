import React, { useState, useCallback, useRef } from 'react';
import { useDivination } from '../hooks/useDivination';
import { MethodSelector } from './MethodSelector';
import { ResultView } from './ResultView';
import {
  OraclePanel,
  SectionHeader,
  OracleDivider,
  SealButton,
  UploadZone,
  ImagePreview,
  OracleLoading,
  EmptyState,
  Toast,
} from './ui/OracleUI';
import type { DivinationMethod } from '../types/divination';

/* ═══════════════════════════════════════════════════════════════════════════
   Divination Wizard - 易象占卜流程
   ═══════════════════════════════════════════════════════════════════════════ */

type WizardStep = 'upload' | 'divining' | 'result';

export const DivinationWizard: React.FC = () => {
  // Step management
  const [step, setStep] = useState<WizardStep>('upload');

  // Image state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);

  // Method selection
  const [method, setMethod] = useState<DivinationMethod>('image');

  // Divination hook
  const { result, interpretation, isProcessing, error, divine, reset } = useDivination();

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const src = event.target.result;
        setImageSrc(src);

        // Load image to extract ImageData
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

  // Start divination
  const handleDivine = useCallback(() => {
    if (!imageData) {
      showToast('請先上傳圖片');
      return;
    }

    setStep('divining');

    // Small delay for animation effect
    setTimeout(() => {
      divine(imageData, method);
      setStep('result');
    }, 1500);
  }, [imageData, method, divine]);

  // Reset everything
  const handleReset = useCallback(() => {
    setImageSrc(null);
    setImageData(null);
    setStep('upload');
    reset();
  }, [reset]);

  // Divining animation state
  if (step === 'divining') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 'var(--space-3xl)',
        }}
      >
        <OracleLoading message="起卦中..." symbol="☯" />
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
          <OraclePanel withCorners>
            <ResultView result={result} interpretation={interpretation} />
          </OraclePanel>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-md)',
              justifyContent: 'center',
            }}
          >
            <SealButton onClick={handleReset} variant="gold">
              重新占卜
            </SealButton>
          </div>
        </div>

        <Toast
          message={toastMessage}
          visible={toastVisible}
          onClose={() => setToastVisible(false)}
        />

        {/* Responsive styles */}
        <style>{`
          @media (max-width: 768px) {
            [style*="max-width: 800px"] {
              padding: 0 var(--space-md) !important;
            }
          }
        `}</style>
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
                  transition: 'all var(--transition-fast)',
                }}
              >
                清除圖片
              </button>
            </div>
          ) : (
            <UploadZone
              onFileSelect={handleFileSelect}
              icon="䷀"
              accept="image/*"
            />
          )}
        </OraclePanel>

        {/* Method Selection */}
        <OraclePanel>
          <SectionHeader trigram="☲">占卜方式</SectionHeader>
          <MethodSelector
            value={method}
            onChange={setMethod}
            disabled={isProcessing}
          />
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

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

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
