/**
 * 受診メモの履歴（この端末のブラウザ内だけに保存）。
 *
 * 設計上の約束:
 *   - クラウドDBは使わない。保存先は localStorage だけ。
 *   - サーバーへ体調の情報を永続保存しない。
 *   - 壊れた保存データを読んでもアプリを落とさない（検証して落とすだけ）。
 *   - プライベートブラウズや容量超過で保存できないことがあるので、失敗を返り値で伝える。
 *
 * React からは useSyncExternalStore で購読する（effect内でsetStateしないため）。
 */

import { MAX_HISTORY_ENTRIES } from "./limits";
import { memoTitle } from "./format";
import { normalizeVisitMemo } from "./organizer/validate";
import type { VisitMemo } from "./types";

export const STORAGE_KEY = "medibrief.history.v1";

export type HistoryEntry = {
  id: string;
  /** 保存した時刻（ISO 8601） */
  savedAt: string;
  /** 一覧に出す短い見出し */
  title: string;
  memo: VisitMemo;
};

export type SaveResult =
  | { ok: true; entry: HistoryEntry }
  | { ok: false; reason: "unavailable" | "failed" };

const EMPTY: readonly HistoryEntry[] = Object.freeze([]);

let cache: readonly HistoryEntry[] | null = null;
const listeners = new Set<() => void>();

/* ------------------------------------------------------------------ */
/* 読み書き                                                            */
/* ------------------------------------------------------------------ */

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Cookie/ストレージがブロックされている環境ではアクセス自体が例外になる
    return null;
  }
}

let availability: boolean | null = null;

/** 保存が使える環境かどうか（UIの案内に使う）。結果は一度だけ調べて覚えておく。 */
export function isHistoryAvailable(): boolean {
  availability ??= probeStorage();
  return availability;
}

function probeStorage(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    const probe = `${STORAGE_KEY}.probe`;
    store.setItem(probe, "1");
    store.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readFromStorage(): readonly HistoryEntry[] {
  const store = storage();
  if (!store) return EMPTY;

  let raw: string | null = null;
  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (!raw) return EMPTY;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // 壊れたJSONは読み捨てる（消しはしない：ユーザーのデータを勝手に消さない）
    return EMPTY;
  }
  if (!Array.isArray(parsed)) return EMPTY;

  const entries: HistoryEntry[] = [];
  for (const value of parsed) {
    const entry = parseHistoryEntry(value);
    if (entry) entries.push(entry);
    if (entries.length >= MAX_HISTORY_ENTRIES) break;
  }
  return Object.freeze(entries);
}

/** 保存データ1件分の検証。少しでも形が違えば null を返して捨てる。 */
export function parseHistoryEntry(value: unknown): HistoryEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as { id?: unknown; savedAt?: unknown; title?: unknown; memo?: unknown };
  if (typeof raw.id !== "string" || raw.id.trim() === "") return null;

  const savedAt = new Date(typeof raw.savedAt === "string" ? raw.savedAt : "");
  if (Number.isNaN(savedAt.getTime())) return null;

  let memo: VisitMemo;
  try {
    memo = normalizeVisitMemo(raw.memo, { fallbackProvider: "rule-based" });
  } catch {
    return null;
  }

  return {
    id: raw.id,
    savedAt: savedAt.toISOString(),
    title:
      typeof raw.title === "string" && raw.title.trim() !== ""
        ? raw.title.trim()
        : memoTitle(memo),
    memo,
  };
}

function writeToStorage(entries: readonly HistoryEntry[]): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    // 容量超過やプライベートブラウズ。握り潰さず false を返して画面で伝える。
    return false;
  }
}

function commit(entries: readonly HistoryEntry[]): boolean {
  const ok = writeToStorage(entries);
  if (ok) {
    cache = Object.freeze([...entries]);
    emit();
  }
  return ok;
}

function emit(): void {
  for (const listener of listeners) listener();
}

/* ------------------------------------------------------------------ */
/* React から使う（useSyncExternalStore）                              */
/* ------------------------------------------------------------------ */

export function subscribeHistory(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

function handleStorageEvent(event: StorageEvent): void {
  // 別タブで履歴が変わったときに追従する
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  cache = null;
  emit();
}

export function getHistorySnapshot(): readonly HistoryEntry[] {
  cache ??= readFromStorage();
  return cache;
}

/** サーバー描画時は常に空（localStorage は端末の中にしかない） */
export function getHistoryServerSnapshot(): readonly HistoryEntry[] {
  return EMPTY;
}

/* ------------------------------------------------------------------ */
/* 操作                                                                */
/* ------------------------------------------------------------------ */

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `memo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** いまの受診メモを履歴に保存する。古いものは MAX_HISTORY_ENTRIES を超えた分から消える。 */
export function saveMemoToHistory(memo: VisitMemo): SaveResult {
  if (!isHistoryAvailable()) return { ok: false, reason: "unavailable" };

  const entry: HistoryEntry = {
    id: createId(),
    savedAt: new Date().toISOString(),
    title: memoTitle(memo),
    memo,
  };
  const next = [entry, ...getHistorySnapshot()].slice(0, MAX_HISTORY_ENTRIES);
  return commit(next) ? { ok: true, entry } : { ok: false, reason: "failed" };
}

/** 1件削除 */
export function deleteHistoryEntry(id: string): boolean {
  return commit(getHistorySnapshot().filter((entry) => entry.id !== id));
}

/** 全件削除 */
export function clearHistory(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.removeItem(STORAGE_KEY);
    cache = EMPTY;
    emit();
    return true;
  } catch {
    return false;
  }
}

/** テスト用。モジュール内のキャッシュを捨てる。 */
export function resetHistoryCache(): void {
  cache = null;
  availability = null;
}
