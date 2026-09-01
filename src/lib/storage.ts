export interface WarrantyRecord {
  id: string;
  serial: string;
  model: string;
  warrantyYears: number;
  installDate: string;
  customer: string;
  project: string;
  location: string;
  notes: string;
  createdAt: string;
}

const KEY = "solar_warranty_records_v1";
const DRAFT_KEY = "solar_warranty_draft_v1";

export function loadRecords(): WarrantyRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecords(records: WarrantyRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Save failed", e);
  }
}

export function loadDraft<T>(): T | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft<T>(draft: T) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // storage unavailable (private mode / quota) — draft is non-critical
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // storage unavailable — nothing to clear
  }
}
