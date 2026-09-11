import type { VisitMemo } from "./types";

/** 画面・コピー用テキストの両方で使う注意書き */
export const DISCLAIMER =
  "診断ではありません。強い症状や不安がある場合は医療機関へ相談してください。";

/** 症状経過タイムラインの見出し（画面・コピー・印刷で共通） */
export const TIMELINE_TITLE = "症状の経過";

/** タイムラインの並び順についての説明（推測していないことを明示する） */
export const TIMELINE_NOTE = "入力に書かれた順に並べています。日付や時刻は推測していません。";

/** 2026/07/26 10:30 の形にする（端末のタイムゾーンで表示） */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/**
 * 受診メモをコピー・印刷用のプレーンテキストにする。
 * 画面で編集した内容・タイムラインがそのまま反映される。
 */
export function memoToPlainText(memo: VisitMemo): string {
  const blocks = memo.sections.map((section) => {
    // 編集途中の空行はテキストに出さない
    const items = section.items.map((item) => item.trim()).filter((item) => item !== "");
    const lines = items.length > 0 ? items.map((item) => `・${item}`) : ["・（未記入）"];
    return [`■ ${section.title}`, ...lines].join("\n");
  });

  if (memo.timeline.length > 0) {
    blocks.push(
      [
        `■ ${TIMELINE_TITLE}（${TIMELINE_NOTE}）`,
        ...memo.timeline.map((entry) => `・${entry.time}：${entry.text}`),
      ].join("\n"),
    );
  }

  return [
    `【受診メモ】${formatDateTime(memo.generatedAt)} 作成`,
    "",
    blocks.join("\n\n"),
    "",
    "----------",
    `※ このメモは MediBrief（受診メモ整理ツール）で作成しました。${DISCLAIMER}`,
  ].join("\n");
}

/** 履歴一覧などで使う、メモの短い見出し */
export function memoTitle(memo: VisitMemo): string {
  const mainConcern = memo.sections.find((section) => section.id === "mainConcern");
  const fromSection = mainConcern?.items.slice(0, 2).join("・");
  if (fromSection) return truncateLabel(fromSection);

  const fromInput = memo.sourceInput.replace(/\s+/g, " ").trim();
  return fromInput ? truncateLabel(fromInput) : "受診メモ";
}

function truncateLabel(text: string): string {
  return text.length > 28 ? `${text.slice(0, 28)}…` : text;
}
