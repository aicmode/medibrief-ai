import { describe, expect, it } from "vitest";
import { MAX_ITEMS_PER_SECTION, MAX_ITEM_LENGTH } from "@/lib/limits";
import * as MemoEdit from "@/lib/memo-edit";
import { organizeWithRules } from "@/lib/organizer/rule-based";
import type { SectionId, VisitMemo } from "@/lib/types";

const base = organizeWithRules("昨日の夜から喉が痛い。今朝から熱っぽい。");
const items = (memo: VisitMemo, id: SectionId) =>
  memo.sections.find((section) => section.id === id)?.items ?? [];

describe("受診メモの編集", () => {
  it("書き換えても元のメモを壊さない", () => {
    const before = [...items(base, "mainConcern")];
    const edited = MemoEdit.updateItem(base, "mainConcern", 0, "のどの強い痛み");
    expect(items(base, "mainConcern")).toEqual(before);
    expect(items(edited, "mainConcern")[0]).toBe("のどの強い痛み");
  });

  it("行を追加・削除できる", () => {
    const added = MemoEdit.addItem(base, "context", "寝不足が続いている");
    expect(items(added, "context")).toContain("寝不足が続いている");

    const removed = MemoEdit.removeItem(added, "context", items(added, "context").length - 1);
    expect(items(removed, "context")).not.toContain("寝不足が続いている");
  });

  it("上下に並び替えできる", () => {
    const [first, second] = items(base, "mainConcern");
    const moved = MemoEdit.moveItem(base, "mainConcern", 0, 1);
    expect(items(moved, "mainConcern").slice(0, 2)).toEqual([second, first]);
  });

  it("端を越える並び替えは何もしない", () => {
    expect(items(MemoEdit.moveItem(base, "mainConcern", 0, -1), "mainConcern")).toEqual(
      items(base, "mainConcern"),
    );
    const last = items(base, "mainConcern").length - 1;
    expect(items(MemoEdit.moveItem(base, "mainConcern", last, 1), "mainConcern")).toEqual(
      items(base, "mainConcern"),
    );
  });

  it("範囲外の位置を触っても落ちない", () => {
    expect(() => MemoEdit.updateItem(base, "mainConcern", 99, "x")).not.toThrow();
    expect(() => MemoEdit.removeItem(base, "mainConcern", -1)).not.toThrow();
    expect(() => MemoEdit.moveItem(base, "mainConcern", 99, 1)).not.toThrow();
  });

  it("1項目あたりの行数・文字数に上限がある", () => {
    let memo = base;
    for (let i = 0; i < MAX_ITEMS_PER_SECTION + 5; i += 1) {
      memo = MemoEdit.addItem(memo, "context", `メモ${i}`);
    }
    expect(items(memo, "context").length).toBe(MAX_ITEMS_PER_SECTION);

    const long = MemoEdit.updateItem(base, "mainConcern", 0, "あ".repeat(MAX_ITEM_LENGTH + 100));
    expect(items(long, "mainConcern")[0].length).toBe(MAX_ITEM_LENGTH);
  });

  it("編集を終えると空行と余分な空白が消える", () => {
    const messy = MemoEdit.addItem(
      MemoEdit.updateItem(base, "mainConcern", 0, "  のどの痛み  "),
      "context",
      "   ",
    );
    const tidied = MemoEdit.tidyMemo(messy);
    expect(items(tidied, "mainConcern")[0]).toBe("のどの痛み");
    expect(items(tidied, "context")).not.toContain("");
  });

  it("7つの大分類は増減しない", () => {
    const edited = MemoEdit.removeItem(MemoEdit.addItem(base, "questions", "質問"), "onset", 0);
    expect(edited.sections.map((s) => s.id)).toEqual(base.sections.map((s) => s.id));
  });
});
