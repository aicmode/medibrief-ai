import { describe, expect, it } from "vitest";
import { SYMPTOM_EXAMPLES } from "@/lib/examples";
import { organizeWithRules } from "@/lib/organizer/rule-based";
import { splitClauses } from "@/lib/organizer/text";
import { SECTION_IDS, type SectionId, type VisitMemo } from "@/lib/types";

const items = (memo: VisitMemo, id: SectionId): string[] =>
  memo.sections.find((section) => section.id === id)?.items ?? [];

const allItems = (memo: VisitMemo): string[] =>
  memo.sections.flatMap((section) => section.items);

describe("ルールベース整理", () => {
  it("7項目をこの順で返し、整理に使った情報を残す", () => {
    const memo = organizeWithRules("昨日から頭が痛い。");
    expect(memo.sections.map((section) => section.id)).toEqual([...SECTION_IDS]);
    expect(memo.provider).toBe("rule-based");
    expect(memo.sourceInput).toBe("昨日から頭が痛い。");
    expect(() => new Date(memo.generatedAt).toISOString()).not.toThrow();
  });

  it("例1：症状を言い換え、時期・薬・質問を振り分ける", () => {
    const memo = organizeWithRules(SYMPTOM_EXAMPLES[0].text);
    expect(items(memo, "mainConcern")).toContain("のどの痛み");
    expect(items(memo, "mainConcern")).toContain("熱っぽさ・発熱");
    expect(items(memo, "onset")).toContain("昨日の夜から：のどの痛み");
    expect(items(memo, "onset")).toContain("今朝から：熱っぽさ・発熱");
    expect(items(memo, "medication")).toContain("市販の風邪薬を飲んだ");
    expect(items(memo, "questions").length).toBeGreaterThan(0);
  });

  it("例2：否定表現を症状として拾わず、書かれたまま残す", () => {
    const memo = organizeWithRules(SYMPTOM_EXAMPLES[1].text);
    expect(items(memo, "mainConcern")).toContain("吐いてはいない");
    expect(items(memo, "context")).toContain("最近ストレスが多い");
    expect(items(memo, "onset")).toContain("3日前から：胃の重さ・痛み");
  });

  it("例3：変化の表現を「症状の変化」に入れ、薬の名前を症状と読み違えない", () => {
    const memo = organizeWithRules(SYMPTOM_EXAMPLES[2].text);
    expect(items(memo, "progress")).toContain("朝より夕方に強い");
    expect(items(memo, "medication")).toContain("痛み止めを飲むと少し楽になる");
    // 「痛み止め」は薬なので、症状の「痛み」として拾わない
    expect(items(memo, "mainConcern")).not.toContain("痛み");
  });

  it("辞書に無い言い方でも、入力した文はどこかの項目に必ず残る", () => {
    const memo = organizeWithRules("なんとなくしんどい");
    expect(allItems(memo).join("\n")).toContain("なんとなくしんどい");
  });

  it("入力例3つとも、すべての文がどこかの項目に残る", () => {
    for (const example of SYMPTOM_EXAMPLES) {
      const memo = organizeWithRules(example.text);
      const joined = allItems(memo).join("\n");
      for (const clause of splitClauses(example.text)) {
        const symptomWasRephrased = joined.includes(clause);
        const timeWasExtracted = items(memo, "onset").some((item) =>
          clause.includes(item.split("：")[0].replace(/から$/, "")),
        );
        expect(symptomWasRephrased || timeWasExtracted).toBe(true);
      }
    }
  });

  it("空入力・空白のみでも落ちない", () => {
    for (const input of ["", "   ", "\n\n", "。、"]) {
      const memo = organizeWithRules(input);
      expect(memo.sections).toHaveLength(SECTION_IDS.length);
      expect(memo.timeline).toEqual([]);
    }
  });

  it("とても長い入力でも落ちない", () => {
    const memo = organizeWithRules("喉が痛い。".repeat(500));
    expect(items(memo, "mainConcern")).toContain("のどの痛み");
  });

  it("病名・薬の提案・緊急度の判定を出力しない", () => {
    const banned = ["可能性があります", "疑われます", "すぐに受診", "至急", "危険", "服用してください", "おすすめの薬"];
    for (const example of SYMPTOM_EXAMPLES) {
      const text = allItems(organizeWithRules(example.text)).join("\n");
      for (const word of banned) expect(text).not.toContain(word);
    }
  });
});
