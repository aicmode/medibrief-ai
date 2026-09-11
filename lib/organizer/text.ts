/**
 * 文の分割と時期表現の抜き出し。
 *
 * ルールベース整理（rule-based.ts）と症状経過タイムライン（lib/timeline.ts）の
 * 両方から使うので、独立したモジュールにしてある。
 * ここでは推測を一切しない。入力に書かれた文字だけを切り出す。
 */

import { TIME_PATTERN_SOURCES } from "./dictionaries";

export type TimeHit = {
  /** 入力に現れたままの時期表現（例: 「昨日の夜」） */
  phrase: string;
  index: number;
  end: number;
  /** 直後が「から」かどうか（「3日前から」の判定に使う） */
  withKara: boolean;
};

export function normalizeInput(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t　]+/g, " ")
    .trim();
}

/** 句読点で短い句に分ける。「？」「！」は疑問の手がかりなので文末に残す。 */
export function splitClauses(input: string): string[] {
  const separators = "。．、，,；;\n";
  const keepAndBreak = "？?！!";
  const out: string[] = [];
  let buffer = "";

  for (const char of normalizeInput(input)) {
    if (separators.includes(char)) {
      out.push(buffer);
      buffer = "";
    } else if (keepAndBreak.includes(char)) {
      out.push(buffer + char);
      buffer = "";
    } else {
      buffer += char;
    }
  }
  out.push(buffer);

  return out.map((s) => s.trim()).filter((s) => s.length >= 2);
}

/** 文中の時期表現をすべて拾う。重なった検出は長い方だけを残す。 */
export function findTimePhrases(text: string): TimeHit[] {
  const found: TimeHit[] = [];

  for (const source of TIME_PATTERN_SOURCES) {
    for (const match of text.matchAll(new RegExp(source, "g"))) {
      const index = match.index ?? 0;
      const end = index + match[0].length;
      found.push({
        phrase: match[0],
        index,
        end,
        withKara: text.slice(end).startsWith("から"),
      });
    }
  }

  // 「今朝」と「今」のように重なった検出は、長い方だけを残す
  found.sort((a, b) => a.index - b.index || b.phrase.length - a.phrase.length);
  const accepted: TimeHit[] = [];
  for (const hit of found) {
    const overlaps = accepted.some((a) => hit.index < a.end && a.index < hit.end);
    if (!overlaps) accepted.push(hit);
  }
  return accepted.sort((a, b) => a.index - b.index);
}

/** 表示用の時期テキスト。「から」が続いていたときだけ付け足す。 */
export function timeText(hit: TimeHit): string {
  return hit.withKara ? `${hit.phrase}から` : hit.phrase;
}
