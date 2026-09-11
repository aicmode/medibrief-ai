/**
 * 外から来たデータ（AIの応答・localStorageの保存データ）を、
 * 画面が期待する VisitMemo に整えるための検証。
 *
 * 方針:
 *   - 知らないキーは無視する
 *   - 足りない項目は「空」で補う（推測で埋めない）
 *   - 長すぎる・多すぎるものは切り詰める
 *   - タイムラインは入力に根拠があるものだけ残す
 *   - 直せない形（そもそもオブジェクトでない等）は例外にして、呼び出し側でフォールバックさせる
 */

import { MAX_ITEMS_PER_SECTION, MAX_ITEM_LENGTH, MAX_TIMELINE_ENTRIES } from "../limits";
import { SECTION_META } from "../sections";
import { isGroundedTimelineEntry } from "../timeline";
import {
  SECTION_IDS,
  type MemoSection,
  type TimelineEntry,
  type VisitMemo,
} from "../types";

type RawMemo = {
  sections?: unknown;
  timeline?: unknown;
  provider?: unknown;
  generatedAt?: unknown;
  sourceInput?: unknown;
};

export type NormalizeOptions = {
  /** 整理のもとになった入力。省略時はデータ側の sourceInput を使う。 */
  sourceInput?: string;
  /** provider が壊れていたときに使う名前 */
  fallbackProvider: string;
};

export function normalizeVisitMemo(
  value: unknown,
  options: NormalizeOptions,
): VisitMemo {
  if (typeof value !== "object" || value === null) {
    throw new Error("整理結果がオブジェクトではありません");
  }
  const raw = value as RawMemo;
  if (!Array.isArray(raw.sections)) {
    throw new Error("整理結果に sections がありません");
  }

  const sourceInput =
    options.sourceInput ??
    (typeof raw.sourceInput === "string" ? raw.sourceInput : "");

  return {
    sections: normalizeSections(raw.sections),
    timeline: normalizeTimeline(raw.timeline, sourceInput),
    provider:
      typeof raw.provider === "string" && raw.provider.trim() !== ""
        ? raw.provider.trim()
        : options.fallbackProvider,
    generatedAt: normalizeTimestamp(raw.generatedAt),
    sourceInput,
  };
}

function normalizeSections(rawSections: unknown[]): MemoSection[] {
  const incoming = new Map<string, string[]>();

  for (const section of rawSections) {
    if (typeof section !== "object" || section === null) continue;
    const { id, items } = section as { id?: unknown; items?: unknown };
    if (typeof id !== "string" || !Array.isArray(items)) continue;
    incoming.set(id, normalizeItems(items));
  }

  return SECTION_IDS.map((id) => ({
    id,
    title: SECTION_META[id].title,
    hint: SECTION_META[id].hint,
    emptyGuide: SECTION_META[id].emptyGuide,
    items: incoming.get(id) ?? [],
  }));
}

export function normalizeItems(items: unknown[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (typeof item !== "string") continue;
    const text = truncate(item.trim());
    if (text === "" || out.includes(text)) continue;
    out.push(text);
    if (out.length >= MAX_ITEMS_PER_SECTION) break;
  }
  return out;
}

function normalizeTimeline(value: unknown, sourceInput: string): TimelineEntry[] {
  if (!Array.isArray(value)) return [];

  const out: TimelineEntry[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) continue;
    const { time, text } = raw as { time?: unknown; text?: unknown };
    if (typeof time !== "string" || typeof text !== "string") continue;

    const entry: TimelineEntry = {
      time: truncate(time.trim()),
      text: truncate(text.trim()),
    };
    // 入力に無い時期は採用しない（AIが日付を作ってしまうのを防ぐ）
    if (!isGroundedTimelineEntry(entry, sourceInput)) continue;
    if (out.some((e) => e.time === entry.time && e.text === entry.text)) continue;

    out.push(entry);
    if (out.length >= MAX_TIMELINE_ENTRIES) break;
  }
  return out;
}

function normalizeTimestamp(value: unknown): string {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
}

function truncate(text: string): string {
  return text.length > MAX_ITEM_LENGTH ? `${text.slice(0, MAX_ITEM_LENGTH)}…` : text;
}
