import type { VisitMemo } from "./types";

/** 画面・コピー用テキストの両方で使う注意書き */
export const DISCLAIMER =
  "診断ではありません。強い症状や不安がある場合は医療機関へ相談してください。";

/** 2026/07/26 10:30 の形にする（端末のタイムゾーンで表示） */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** 受診メモをコピー・印刷用のプレーンテキストにする */
export function memoToPlainText(memo: VisitMemo): string {
  const blocks = memo.sections.map((section) => {
    const lines =
      section.items.length > 0
        ? section.items.map((item) => `・${item}`)
        : ["・（未記入）"];
    return [`■ ${section.title}`, ...lines].join("\n");
  });

  return [
    `【受診メモ】${formatDateTime(memo.generatedAt)} 作成`,
    "",
    blocks.join("\n\n"),
    "",
    "----------",
    `※ このメモは MediBrief（受診メモ整理ツール）で作成しました。${DISCLAIMER}`,
  ].join("\n");
}
