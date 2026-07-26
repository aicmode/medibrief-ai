import { SECTION_META } from "../sections";
import { SECTION_IDS, type MemoOrganizer, type MemoSection, type VisitMemo } from "../types";
import { organizeWithRules } from "./rule-based";

/**
 * サーバー側（/api/organize）に整理を任せる実装。
 * AI に差し替えるときの窓口になる。返り値の形が壊れていたら、
 * その場でルールベースに戻すので画面が空になることはない。
 */
export const remoteOrganizer: MemoOrganizer = {
  name: "api",
  organize: async (input) => {
    try {
      const res = await fetch("/api/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) throw new Error(`整理APIの応答が異常です (${res.status})`);
      return parseVisitMemo(await res.json());
    } catch (error) {
      console.warn("[MediBrief] APIでの整理に失敗したためルールベースに切り替えます", error);
      const fallback = organizeWithRules(input);
      return { ...fallback, provider: "rule-based (fallback)" };
    }
  },
};

/** 外から来たJSONを、画面が期待する形に整える（欠けている項目は空で補う） */
export function parseVisitMemo(value: unknown): VisitMemo {
  if (typeof value !== "object" || value === null) {
    throw new Error("整理結果がオブジェクトではありません");
  }
  const raw = value as { sections?: unknown; provider?: unknown };
  if (!Array.isArray(raw.sections)) {
    throw new Error("整理結果に sections がありません");
  }

  const incoming = new Map<string, string[]>();
  for (const section of raw.sections) {
    if (typeof section !== "object" || section === null) continue;
    const { id, items } = section as { id?: unknown; items?: unknown };
    if (typeof id !== "string" || !Array.isArray(items)) continue;
    incoming.set(
      id,
      items.filter((item): item is string => typeof item === "string" && item.trim() !== ""),
    );
  }

  const sections: MemoSection[] = SECTION_IDS.map((id) => ({
    id,
    title: SECTION_META[id].title,
    hint: SECTION_META[id].hint,
    emptyGuide: SECTION_META[id].emptyGuide,
    items: (incoming.get(id) ?? []).map((item) => item.trim()),
  }));

  return {
    sections,
    provider: typeof raw.provider === "string" ? raw.provider : "api",
    generatedAt: new Date().toISOString(),
  };
}
