import type { MemoOrganizer, VisitMemo } from "../types";
import { remoteOrganizer } from "./remote";
import { ruleBasedOrganizer } from "./rule-based";

/**
 * 整理ロジックの差し替えポイント。
 *
 * 整理方式は2つ。どちらを使うかはユーザーが画面で選べる。
 *
 *   local … この端末（ブラウザ）の中だけで整理する。外部送信なし。APIキー不要。
 *   ai    … /api/organize（サーバー）経由でAIに整理させる。入力は外部APIへ送信される。
 *
 * 既定値は環境変数 NEXT_PUBLIC_MEMO_PROVIDER（rule / api）で決まる。
 * ai を選んでも、APIキーが無い・呼び出しに失敗したときはルールベースに戻るので、
 * どちらの設定でもアプリは必ず動く。
 */
export type MemoMode = "local" | "ai";

/** 旧APIとの互換のために残している別名（rule = local / api = ai） */
export type ProviderKind = "rule" | "api";

export const PROVIDER: ProviderKind =
  process.env.NEXT_PUBLIC_MEMO_PROVIDER === "api" ? "api" : "rule";

/** 環境変数だけで決まる既定の整理方式（APIキーの有無を見ない版） */
export const DEFAULT_MODE: MemoMode = PROVIDER === "api" ? "ai" : "local";

/**
 * 画面を開いたときに選ばれている整理方式。
 *
 * ・サーバーにAPIキーがあれば AI整理を既定にする（AI整理を主機能として扱う）
 * ・NEXT_PUBLIC_MEMO_PROVIDER=rule が明示されていれば、必ず端末内整理から始める
 * ・APIキーが無ければ端末内整理（AIは選べない）
 *
 * どちらの場合も、ユーザーは画面でいつでも切り替えられる。
 */
export function resolveDefaultMode(aiConfigured: boolean): MemoMode {
  if (process.env.NEXT_PUBLIC_MEMO_PROVIDER === "rule") return "local";
  return aiConfigured ? "ai" : "local";
}

const ORGANIZERS: Record<MemoMode, MemoOrganizer> = {
  local: ruleBasedOrganizer,
  ai: remoteOrganizer,
};

export function getOrganizer(mode: MemoMode = DEFAULT_MODE): MemoOrganizer {
  return ORGANIZERS[mode];
}

/** 入力が端末の外に出ないかどうか（画面の説明文で使う） */
export function isLocalOnly(mode: MemoMode = DEFAULT_MODE): boolean {
  return mode === "local";
}

export async function organizeMemo(
  input: string,
  mode: MemoMode = DEFAULT_MODE,
): Promise<VisitMemo> {
  return getOrganizer(mode).organize(input);
}

/**
 * provider 文字列（"rule-based" / "ai (gpt-4o-mini)" など）を、
 * 画面に出す短いラベルに言い換える。
 * 実際に何で整理されたかを、ユーザーに正しく伝えるためのもの。
 */
export type ProviderBadge = {
  kind: "ai" | "local" | "fallback";
  label: string;
  detail: string;
};

export function describeProvider(provider: string): ProviderBadge {
  if (provider.startsWith("ai")) {
    return {
      kind: "ai",
      label: "AI整理",
      detail: `AI（${provider.replace(/^ai\s*\(?|\)$/g, "") || "外部API"}）が整理しました。`,
    };
  }
  if (provider.includes("no API key")) {
    return {
      kind: "fallback",
      label: "ローカル整理",
      detail: "AIのキーが設定されていないため、ルールベースで整理しました。",
    };
  }
  if (provider.includes("fallback")) {
    return {
      kind: "fallback",
      label: "ローカル整理",
      detail: "AI整理に失敗したため、ルールベースで整理しました。",
    };
  }
  return {
    kind: "local",
    label: "ローカル整理",
    detail: "この端末の中だけで整理しました（外部送信なし）。",
  };
}

export { organizeWithRules, ruleBasedOrganizer } from "./rule-based";
