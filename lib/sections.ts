import { SECTION_IDS, type MemoSection, type SectionId } from "./types";

/**
 * 各項目の見出し・説明・空欄ガイド。
 * ここは「診断」ではなく「書き方の案内」に徹する。
 */
export const SECTION_META: Record<
  SectionId,
  { title: string; hint: string; emptyGuide: string }
> = {
  mainConcern: {
    title: "主な困りごと",
    hint: "いちばん困っていること。診察の最初に伝えます。",
    emptyGuide:
      "どこが、どのように気になるかを書き足すと伝わりやすくなります（例：のどが痛い／胃が重い）。",
  },
  onset: {
    title: "いつから",
    hint: "始まった時期。「◯日前から」と言えると医師が経過を追いやすくなります。",
    emptyGuide:
      "「昨日の夜から」「3日前から」のように、気になり始めた時期を書き足しましょう。",
  },
  progress: {
    title: "症状の変化",
    hint: "強さの変化や、つらい時間帯・場面。",
    emptyGuide:
      "「だんだん強くなる」「朝より夕方がつらい」など、変化があれば書き足しましょう。",
  },
  context: {
    title: "関係ありそうなこと",
    hint: "思い当たる生活の状況。原因を決めつけるものではありません。",
    emptyGuide:
      "睡眠・食事・仕事・ストレスなど、心当たりがあれば書き足しましょう。",
  },
  medication: {
    title: "服薬・持病・アレルギー",
    hint: "飲んだ薬、通院中の病気、アレルギー。診察でよく聞かれます。",
    emptyGuide:
      "飲んだ薬（市販薬も）、通院中の病気、アレルギーの有無を書き足しましょう。「特になし」も大切な情報です。",
  },
  questions: {
    title: "医師に聞きたいこと",
    hint: "診察で確認したいこと。最初に伝えると聞き忘れを防げます。",
    emptyGuide:
      "気になっていること・不安なことを、質問の形で書き足しましょう。",
  },
  reminders: {
    title: "伝え忘れ防止メモ",
    hint: "受診前に確認しておくとよいこと。",
    emptyGuide: "",
  },
};

/** 空の（itemsなし）セクション一式を作る。整理ロジックはこれを埋めていく。 */
export function createEmptySections(): MemoSection[] {
  return SECTION_IDS.map((id) => ({
    id,
    title: SECTION_META[id].title,
    hint: SECTION_META[id].hint,
    emptyGuide: SECTION_META[id].emptyGuide,
    items: [],
  }));
}
