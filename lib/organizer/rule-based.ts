import { createEmptySections } from "../sections";
import type { MemoOrganizer, MemoSection, SectionId, VisitMemo } from "../types";
import * as D from "./dictionaries";

/**
 * ルールベースの受診メモ整理。
 *
 * 完全にブラウザ内（またはNode内）で動き、外部へ送信しない。
 * やることは次の4つだけ。
 *   1. 入力を短い文（句）に分ける
 *   2. 症状の言葉を、伝えやすい言い方に置き換える
 *   3. 時期の表現を「いつから」に抜き出す
 *   4. 残りの文を手がかり語で各項目に振り分ける
 *
 * やらないこと：病名の推測、薬の提案、緊急度の判定。
 */

export const RULE_BASED_PROVIDER = "rule-based";

/** 振り分け先になりうる項目（主な困りごと・いつから・伝え忘れ防止メモは別処理） */
type NarrativeSection = "medication" | "questions" | "progress" | "context";

type TimeHit = { phrase: string; index: number; end: number; withKara: boolean };
type SymptomHit = { label: string; negated: boolean };

export function organizeWithRules(input: string): VisitMemo {
  const sections = createEmptySections();
  const push = (id: SectionId, item: string) => addItem(sections, id, item);
  /** どの項目にも入らなかった文（最後にまとめて置き場所を決める） */
  const leftovers: string[] = [];

  for (const clause of splitClauses(input)) {
    const masked = prepareForMatching(clause);
    const symptoms = findSymptoms(masked);
    const positives = unique(
      symptoms.filter((s) => !s.negated).map((s) => s.label),
    );
    const hasNegatedSymptom = symptoms.some((s) => s.negated);
    const category = classify(clause);

    // --- 主な困りごと ---
    for (const label of positives) push("mainConcern", label);
    // 「吐いてはいない」のような否定文は、言い換えずそのまま残す
    if (hasNegatedSymptom) push("mainConcern", clause);

    // --- いつから ---
    let onsetPushed = false;
    for (const time of findTimePhrases(clause)) {
      if (positives.length > 0) {
        push("onset", `${timeText(time)}：${positives.join("・")}`);
        onsetPushed = true;
      } else if (time.withKara && category === null && !hasNegatedSymptom) {
        // 症状の言葉を辞書で拾えなかった場合の取りこぼし防止
        push("onset", timeText(time));
        push("mainConcern", clause);
        onsetPushed = true;
      }
    }

    // --- その他の項目への振り分け ---
    let placed = false;
    if (category === "questions") {
      push("questions", `気になっていること：${clause}`);
      for (const question of buildQuestions(clause)) push("questions", question);
      placed = true;
    } else if (category === "progress") {
      // 「今朝から少し熱っぽい」のように、すでに「いつから」に入った文は
      // 変化を表す言葉があるときだけ「症状の変化」にも載せる
      const hasChangeWord = D.CHANGE_KEYS.some((k) => clause.includes(k));
      if (hasChangeWord || !onsetPushed) {
        push("progress", clause);
        placed = true;
      }
    } else if (category !== null) {
      push(category, clause);
      placed = true;
    }

    // --- 取りこぼし防止：どこにも入らなかった文は必ずどこかに残す ---
    const represented =
      placed || positives.length > 0 || hasNegatedSymptom || onsetPushed;
    if (!represented) leftovers.push(clause);
  }

  // 辞書に無い言い方（「なんとなくしんどい」など）は、ほかに困りごとが
  // 見つかっていなければ「主な困りごと」として扱う。そのほうが伝わりやすい。
  const mainConcernIsEmpty =
    (sections.find((s) => s.id === "mainConcern")?.items.length ?? 0) === 0;
  for (const clause of leftovers) {
    push(mainConcernIsEmpty ? "mainConcern" : "context", clause);
  }

  // 質問が1つも拾えなければ、汎用の質問を添える（判断ではなく、聞くための文）
  const questions = sections.find((s) => s.id === "questions");
  if (questions && questions.items.length === 0) {
    for (const q of D.DEFAULT_QUESTIONS) push("questions", q);
  }

  for (const item of buildReminders(sections, input)) push("reminders", item);

  return {
    sections,
    provider: RULE_BASED_PROVIDER,
    generatedAt: new Date().toISOString(),
  };
}

export const ruleBasedOrganizer: MemoOrganizer = {
  name: RULE_BASED_PROVIDER,
  organize: async (input) => organizeWithRules(input),
};

/* ------------------------------------------------------------------ */
/* 文の分割                                                            */
/* ------------------------------------------------------------------ */

