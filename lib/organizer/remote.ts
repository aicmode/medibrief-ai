import type { MemoOrganizer, VisitMemo } from "../types";
import { organizeWithRules } from "./rule-based";
import { normalizeVisitMemo } from "./validate";

/**
 * サーバー側（/api/organize）に整理を任せる実装。AI整理の窓口。
 *
 * 応答の形が壊れていたら、その場でルールベースに戻すので画面が空になることはない。
 * ネットワーク障害・タイムアウト・JSON不正のいずれでも同じ経路でフォールバックする。
 */
export const REMOTE_TIMEOUT_MS = 25_000;

export const remoteOrganizer: MemoOrganizer = {
  name: "api",
  organize: async (input) => {
    try {
      const res = await fetch("/api/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
        signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`整理APIの応答が異常です (${res.status})`);
      return parseVisitMemo(await res.json(), input);
    } catch (error) {
      // 握り潰さず、フォールバックしたことが分かるログを残す（入力内容は出さない）
      console.warn(
        "[MediBrief] AI整理に失敗したため、この端末内のルールベース整理に切り替えました:",
        error instanceof Error ? error.message : String(error),
      );
      const fallback = organizeWithRules(input);
      return { ...fallback, provider: "rule-based (fallback)" };
    }
  },
};

/**
 * 外から来たJSONを、画面が期待する形に整える。
 * 欠けている項目は空で補い、入力に根拠のないタイムラインは落とす。
 */
export function parseVisitMemo(value: unknown, sourceInput = ""): VisitMemo {
  return normalizeVisitMemo(value, {
    sourceInput,
    fallbackProvider: "api",
  });
}
