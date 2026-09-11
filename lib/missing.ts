/**
 * 不足情報チェック。
 *
 * 「診察でよく聞かれるのに、まだ書かれていないこと」を並べるだけの機能。
 * ここでやらないこと:
 *   - 足りない情報を推測して埋める
 *   - 「◯◯の可能性がある」といった解釈を足す
 *   - 未入力であることを問題・危険として伝える
 * あくまで「確認してみてください」という記入ガイドに留める。
 */

import type { SectionId, VisitMemo } from "./types";

export type MissingInfoId =
  | "onset"
  | "progress"
  | "context"
  | "medication"
  | "history"
  | "allergy"
  | "questions";

export type MissingInfo = {
  id: MissingInfoId;
  /** 関係する受診メモの項目（画面で対応づけを示す） */
  sectionId: SectionId;
  /** 見出し */
  title: string;
  /** ユーザーへの問いかけ */
  question: string;
  /** 追記欄のプレースホルダ（書き方の例。答えの提案ではない） */
  placeholder: string;
};

type Check = {
  info: MissingInfo;
  /** この条件が true のときだけ「不足」として出す */
  isMissing: (memo: VisitMemo, input: string) => boolean;
};

const isSectionEmpty = (memo: VisitMemo, id: SectionId): boolean =>
  (memo.sections.find((section) => section.id === id)?.items.length ?? 0) === 0;

const lacksAll =
  (...keywords: string[]) =>
  (_memo: VisitMemo, input: string): boolean =>
    !keywords.some((keyword) => input.includes(keyword));

const CHECKS: Check[] = [
  {
    info: {
      id: "onset",
      sectionId: "onset",
      title: "いつから",
      question: "いつから症状がありますか？",
      placeholder: "例）3日前から／昨日の夜から",
    },
    isMissing: (memo) => isSectionEmpty(memo, "onset"),
  },
  {
    info: {
      id: "progress",
      sectionId: "progress",
      title: "症状の変化",
      question: "症状は変化していますか？（強くなった・楽になった・時間帯による差）",
      placeholder: "例）朝より夕方がつらい／だんだん強くなっている",
    },
    isMissing: (memo) => isSectionEmpty(memo, "progress"),
  },
  {
    info: {
      id: "context",
      sectionId: "context",
      title: "関係ありそうなこと",
      question: "思い当たる生活の状況はありますか？（睡眠・食事・仕事など）",
      placeholder: "例）寝不足が続いている／残業が多い",
    },
    isMissing: (memo) => isSectionEmpty(memo, "context"),
  },
  {
    info: {
      id: "medication",
      sectionId: "medication",
      title: "飲んでいる薬",
      question: "飲んでいる薬はありますか？（市販薬・サプリも含みます）",
      placeholder: "例）市販の風邪薬を飲んだ／特になし",
    },
    isMissing: (memo) => isSectionEmpty(memo, "medication"),
  },
  {
    info: {
      id: "history",
      sectionId: "medication",
      title: "持病・通院",
      question: "持病や通院中の病気はありますか？",
      placeholder: "例）通院中の病気はなし／血圧の薬で通院中",
    },
    isMissing: lacksAll("持病", "通院", "既往", "治療中", "かかりつけ"),
  },
  {
    info: {
      id: "allergy",
      sectionId: "medication",
      title: "アレルギー",
      question: "アレルギーはありますか？",
      placeholder: "例）アレルギーはなし／薬のアレルギーがある",
    },
    isMissing: lacksAll("アレルギー", "アレルギ"),
  },
  {
    info: {
      id: "questions",
      sectionId: "questions",
      title: "医師に聞きたいこと",
      question: "医師に聞きたいことはありますか？",
      placeholder: "例）仕事を休んだほうがよいか聞きたい",
    },
    isMissing: (memo) => isSectionEmpty(memo, "questions"),
  },
];

/**
 * まだ書かれていない項目を返す。
 * 判定に使うのは「受診メモの項目が空かどうか」と「入力に言葉があるかどうか」だけ。
 */
export function findMissingInfo(memo: VisitMemo): MissingInfo[] {
  const input = memo.sourceInput ?? "";
  return CHECKS.filter((check) => check.isMissing(memo, input)).map(
    (check) => check.info,
  );
}
