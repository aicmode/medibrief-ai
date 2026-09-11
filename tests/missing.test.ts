import { describe, expect, it } from "vitest";
import { findMissingInfo } from "@/lib/missing";
import { organizeWithRules } from "@/lib/organizer/rule-based";

const missingIds = (input: string): string[] =>
  findMissingInfo(organizeWithRules(input)).map((info) => info.id);

describe("不足情報チェック", () => {
  it("何も書かれていない項目を挙げる", () => {
    const ids = missingIds("なんとなくしんどい");
    expect(ids).toContain("onset");
    expect(ids).toContain("progress");
    expect(ids).toContain("medication");
    expect(ids).toContain("allergy");
    expect(ids).toContain("history");
  });

  it("書かれている項目は挙げない", () => {
    const ids = missingIds(
      "3日前から胃が重い。だんだん強くなっている。市販の胃薬を飲んだ。通院中の病気はない。アレルギーはない。仕事が忙しい。医師に聞きたいことがある。",
    );
    expect(ids).not.toContain("onset");
    expect(ids).not.toContain("progress");
    expect(ids).not.toContain("medication");
    expect(ids).not.toContain("allergy");
    expect(ids).not.toContain("history");
    expect(ids).not.toContain("context");
  });

  it("不足項目は「質問」であって、答えや判断を含まない", () => {
    for (const info of findMissingInfo(organizeWithRules("なんとなくしんどい"))) {
      expect(info.question).toContain("？");
      expect(info.question).not.toContain("可能性");
      expect(info.placeholder).toContain("例）");
    }
  });

  it("「特になし」と書かれていれば、薬の不足としない", () => {
    expect(missingIds("頭が痛い。飲んでいる薬は特になし。")).not.toContain("medication");
  });
});
