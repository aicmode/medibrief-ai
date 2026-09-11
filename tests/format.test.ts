import { describe, expect, it } from "vitest";
import { DISCLAIMER, formatDateTime, memoTitle, memoToPlainText } from "@/lib/format";
import * as MemoEdit from "@/lib/memo-edit";
import { organizeWithRules } from "@/lib/organizer/rule-based";

const memo = organizeWithRules(
  "昨日の夜から喉が痛くて、今朝から少し熱っぽい。市販の風邪薬を飲んだ。",
);

describe("コピー用テキスト", () => {
  it("見出し・作成日時・注意書きを含む", () => {
    const text = memoToPlainText(memo);
    expect(text).toContain("【受診メモ】");
    expect(text).toContain(formatDateTime(memo.generatedAt));
    expect(text).toContain(DISCLAIMER);
    for (const section of memo.sections) expect(text).toContain(`■ ${section.title}`);
  });

  it("タイムラインも含む", () => {
    const text = memoToPlainText(memo);
    expect(text).toContain("■ 症状の経過");
    expect(text).toContain("昨日の夜から：喉が痛くて");
  });

  it("タイムラインが無ければ、その見出しは出さない", () => {
    const plain = organizeWithRules("なんとなくしんどい");
    expect(memoToPlainText(plain)).not.toContain("■ 症状の経過");
  });

  it("編集した内容がそのまま反映される", () => {
    const edited = MemoEdit.updateItem(memo, "mainConcern", 0, "のどの強い痛み");
    const text = memoToPlainText(edited);
    expect(text).toContain("・のどの強い痛み");
    expect(text).not.toContain("・のどの痛み\n");
  });

  it("追加・削除も反映される", () => {
    const added = MemoEdit.addItem(memo, "questions", "仕事を休んだほうがよいですか？");
    expect(memoToPlainText(added)).toContain("・仕事を休んだほうがよいですか？");

    const removed = MemoEdit.removeItem(added, "mainConcern", 0);
    expect(memoToPlainText(removed)).not.toContain("・のどの痛み");
  });

  it("編集途中の空行は出さない", () => {
    const withBlank = MemoEdit.addItem(memo, "context", "   ");
    expect(memoToPlainText(withBlank)).not.toContain("・   ");
  });

  it("項目が空なら「（未記入）」と書く", () => {
    const empty = organizeWithRules("なんとなくしんどい");
    expect(memoToPlainText(empty)).toContain("・（未記入）");
  });

  it("日時の変換が壊れた文字列でも落ちない", () => {
    expect(formatDateTime("not-a-date")).toBe("");
  });
});

describe("履歴の見出し", () => {
  it("主な困りごとから作る", () => {
    expect(memoTitle(memo)).toContain("のどの痛み");
  });

  it("主な困りごとが空なら入力から作る", () => {
    const empty = { ...memo, sections: memo.sections.map((s) => ({ ...s, items: [] })) };
    expect(memoTitle(empty)).toContain("昨日の夜から");
  });

  it("何も無ければ既定の見出し", () => {
    const blank = { ...memo, sections: memo.sections.map((s) => ({ ...s, items: [] })), sourceInput: "" };
    expect(memoTitle(blank)).toBe("受診メモ");
  });
});
