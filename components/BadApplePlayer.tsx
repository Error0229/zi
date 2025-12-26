import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, ArrowLeft, RotateCcw } from 'lucide-react';
import { calculateCharacterDensities, getAllHexagrams } from '../utils/hexagrams';
import {
  OraclePanel,
  SectionHeader,
  OracleDivider,
  OracleSlider,
  OracleToggle,
  OracleSelect,
  IconButton,
  SealButton,
  HexagramDisplay,
  OracleLoading,
  OracleProgress,
  StatsDisplay,
} from './ui/OracleUI';

/* ═══════════════════════════════════════════════════════════════════════════
   Bad Apple!! Player - I-Ching Edition
   Renders the famous music video using hexagram characters
   ═══════════════════════════════════════════════════════════════════════════ */

const TOTAL_FRAMES = 2697;
const FPS = 12.4;
const FRAME_WIDTH = 100;

interface BadAppleSettings {
  invert: boolean;
  smoothing: number;
  kernelSize: number;
  ditherMode: 'none' | 'ordered' | 'floyd';
  letterSpacing: number;
  lineHeight: number;
  fontSize: number;
}

interface BadApplePlayerProps {
  onBack: () => void;
}

export const BadApplePlayer: React.FC<BadApplePlayerProps> = ({ onBack }) => {
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Frame data
  const [parsedFrameData, setParsedFrameData] = useState<number[][]>([]);
  const [frames, setFrames] = useState<string[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [sortedHexagrams, setSortedHexagrams] = useState<string[]>([]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Regeneration state
  const [needsRegeneration, setNeedsRegeneration] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Settings
  const [settings, setSettings] = useState<BadAppleSettings>({
    invert: false,
    smoothing: 0.4,
    kernelSize: 3,
    ditherMode: 'none',
    letterSpacing: 0.05,
    lineHeight: 1.0,
    fontSize: 10,
  });

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const prevSettingsRef = useRef<BadAppleSettings>(settings);
  const regenerateTimeoutRef = useRef<number | null>(null);

  // Initialize hexagrams
  useEffect(() => {
    const initHexagrams = async () => {
      setLoadingStatus('Calculating hexagram densities...');
      const allHexs = getAllHexagrams();
      const sorted = await calculateCharacterDensities(allHexs);
      setSortedHexagrams(sorted);
    };
    initHexagrams();
  }, []);

  // Parse RLE data format
  const parseFrameData = useCallback((rawData: string): number[][] => {
    const segments = rawData.split('m');
    const parsed: any[][] = [];

    for (let i = 0; i < segments.length; i++) {
      parsed.push(segments[i].split(','));
    }

    for (let i = 0; i < parsed.length; i++) {
      if (i > 0) {
        parsed[i].shift();
      } else {
        parsed[0][0] = '0';
      }
      for (let j = 0; j < parsed[i].length; j++) {
        parsed[i][j] = parseInt(parsed[i][j], 10);
      }
    }

    return parsed as number[][];
  }, []);

  // Decode single frame
  const decodeFrame = useCallback((frameData: number[]) => {
    let totalPixels = 0;
    for (let i = 1; i < frameData.length; i += 2) {
      totalPixels += frameData[i];
    }

    const pixels = new Uint8Array(totalPixels);
    let offset = 0;

    for (let i = 1; i < frameData.length; i += 2) {
      const colorValue = frameData[i - 1];
      const count = frameData[i];
      const value = colorValue === 255 ? 255 : 0;
      pixels.fill(value, offset, offset + count);
      offset += count;
    }

    const height = Math.max(1, Math.ceil(totalPixels / FRAME_WIDTH));
    return { pixels, height, totalPixels };
  }, []);

  // Blur pixels helper
  const blurPixels = useCallback(
    (pixels: Uint8Array, height: number, totalPixels: number, kernelSize: number) => {
      const blurred = new Uint8Array(totalPixels);
      const radius = Math.max(0, Math.floor(kernelSize / 2));

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < FRAME_WIDTH; x++) {
          const index = y * FRAME_WIDTH + x;
          if (index >= totalPixels) continue;

          let sum = 0;
          let count = 0;

          for (let yy = -radius; yy <= radius; yy++) {
            const ny = y + yy;
            if (ny < 0 || ny >= height) continue;

            for (let xx = -radius; xx <= radius; xx++) {
              const nx = x + xx;
              if (nx < 0 || nx >= FRAME_WIDTH) continue;

              const neighborIndex = ny * FRAME_WIDTH + nx;
              if (neighborIndex >= totalPixels) continue;

              sum += pixels[neighborIndex];
              count++;
            }
          }
          blurred[index] = Math.round(sum / count);
        }
      }

      return blurred;
    },
    []
  );

  const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

  // Ordered dithering
  const applyOrderedDither = useCallback(
    (ratios: Float32Array, totalPixels: number, maxIndex: number) => {
      const matrix = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
      ];
      const matrixSize = 4;
      const adjusted = new Float32Array(totalPixels);

      const whiteGuard = 1 - 1 / Math.max(4, maxIndex);
      const blackGuard = 1 / Math.max(4, maxIndex);

      for (let i = 0; i < totalPixels; i++) {
        const base = ratios[i];
        if (base >= whiteGuard) {
          adjusted[i] = 1;
          continue;
        }
        if (base <= blackGuard) {
          adjusted[i] = 0;
          continue;
        }
        const x = i % FRAME_WIDTH;
        const y = Math.floor(i / FRAME_WIDTH);
        const threshold = (matrix[y % matrixSize][x % matrixSize] + 0.5) / (matrixSize * matrixSize);
        const tweak = (threshold - 0.5) / Math.max(1, maxIndex);
        adjusted[i] = clamp01(base + tweak);
      }

      return adjusted;
    },
    []
  );

  // Floyd-Steinberg dithering
  const applyFloydSteinberg = useCallback(
    (ratios: Float32Array, totalPixels: number, maxIndex: number) => {
      const result = new Float32Array(totalPixels);
      const work = new Float32Array(ratios);

      for (let i = 0; i < totalPixels; i++) {
        const oldValue = clamp01(work[i]);
        const quantized = Math.round(oldValue * maxIndex) / maxIndex;
        result[i] = quantized;
        const error = oldValue - quantized;

        const x = i % FRAME_WIDTH;
        const right = i + 1;
        const down = i + FRAME_WIDTH;
        const downLeft = i + FRAME_WIDTH - 1;
        const downRight = i + FRAME_WIDTH + 1;

        if (x + 1 < FRAME_WIDTH && right < totalPixels) {
          work[right] = clamp01(work[right] + (error * 7) / 16);
        }
        if (down < totalPixels) {
          work[down] = clamp01(work[down] + (error * 5) / 16);
        }
        if (x - 1 >= 0 && downLeft < totalPixels) {
          work[downLeft] = clamp01(work[downLeft] + (error * 3) / 16);
        }
        if (x + 1 < FRAME_WIDTH && downRight < totalPixels) {
          work[downRight] = clamp01(work[downRight] + error / 16);
        }
      }

      return result;
    },
    []
  );

  // Generate single frame
  const generateFrame = useCallback(
    (
      frameData: number[],
      hexagrams: string[],
      invert: boolean,
      smoothing: number,
      kernelSize: number,
      ditherMode: BadAppleSettings['ditherMode']
    ): string => {
      if (hexagrams.length === 0) return '';

      const { pixels, height, totalPixels } = decodeFrame(frameData);
      if (totalPixels === 0) return '';

      const ratios = new Float32Array(totalPixels);
      for (let i = 0; i < totalPixels; i++) {
        ratios[i] = pixels[i] / 255;
      }

      if (smoothing > 0 && kernelSize > 1) {
        const blurred = blurPixels(pixels, height, totalPixels, kernelSize);
        const inverse = 1 - smoothing;
        for (let i = 0; i < totalPixels; i++) {
          const blended = (pixels[i] * inverse + blurred[i] * smoothing) / 255;
          ratios[i] = clamp01(blended);
        }
      }

      let frame = '';
      const maxIndex = hexagrams.length - 1;
      let ratiosForMap = ratios;

      if (ditherMode === 'ordered') {
        ratiosForMap = applyOrderedDither(ratios, totalPixels, maxIndex);
      } else if (ditherMode === 'floyd') {
        ratiosForMap = applyFloydSteinberg(ratios, totalPixels, maxIndex);
      }

      let x = 1;
      for (let i = 0; i < totalPixels; i++) {
        const ratio = ratiosForMap[i];
        const rawIndex = invert
          ? Math.floor(ratio * maxIndex)
          : Math.floor((1 - ratio) * maxIndex);
        const index = Math.max(0, Math.min(maxIndex, rawIndex));
        frame += hexagrams[index];
        x++;
        if (x === FRAME_WIDTH) {
          x = 1;
          frame += '\n';
        }
      }

      return frame;
    },
    [blurPixels, decodeFrame, applyOrderedDither, applyFloydSteinberg]
  );

  // Generate all frames
  const generateAllFrames = useCallback(
    async (
      frameData: number[][],
      hexagrams: string[],
      invert: boolean,
      smoothing: number,
      kernelSize: number,
      ditherMode: BadAppleSettings['ditherMode']
    ) => {
      setIsRegenerating(true);
      setLoadingStatus('Generating frames...');

      const generatedFrames: string[] = [];

      for (let i = 0; i < Math.min(frameData.length, TOTAL_FRAMES); i++) {
        const frame = generateFrame(
          frameData[i],
          hexagrams,
          invert,
          smoothing,
          kernelSize,
          ditherMode
        );
        generatedFrames.push(frame);

        if (i % 100 === 0) {
          const pct = Math.floor((i / TOTAL_FRAMES) * 100);
          setLoadingStatus(`Generating frames... ${pct}%`);
          setLoadingProgress(pct);
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      setFrames(generatedFrames);
      setIsRegenerating(false);
      setNeedsRegeneration(false);
      setLoadingStatus('Ready');
      setLoadingProgress(100);
    },
    [generateFrame]
  );

  // Load and parse data
  useEffect(() => {
    if (sortedHexagrams.length === 0) return;

    const loadData = async () => {
      try {
        setLoadingStatus('Loading Bad Apple data...');
        const response = await fetch('/bad_apple.txt');
        const rawData = await response.text();

        setLoadingStatus('Parsing frame data...');
        const parsed = parseFrameData(rawData);
        setParsedFrameData(parsed);

        await generateAllFrames(
          parsed,
          sortedHexagrams,
          settings.invert,
          settings.smoothing,
          settings.kernelSize,
          settings.ditherMode
        );
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load Bad Apple data:', error);
        setLoadingStatus('Error loading data');
      }
    };

    loadData();
  }, [
    sortedHexagrams,
    parseFrameData,
    generateAllFrames,
    settings.invert,
    settings.smoothing,
    settings.kernelSize,
    settings.ditherMode,
  ]);

  // Track settings changes
  useEffect(() => {
    if (
      prevSettingsRef.current.invert !== settings.invert ||
      prevSettingsRef.current.smoothing !== settings.smoothing ||
      prevSettingsRef.current.kernelSize !== settings.kernelSize ||
      prevSettingsRef.current.ditherMode !== settings.ditherMode
    ) {
      setNeedsRegeneration(true);
    }
    prevSettingsRef.current = settings;
  }, [settings]);

  // Debounced regeneration when paused
  useEffect(() => {
    if (isPlaying || !needsRegeneration || parsedFrameData.length === 0) return;

    if (regenerateTimeoutRef.current) {
      window.clearTimeout(regenerateTimeoutRef.current);
    }

    regenerateTimeoutRef.current = window.setTimeout(() => {
      generateAllFrames(
        parsedFrameData,
        sortedHexagrams,
        settings.invert,
        settings.smoothing,
        settings.kernelSize,
        settings.ditherMode
      );
    }, 250);

    return () => {
      if (regenerateTimeoutRef.current) {
        window.clearTimeout(regenerateTimeoutRef.current);
      }
    };
  }, [
    isPlaying,
    needsRegeneration,
    parsedFrameData,
    sortedHexagrams,
    settings.invert,
    settings.smoothing,
    settings.kernelSize,
    settings.ditherMode,
    generateAllFrames,
  ]);

  // Animation loop - synced with audio
  const animate = useCallback(() => {
    if (!isPlaying || !audioRef.current) return;

    const audioTime = audioRef.current.currentTime;
    const targetFrame = Math.floor(audioTime * FPS);
    const clampedFrame = Math.min(targetFrame, frames.length - 1);

    setCurrentFrame((prev) => {
      if (clampedFrame >= frames.length - 1) {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        return frames.length - 1;
      }
      return clampedFrame;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, frames.length]);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
      if (audioRef.current) {
        const targetTime = currentFrame / FPS;
        if (Math.abs(audioRef.current.currentTime - targetTime) > 0.1) {
          audioRef.current.currentTime = targetTime;
        }
        audioRef.current.play().catch(console.error);
      }
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate, currentFrame]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  // Playback controls
  const handlePlay = async () => {
    if (needsRegeneration && parsedFrameData.length > 0) {
      await generateAllFrames(
        parsedFrameData,
        sortedHexagrams,
        settings.invert,
        settings.smoothing,
        settings.kernelSize,
        settings.ditherMode
      );
    }

    if (currentFrame >= frames.length - 1) {
      setCurrentFrame(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }
    setIsPlaying(true);
  };

  const handlePause = () => setIsPlaying(false);

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentFrame(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const progress = frames.length > 0 ? (currentFrame / (frames.length - 1)) * 100 : 0;

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = currentFrame / FPS;
  const totalTime = (frames.length - 1) / FPS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Hidden audio element */}
      <audio ref={audioRef} src="/bad_apple.m4a" preload="auto" />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <SealButton onClick={onBack} icon={<ArrowLeft size={16} />} variant="gold">
          Back to Oracle
        </SealButton>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            color: 'var(--gold)',
            letterSpacing: '0.1em',
          }}
        >
          Bad Apple!! <span style={{ opacity: 0.5, fontSize: '16px' }}>易經版</span>
        </h2>

        <div style={{ width: '140px' }} />
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isPlaying || isLoading ? '1fr' : '1fr 300px',
          gap: 'var(--space-lg)',
          transition: 'all var(--transition-medium)',
        }}
      >
        {/* Player area */}
        <OraclePanel>
          {isLoading ? (
            <div style={{ padding: 'var(--space-3xl)' }}>
              <OracleLoading message={loadingStatus} symbol="☯" />
              <div style={{ marginTop: 'var(--space-xl)', maxWidth: '400px', margin: '0 auto' }}>
                <OracleProgress value={loadingProgress} />
              </div>
            </div>
          ) : (
            <>
              {/* Frame display */}
              <HexagramDisplay>
                {isRegenerating && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(10, 10, 10, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }}
                  >
                    <OracleLoading message={loadingStatus} symbol="☯" />
                  </div>
                )}

                <pre
                  style={{
                    fontFamily: 'var(--font-hexagram)',
                    fontSize: `${settings.fontSize}px`,
                    color: 'var(--paper-aged)',
                    whiteSpace: 'pre',
                    letterSpacing: `${settings.letterSpacing}em`,
                    lineHeight: settings.lineHeight,
                    margin: 0,
                  }}
                >
                  {frames[currentFrame] || ''}
                </pre>
              </HexagramDisplay>

              {/* Progress bar */}
              <div style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <OracleProgress value={progress} />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 'var(--space-xs)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--ink-wash)',
                  }}
                >
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(totalTime)}</span>
                </div>
              </div>

              {/* Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-md)',
                }}
              >
                {isPlaying ? (
                  <IconButton
                    icon={<Pause size={24} />}
                    onClick={handlePause}
                    variant="primary"
                    size="lg"
                    title="Pause"
                  />
                ) : (
                  <IconButton
                    icon={needsRegeneration ? <RotateCcw size={24} /> : <Play size={24} />}
                    onClick={handlePlay}
                    variant="primary"
                    size="lg"
                    title={needsRegeneration ? 'Regenerate and Play' : 'Play'}
                    disabled={isRegenerating}
                  />
                )}

                <IconButton
                  icon={<Square size={20} />}
                  onClick={handleStop}
                  size="md"
                  title="Stop"
                />

                <IconButton
                  icon={isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  onClick={toggleMute}
                  size="md"
                  title={isMuted ? 'Unmute' : 'Mute'}
                />

                <div
                  style={{
                    marginLeft: 'var(--space-lg)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: 'var(--paper-shadow)',
                  }}
                >
                  Frame{' '}
                  <span style={{ color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>
                    {currentFrame + 1}
                  </span>{' '}
                  / {frames.length}
                </div>
              </div>
            </>
          )}
        </OraclePanel>

        {/* Settings panel - only when paused */}
        {!isPlaying && !isLoading && (
          <OraclePanel>
            <SectionHeader trigram="☲">Configuration</SectionHeader>

            <OracleToggle
              label="Invert Colors"
              value={settings.invert}
              onChange={(v) => setSettings({ ...settings, invert: v })}
            />

            <OracleDivider symbol="☰" />

            <OracleSlider
              label="Density Mix"
              value={settings.smoothing}
              onChange={(v) => setSettings({ ...settings, smoothing: v })}
              min={0}
              max={1}
              step={0.05}
              displayValue={settings.smoothing.toFixed(2)}
              hint="Blends local density for dithering"
            />

            <OracleSlider
              label="Kernel Size"
              value={settings.kernelSize}
              onChange={(v) => setSettings({ ...settings, kernelSize: Math.round(v) })}
              min={1}
              max={7}
              step={2}
              displayValue={`${settings.kernelSize}×${settings.kernelSize}`}
              hint="Odd sizes only. 1 disables blur"
            />

            <OracleSelect
              label="Dither Mode"
              value={settings.ditherMode}
              onChange={(v) =>
                setSettings({ ...settings, ditherMode: v as BadAppleSettings['ditherMode'] })
              }
              options={[
                { value: 'none', label: 'None' },
                { value: 'ordered', label: 'Ordered (Bayer)' },
                { value: 'floyd', label: 'Floyd-Steinberg' },
              ]}
              hint="Ordered is stable, Floyd is sharper"
            />

            <OracleDivider symbol="☷" />

            <OracleSlider
              label="Font Size"
              value={settings.fontSize}
              onChange={(v) => setSettings({ ...settings, fontSize: Math.round(v) })}
              min={4}
              max={16}
              step={1}
              displayValue={`${settings.fontSize}px`}
            />

            <OracleSlider
              label="Line Height"
              value={settings.lineHeight}
              onChange={(v) => setSettings({ ...settings, lineHeight: v })}
              min={0.5}
              max={1.5}
              step={0.05}
              displayValue={settings.lineHeight.toFixed(2)}
            />

            <OracleSlider
              label="Letter Spacing"
              value={settings.letterSpacing}
              onChange={(v) => setSettings({ ...settings, letterSpacing: v })}
              min={-0.1}
              max={0.3}
              step={0.01}
              displayValue={`${settings.letterSpacing.toFixed(2)}em`}
            />

            {needsRegeneration && (
              <div
                style={{
                  marginTop: 'var(--space-md)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'rgba(201, 162, 39, 0.1)',
                  border: '1px solid rgba(201, 162, 39, 0.3)',
                  borderRadius: '4px',
                }}
              >
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--gold)',
                    textAlign: 'center',
                    margin: 0,
                  }}
                >
                  Settings changed. Frames will regenerate.
                </p>
              </div>
            )}
          </OraclePanel>
        )}
      </div>

      {/* Stats footer */}
      {!isLoading && (
        <StatsDisplay
          stats={[
            { label: 'Total Frames', value: TOTAL_FRAMES },
            { label: 'FPS', value: FPS },
            { label: 'Resolution', value: `${FRAME_WIDTH} chars` },
            { label: 'Hexagrams', value: 64 },
          ]}
        />
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          [style*="grid-template-columns: 1fr 300px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
