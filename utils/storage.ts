/* ═══════════════════════════════════════════════════════════════════════════
   LocalStorage Utilities - 歷史紀錄儲存
   ═══════════════════════════════════════════════════════════════════════════ */

import type { DivinationMethod } from '../types/divination';

const STORAGE_KEY = 'yixiang_history';
const STORAGE_VERSION = 1;
const MAX_RECORDS = 100;
const MAX_THUMBNAIL_SIZE = 50 * 1024; // 50KB

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

export interface DivinationRecord {
  id: string;
  timestamp: number;

  // Input
  imageData: string;              // Base64 thumbnail
  imageName: string;
  method: DivinationMethod;

  // Result
  lines: number[];                // [9, 7, 8, 6, 7, 9]
  primaryHexagram: number;        // 1-64
  changingLines: number[];        // [1, 4, 6]
  transformedHexagram: number | null;

  // ASCII Art (optional)
  asciiArt?: string;
  hexagramArt?: string;
}

interface StorageSchema {
  version: number;
  records: DivinationRecord[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   UUID Generator
   ═══════════════════════════════════════════════════════════════════════════ */

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Image Compression
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Compress image to thumbnail for storage
 */
export async function compressImageToThumbnail(
  imageSrc: string,
  maxSize: number = MAX_THUMBNAIL_SIZE
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Start with reasonable dimensions
      let width = Math.min(img.width, 400);
      let height = (img.height / img.width) * width;

      // Iteratively reduce quality/size until under limit
      let quality = 0.8;
      let result = imageSrc;

      const tryCompress = () => {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        result = canvas.toDataURL('image/jpeg', quality);

        // Check size
        const sizeInBytes = (result.length * 3) / 4; // Base64 to bytes estimate

        if (sizeInBytes > maxSize && quality > 0.1) {
          quality -= 0.1;
          tryCompress();
        } else if (sizeInBytes > maxSize && width > 100) {
          width = Math.floor(width * 0.8);
          height = Math.floor(height * 0.8);
          quality = 0.7;
          tryCompress();
        }
      };

      tryCompress();
      resolve(result);
    };
    img.src = imageSrc;
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Storage Operations
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Get all records from storage
 */
export function getRecords(): DivinationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const data: StorageSchema = JSON.parse(raw);

    // Version migration could happen here
    if (data.version !== STORAGE_VERSION) {
      // For now, just return empty if version mismatch
      return [];
    }

    return data.records;
  } catch {
    return [];
  }
}

/**
 * Save records to storage
 */
function saveRecords(records: DivinationRecord[]): void {
  const data: StorageSchema = {
    version: STORAGE_VERSION,
    records,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Add a new record
 */
export function addRecord(
  record: Omit<DivinationRecord, 'id' | 'timestamp'>
): DivinationRecord {
  const records = getRecords();

  const newRecord: DivinationRecord = {
    ...record,
    id: generateId(),
    timestamp: Date.now(),
  };

  // Add to beginning (newest first)
  records.unshift(newRecord);

  // Enforce limit - remove oldest
  while (records.length > MAX_RECORDS) {
    records.pop();
  }

  saveRecords(records);
  return newRecord;
}

/**
 * Get a single record by ID
 */
export function getRecord(id: string): DivinationRecord | null {
  const records = getRecords();
  return records.find((r) => r.id === id) || null;
}

/**
 * Delete a record by ID
 */
export function deleteRecord(id: string): boolean {
  const records = getRecords();
  const index = records.findIndex((r) => r.id === id);

  if (index === -1) return false;

  records.splice(index, 1);
  saveRecords(records);
  return true;
}

/**
 * Clear all records
 */
export function clearAllRecords(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): { count: number; sizeKB: number } {
  const raw = localStorage.getItem(STORAGE_KEY);
  return {
    count: getRecords().length,
    sizeKB: raw ? Math.round((raw.length * 2) / 1024) : 0, // UTF-16 = 2 bytes per char
  };
}
