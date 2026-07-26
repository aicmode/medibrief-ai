import type { MemoOrganizer, VisitMemo } from "../types";
import { remoteOrganizer } from "./remote";
import { ruleBasedOrganizer } from "./rule-based";

/**
 * 整理ロジックの差し替えポイント。
 *
 * 既定は "rule" （ブラウザ内で完結・APIキー不要・外部送信なし）。
 * AIに差し替えたいときは .env.local に次を書くだけでよい。
 *
 *   NEXT_PUBLIC_MEMO_PROVIDER=api
 *   OPENAI_API_KEY=sk-...
 *
 * "api" のときは /api/organize（サーバー側）を呼ぶ。
 * APIキーが無い・失敗したときはサーバー側でルールベースに戻すので、
 * どちらの設定でもアプリは必ず動く。
 */
export type ProviderKind = "rule" | "api";

export const PROVIDER: ProviderKind =
  process.env.NEXT_PUBLIC_MEMO_PROVIDER === "api" ? "api" : "rule";

const ORGANIZERS: Record<ProviderKind, MemoOrganizer> = {
  rule: ruleBasedOrganizer,
  api: remoteOrganizer,
};

export function getOrganizer(): MemoOrganizer {
  return ORGANIZERS[PROVIDER];
}

/** 入力が端末の外に出ないかどうか（画面の説明文で使う） */
export function isLocalOnly(): boolean {
  return PROVIDER === "rule";
}

export async function organizeMemo(input: string): Promise<VisitMemo> {
  return getOrganizer().organize(input);
}

export { organizeWithRules, ruleBasedOrganizer } from "./rule-based";
