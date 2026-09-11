/**
 * MediBrief の中心となる型定義。
 *
 * 受診メモは「7つの項目（セクション）」＋「症状経過タイムライン」で表現する。
 * 整理ロジック（ルールベース / AI）は、どちらもこの形を返す。
 */

export const SECTION_IDS = [
  "mainConcern",
  "onset",
  "progress",
  "context",
  "medication",
  "questions",
  "reminders",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/** 「伝え忘れ防止メモ」以外の、ユーザー入力から作られる項目 */
export const CORE_SECTION_IDS = SECTION_IDS.filter(
  (id) => id !== "reminders",
) as readonly Exclude<SectionId, "reminders">[];

export type MemoSection = {
  id: SectionId;
  /** 画面とコピー用テキストに出す見出し */
  title: string;
  /** この項目が何のためにあるかの短い説明 */
  hint: string;
  /** 箇条書きの中身 */
  items: string[];
  /**
   * items が空のときに表示する記入ガイド。
   * 症状の推測や病名には触れず、「何を書き足すと伝わりやすいか」だけを案内する。
   */
  emptyGuide: string;
};

/**
 * 症状経過タイムラインの1行。
 *
 * time は「入力にそのまま書かれていた時期の表現」だけを入れる。
 * 日付・時刻の推測はしない（"3日前" を実日付に変換したりしない）。
 */
export type TimelineEntry = {
  /** 入力に現れた時期の表現（例: 「昨日の夜から」「3日前」） */
  time: string;
  /** そのとき何があったか（入力の言葉のまま） */
  text: string;
};

export type VisitMemo = {
  sections: MemoSection[];
  /** 入力から抜き出せた時系列。抜き出せなければ空配列。 */
  timeline: TimelineEntry[];
  /** 整理に使ったロジックの名前（例: "rule-based"、"ai (gpt-4o-mini)"） */
  provider: string;
  /** 生成時刻（ISO 8601） */
  generatedAt: string;
  /** 整理のもとになった自由入力。再整理・履歴の復元に使う。 */
  sourceInput: string;
};

/**
 * 整理ロジックの差し替えポイント。
 * ルールベースでもAPI経由でも、この形に合わせれば画面側は変更不要。
 */
export interface MemoOrganizer {
  readonly name: string;
  organize(input: string): Promise<VisitMemo>;
}
