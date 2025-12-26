/* ═══════════════════════════════════════════════════════════════════════════
   Unified Settings Types
   ═══════════════════════════════════════════════════════════════════════════ */

// Display settings - shared between all modes
export interface DisplaySettings {
  lineHeight: number;
  letterSpacing: number;
  invert: boolean;
}

// Image processing settings - for static image generation
export interface ImageSettings extends DisplaySettings {
  resolutionWidth: number;
  contrast: number;
  brightness: number;
  verticalScale: number;
}

// Bad Apple processing settings - for video playback
export interface BadAppleSettings extends DisplaySettings {
  smoothing: number;
  kernelSize: number;
  ditherMode: 'none' | 'ordered' | 'floyd';
}

// Default values
export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  lineHeight: 1.0,
  letterSpacing: 0,
  invert: false,
};

export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  ...DEFAULT_DISPLAY_SETTINGS,
  resolutionWidth: 100,
  contrast: 1.2,
  brightness: 0,
  verticalScale: 0.55,
};

export const DEFAULT_BADAPPLE_SETTINGS: BadAppleSettings = {
  ...DEFAULT_DISPLAY_SETTINGS,
  smoothing: 0.4,
  kernelSize: 3,
  ditherMode: 'none',
};
