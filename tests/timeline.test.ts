import { describe, expect, it } from "vitest";
import { extractTimeline, isGroundedTimelineEntry } from "@/lib/timeline";

describe("症状経過タイムライン", () => {
  it("入力に書かれた時期だけを、書かれた順に並べる", () => {
    const input =
      "3日前から喉に違和感があった。昨日の夜に喉の痛みが強くなった。今朝は熱っぽさを感じた。";
    expect(extractTimeline(input)).toEqual([
      { time: "3日前から", text: "喉に違和感があった" },
      // 文頭の時期表現と、そのあとの助詞だけを取り除く
      { time: "昨日の夜", text: "喉の痛みが強くなった" },
      { time: "今朝", text: "熱っぽさを感じた" },
    ]);
  });

  it("時期の表現が無ければ空（無理に作らない）", () => {
    expect(extractTimeline("なんとなくしんどい。頭が重い感じがする。")).toEqual([]);
    expect(extractTimeline("")).toEqual([]);
  });

  it("日付・時刻を推測しない（time は必ず入力に現れた文字列）", () => {
    const input = "3日前から胃が重い。昨日は食欲がなかった。";
    for (const entry of extractTimeline(input)) {
      expect(input).toContain(entry.time.replace(/から$/, ""));
      expect(entry.time).not.toMatch(/\d{4}[/-]\d{1,2}/);
    }
  });

  it("並べ替えない（入力の順序をそのまま保つ）", () => {
    const entries = extractTimeline("今朝から咳が出る。3日前から喉が痛い。");
    expect(entries.map((entry) => entry.time)).toEqual(["今朝から", "3日前から"]);
  });

  it("同じ内容は重ねない", () => {
    const entries = extractTimeline("昨日から頭痛がある。昨日から頭痛がある。");
    expect(entries).toHaveLength(1);
  });

  it("時期しか書かれていない文は、文ごと残す", () => {
    expect(extractTimeline("3日前から。")).toEqual([{ time: "3日前から", text: "3日前から" }]);
  });

  describe("入力に根拠があるかの判定（AIの応答の検証に使う）", () => {
    const input = "昨日の夜から喉が痛い。";

    it("入力にある時期は通す", () => {
      expect(isGroundedTimelineEntry({ time: "昨日の夜", text: "喉が痛い" }, input)).toBe(true);
      expect(isGroundedTimelineEntry({ time: "昨日の夜から", text: "喉が痛い" }, input)).toBe(true);
    });

    it("入力に無い時期（AIが作った日付）は落とす", () => {
      expect(isGroundedTimelineEntry({ time: "2026/07/25", text: "喉が痛い" }, input)).toBe(false);
      expect(isGroundedTimelineEntry({ time: "1週間前", text: "喉が痛い" }, input)).toBe(false);
    });

    it("空の内容は落とす", () => {
      expect(isGroundedTimelineEntry({ time: "", text: "喉が痛い" }, input)).toBe(false);
      expect(isGroundedTimelineEntry({ time: "昨日の夜", text: "  " }, input)).toBe(false);
    });
  });
});
