import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/organize/route";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import { SECTION_IDS } from "@/lib/types";

const post = (body: BodyInit) =>
  POST(
    new Request("http://localhost/api/organize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }),
  );

describe("/api/organize", () => {
  beforeEach(() => {
    // APIキーが無い状態（＝このアプリの既定）を再現する
    vi.stubEnv("OPENAI_API_KEY", "");
  });

  it("JSONが壊れていれば400", async () => {
    const res = await post("これはJSONではない");
    expect(res.status).toBe(400);
  });

  it("input が無ければ400", async () => {
    expect((await post(JSON.stringify({}))).status).toBe(400);
    expect((await post(JSON.stringify({ input: "   " }))).status).toBe(400);
    expect((await post(JSON.stringify({ input: 42 }))).status).toBe(400);
  });

  it("長すぎる入力は413", async () => {
    const res = await post(JSON.stringify({ input: "あ".repeat(MAX_INPUT_LENGTH + 1) }));
    expect(res.status).toBe(413);
  });

  it("APIキーが無ければルールベースの結果を200で返す", async () => {
    const res = await post(JSON.stringify({ input: "昨日の夜から喉が痛い。" }));
    expect(res.status).toBe(200);

    const memo = await res.json();
    expect(memo.provider).toBe("rule-based (no API key)");
    expect(memo.sections.map((section: { id: string }) => section.id)).toEqual([...SECTION_IDS]);
    expect(memo.timeline).toEqual([{ time: "昨日の夜から", text: "喉が痛い" }]);
  });
});