function normalize(input: string): string {
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

  for (const char of normalize(input)) {
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

/* ------------------------------------------------------------------ */
/* 症状の言い換え                                                      */
/* ------------------------------------------------------------------ */

/**
 * 症状を探す前の下ごしらえ。
 * ・薬の名前を同じ長さの記号で伏せる（「痛み止め」を痛みと読まないため）
 * ・「喉も痛い」を「喉が痛い」と同じ扱いにする
 * どちらも文字数を変えないので、否定表現を見るときの位置がずれない。
 */
function prepareForMatching(text: string): string {
  let prepared = text;
  for (const phrase of D.MASK_PHRASES) {
    if (!prepared.includes(phrase)) continue;
    prepared = prepared.split(phrase).join("〇".repeat(phrase.length));
  }
  return prepared.replace(/も(痛|重|辛|かゆ|痒|苦し)/g, "が$1");
}

const FALLBACK_LABELS = ["痛み", "違和感"];

function findSymptoms(masked: string): SymptomHit[] {
  const hits: SymptomHit[] = [];
  let matchedSpecific = false;

  for (const rule of D.SYMPTOM_RULES) {
    const isFallback = FALLBACK_LABELS.includes(rule.label);
    // 具体的な症状が取れているなら、受け皿（「痛み」など）は使わない
    if (isFallback && matchedSpecific) continue;

    for (const key of rule.keys) {
      const index = masked.indexOf(key);
      if (index === -1) continue;
      if (!isFallback) matchedSpecific = true;
      hits.push({
        label: rule.label,
        negated: isNegated(masked, index + key.length),
      });
      break; // 同じラベルは1つで十分
    }
  }
  return hits;
}

/** 症状の言葉の直後に否定表現があるか（「吐いてはいない」→ true） */
function isNegated(text: string, from: number): boolean {
  const window = text.slice(from, from + 8);
  if (!D.NEGATION_KEYS.some((k) => window.includes(k))) return false;
  // 「痛みが治らない」は症状の否定ではないので除外する
  return !D.NEGATION_EXCEPTIONS.some((k) => window.includes(k));
}

/* ------------------------------------------------------------------ */
/* 時期の抜き出し                                                      */
/* ------------------------------------------------------------------ */

function findTimePhrases(text: string): TimeHit[] {
  const found: TimeHit[] = [];

  for (const source of D.TIME_PATTERN_SOURCES) {
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
  return accepted;
}

function timeText(hit: TimeHit): string {
  return hit.withKara ? `${hit.phrase}から` : hit.phrase;
}

/* ------------------------------------------------------------------ */
/* 振り分け                                                            */
/* ------------------------------------------------------------------ */

/**
 * 文をどの項目に入れるか決める。
 * 手がかりが強い順に見ていくだけの、単純な優先順位。
 */
function classify(clause: string): NarrativeSection | null {
  if (D.QUESTION_KEYS.some((k) => clause.includes(k))) return "questions";
  if (D.MEDICATION_KEYS.some((k) => clause.includes(k))) return "medication";
  if (D.CHANGE_KEYS.some((k) => clause.includes(k))) return "progress";
  if (D.CONTEXT_KEYS.some((k) => clause.includes(k))) return "context";
  if (D.DEGREE_KEYS.some((k) => clause.includes(k))) return "progress";
  return null;
}

/** 不安の内容から、医師に尋ねる質問文を組み立てる */
function buildQuestions(clause: string): string[] {
  const questions = D.QUESTION_TEMPLATES.filter((t) =>
    t.keys.some((k) => clause.includes(k)),
  ).map((t) => t.question);
  return questions.slice(0, 3);
}

/* ------------------------------------------------------------------ */
/* 伝え忘れ防止メモ                                                    */
/* ------------------------------------------------------------------ */

function buildReminders(sections: MemoSection[], rawInput: string): string[] {
  const isEmpty = (id: SectionId) =>
    (sections.find((s) => s.id === id)?.items.length ?? 0) === 0;
  const items: string[] = [];

  if (isEmpty("onset")) {
    items.push("症状が始まった時期（「◯日前から」）を思い出しておく");
  }
  if (isEmpty("progress")) {
    items.push("症状が強くなる時間帯や場面があるか、振り返っておく");
  }
  if (isEmpty("medication")) {
    items.push("飲んだ薬（市販薬も）と持病を確認しておく。「特になし」も伝える");
  }
  if (isEmpty("context")) {
    items.push("睡眠・食事・仕事など、思い当たることがないか振り返る");
  }
  if (!rawInput.includes("アレルギー")) {
    items.push("アレルギーの有無を伝える（なければ「なし」と伝える）");
  }
  items.push("お薬手帳・保険証・（あれば）これまでの検査結果を持って行く");
  items.push("聞きたいことは診察の最初に伝えると、聞き忘れを防げます");
  items.push("うまく話せないときは、このメモをそのまま見せても大丈夫です");

  return items.slice(0, 7);
}

/* ------------------------------------------------------------------ */
/* 小さなユーティリティ                                                */
/* ------------------------------------------------------------------ */

function addItem(sections: MemoSection[], id: SectionId, item: string): void {
  const text = item.trim();
  if (!text) return;
  const section = sections.find((s) => s.id === id);
  if (!section || section.items.includes(text)) return;
  section.items.push(text);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
