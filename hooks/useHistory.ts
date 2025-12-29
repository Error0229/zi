import { useState, useCallback, useEffect } from 'react';
import {
  getRecords,
  addRecord,
  deleteRecord,
  clearAllRecords,
  getStorageInfo,
  compressImageToThumbnail,
  type DivinationRecord,
} from '../utils/storage';
import type { DivinationResult, DivinationMethod } from '../types/divination';

/* ═══════════════════════════════════════════════════════════════════════════
   useHistory Hook - 歷史紀錄管理
   ═══════════════════════════════════════════════════════════════════════════ */

export interface UseHistoryReturn {
  records: DivinationRecord[];
  storageInfo: { count: number; sizeKB: number };
  isLoading: boolean;

  saveResult: (
    result: DivinationResult,
    imageSrc: string,
    imageName: string,
    asciiArt?: string,
    hexagramArt?: string
  ) => Promise<DivinationRecord>;

  remove: (id: string) => void;
  clearAll: () => void;
  refresh: () => void;
}

export function useHistory(): UseHistoryReturn {
  const [records, setRecords] = useState<DivinationRecord[]>([]);
  const [storageInfo, setStorageInfo] = useState({ count: 0, sizeKB: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Load records on mount
  const refresh = useCallback(() => {
    setRecords(getRecords());
    setStorageInfo(getStorageInfo());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Save a new divination result
  const saveResult = useCallback(
    async (
      result: DivinationResult,
      imageSrc: string,
      imageName: string,
      asciiArt?: string,
      hexagramArt?: string
    ): Promise<DivinationRecord> => {
      // Compress image for storage
      const thumbnail = await compressImageToThumbnail(imageSrc);

      const record = addRecord({
        imageData: thumbnail,
        imageName,
        method: result.method,
        lines: result.lines.map((l) => l.value),
        primaryHexagram: result.primaryHexagram.number,
        changingLines: result.changingLines,
        transformedHexagram: result.transformedHexagram?.number || null,
        asciiArt,
        hexagramArt,
      });

      refresh();
      return record;
    },
    [refresh]
  );

  // Delete a record
  const remove = useCallback(
    (id: string) => {
      deleteRecord(id);
      refresh();
    },
    [refresh]
  );

  // Clear all records
  const clearAll = useCallback(() => {
    clearAllRecords();
    refresh();
  }, [refresh]);

  return {
    records,
    storageInfo,
    isLoading,
    saveResult,
    remove,
    clearAll,
    refresh,
  };
}
