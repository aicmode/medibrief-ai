import { describe, expect, it } from "vitest";
import {
  describeProvider,
  getOrganizer,
  isLocalOnly,
  resolveDefaultMode,
} from "@/lib/organizer";

describe("整理方式の選択", () => {
  it("APIキーがあればAI整理、無ければ端末内整理が既定", () => {
    expect(resolveDefaultMode(true)).toBe("ai");
    expect(resolveDefaultMode(false)).toBe("local");
  });

  it("端末内整理だけが「外部に送信しない」", () => {
    expect(isLocalOnly("local")).toBe(true);
    expect(isLocalOnly("ai")).toBe(false);
  });

  it("モードごとに整理ロジックが切り替わる", () => {
    expect(getOrganizer("local").name).toBe("rule-based");
    expect(getOrganizer("ai").name).toBe("api");
  });
});

describe("どちらで整理したかの表示", () => {
  it("AIで整理できたとき", () => {
    const badge = describeProvider("ai (gpt-4o-mini)");
    expect(badge.kind).toBe("ai");
    expect(badge.label).toBe("AI整理");
    expect(badge.detail).toContain("gpt-4o-mini");
  });

  it("AIが失敗してルールベースに戻ったとき、その事実を伝える", () => {
    const badge = describeProvider("rule-based (fallback)");
    expect(badge.kind).toBe("fallback");
    expect(badge.label).toBe("ローカル整理");
    expect(badge.detail).toContain("失敗");
  });

  it("APIキーが無くてルールベースになったとき", () => {
    const badge = describeProvider("rule-based (no API key)");
    expect(badge.kind).toBe("fallback");
    expect(badge.detail).toContain("キーが設定されていない");
  });

  it("最初から端末内で整理したとき", () => {
    const badge = describeProvider("rule-based");
    expect(badge.kind).toBe("local");
    expect(badge.detail).toContain("外部送信なし");
  });
});
