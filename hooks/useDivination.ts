import { useState, useCallback } from 'react';
import {
  imageMethod,
  coinsMethod,
  yarrowMethod,
  getReadingInterpretation,
} from '../utils/divination';
import type {
  DivinationMethod,
  DivinationResult,
  ReadingInterpretation,
} from '../types/divination';

/* ═══════════════════════════════════════════════════════════════════════════
   useDivination Hook - 占卜邏輯
   ═══════════════════════════════════════════════════════════════════════════ */

export interface DivinationState {
  result: DivinationResult | null;
  interpretation: ReadingInterpretation | null;
  isProcessing: boolean;
  error: string | null;
}

export interface UseDivinationReturn extends DivinationState {
  divine: (imageData: ImageData, method: DivinationMethod) => void;
  reset: () => void;
}

export function useDivination(): UseDivinationReturn {
  const [state, setState] = useState<DivinationState>({
    result: null,
    interpretation: null,
    isProcessing: false,
    error: null,
  });

  const divine = useCallback((imageData: ImageData, method: DivinationMethod) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      let result: DivinationResult;

      switch (method) {
        case 'image':
          result = imageMethod(imageData);
          break;
        case 'coins':
          result = coinsMethod(imageData);
          break;
        case 'yarrow':
          result = yarrowMethod(imageData);
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }

      const interpretation = getReadingInterpretation(result);

      setState({
        result,
        interpretation,
        isProcessing: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err instanceof Error ? err.message : '占卜失敗',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      result: null,
      interpretation: null,
      isProcessing: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    divine,
    reset,
  };
}
