import { describe, expect, it } from "vitest";
import { collectFinalTranscript, describeSpeechError, getSpeechRecognitionCtor } from "@/lib/speech";

describe("音声入力の補助", () => {
  it("対応していない環境では null を返す（アプリは止めない）", () => {
    expect(getSpeechRecognitionCtor()).toBeNull();
  });

  it("マイク拒否は、次にどうすればよいか分かる案内にする", () => {
    const message = describeSpeechError("not-allowed");
    expect(message).toContain("マイク");
    expect(message).toContain("キーボード入力");
  });

  it("中断は案内を出さない（エラー扱いにしない）", () => {
    expect(describeSpeechError("aborted")).toBe("");
  });

  it("知らないエラーでも案内を返す", () => {
    expect(describeSpeechError("something-new")).not.toBe("");
  });

  it("確定した文章だけを取り出す", () => {
    const event = {
      resultIndex: 0,
      results: [
        { isFinal: true, 0: { transcript: "昨日から喉が痛い。" } },
        { isFinal: false, 0: { transcript: "熱っぽ" } },
      ],
    };
    expect(collectFinalTranscript(event)).toBe("昨日から喉が痛い。");
  });

  it("確定した文章が無ければ空文字", () => {
    const event = {
      resultIndex: 0,
      results: [{ isFinal: false, 0: { transcript: "えっと" } }],
    };
    expect(collectFinalTranscript(event)).toBe("");
  });
});
