import { describe, expect, it } from "vitest";
import { MAX_ITEMS_PER_SECTION, MAX_ITEM_LENGTH } from "@/lib/limits";
import { parseVisitMemo } from "@/lib/organizer/remote";
import { normalizeVisitMemo } from "@/lib/organizer/validate";
import { SECTION_IDS } from "@/lib/types";

const itemsOf = (memo: { sections: { id: string; items: string[] }[] }, id: string) =>
  memo.sections.find((section) => section.id === id)?.items ?? [];

describe("外部から来た整理結果の検証", () => {
  it("オブジェクトでなければ例外（呼び出し側でルールベースに戻す）", () => {
    expect(() => parseVisitMemo(null)).toThrow();
    expect(() => parseVisitMemo("{}")).toThrow();
    expect(() => parseVisitMemo(42)).toThrow();
  });

  it("sections が無ければ例外", () => {
    expect(() => parseVisitMemo({})).toThrow();
    expect(() => parseVisitMemo({ sections: "のどの痛み" })).toThrow();
  });

  it("欠けている項目は空で補い、7項目の順序を保つ", () => {
    const memo = parseVisitMemo({
      sections: [{ id: "mainConcern", items: ["のどの痛み"] }],
    });
    expect(memo.sections.map((section) => section.id)).toEqual([...SECTION_IDS]);
    expect(itemsOf(memo, "mainConcern")).toEqual(["のどの痛み"]);
    expect(itemsOf(memo, "onset")).toEqual([]);
  });

  it("知らないID・文字列でない項目・空文字・重複を捨てる", () => {
    const memo = parseVisitMemo({
      sections: [
        { id: "diagnosis", items: ["風邪の可能性"] },
        { id: "mainConcern", items: ["のどの痛み", 42, "", "  ", "のどの痛み", null] },
        { id: "onset", items: "3日前" },
      ],
    });
    expect(JSON.stringify(memo)).not.toContain("風邪の可能性");
    expect(itemsOf(memo, "mainConcern")).toEqual(["のどの痛み"]);
    expect(itemsOf(memo, "onset")).toEqual([]);
  });

  it("多すぎる項目・長すぎる項目を切り詰める", () => {
    const memo = parseVisitMemo({
      sections: [
        {
          id: "mainConcern",
          items: [
            "あ".repeat(MAX_ITEM_LENGTH + 50),
            ...Array.from({ length: MAX_ITEMS_PER_SECTION + 10 }, (_, i) => `症状${i}`),
          ],
        },
      ],
    });
    const items = itemsOf(memo, "mainConcern");
    expect(items.length).toBe(MAX_ITEMS_PER_SECTION);
    expect(items[0].length).toBe(MAX_ITEM_LENGTH + 1); // 末尾に「…」が付く
  });

  it("入力に根拠のあるタイムラインだけ残す（AIが作った日付は落とす）", () => {
    const input = "3日前から喉が痛い。";
    const memo = parseVisitMemo(
      {
        sections: [],
        timeline: [
          { time: "3日前", text: "喉が痛い" },
          { time: "2026年7月24日", text: "発症" },
          { time: "1週間前", text: "喉が痛い" },
          { time: 3, text: "喉が痛い" },
        ],
      },
      input,
    );
    expect(memo.timeline).toEqual([{ time: "3日前", text: "喉が痛い" }]);
  });

  it("timeline が無い・壊れていても空配列になる", () => {
    expect(parseVisitMemo({ sections: [] }).timeline).toEqual([]);
    expect(parseVisitMemo({ sections: [], timeline: "昨日" }).timeline).toEqual([]);
  });

  it("provider と生成時刻が壊れていても埋める", () => {
    const memo = parseVisitMemo({ sections: [], provider: 7, generatedAt: "きのう" });
    expect(memo.provider).toBe("api");
    expect(Number.isNaN(new Date(memo.generatedAt).getTime())).toBe(false);
  });

  it("保存データの復元では、データ側の sourceInput を使う", () => {
    const memo = normalizeVisitMemo(
      {
        sections: [{ id: "mainConcern", items: ["のどの痛み"] }],
        timeline: [{ time: "3日前", text: "喉が痛い" }],
        sourceInput: "3日前から喉が痛い。",
        provider: "rule-based",
      },
      { fallbackProvider: "rule-based" },
    );
    expect(memo.sourceInput).toBe("3日前から喉が痛い。");
    expect(memo.timeline).toHaveLength(1);
  });
});
