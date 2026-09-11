import { MAX_INPUT_LENGTH } from "@/lib/limits";
import { parseVisitMemo } from "@/lib/organizer/remote";
import { organizeWithRules } from "@/lib/organizer/rule-based";
import { SECTION_META } from "@/lib/sections";
import { SECTION_IDS } from "@/lib/types";

/**
 * 受診メモ整理API。
 *
 * ・OPENAI_API_KEY があれば AI で整理する
 * ・キーが無い／AIが失敗した／応答の形が壊れていた ときはルールベースの結果を返す
 *   （どの経路でも 200 で受診メモを返し、provider でどちらを使ったか伝える）
 * ・APIキーはサーバー側だけで読む。クライアントには渡さない。
 * ・別のAIサービスに変えたいときは callOpenAI() だけ差し替えればよい。
 */

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OPENAI_TIMEOUT_MS = 20_000;

/** AI に渡す指示。禁止事項をここで明示する。 */
const SYSTEM_PROMPT = [
  "あなたは、患者が書いた体調のメモを、診察で医師に伝えやすい形に整理する編集者です。",
  "整理だけを行います。次のことは絶対にしてはいけません。",
  "- 病名や原因を推測・断定する（「〜の可能性があります」も禁止）",
  "- 薬・サプリ・治療法を提案する",
  "- 緊急度や重症度を判定する（「すぐ受診すべき」「様子見でよい」などを書かない）",
  "- 受診する診療科を決める",
  "- 入力に無い症状・事実・日付を足す",
  "書き換えは、患者の言葉を分かりやすい表現に整えるところまでに留めます。",
  "「医師に聞きたいこと」は、患者が医師に尋ねる質問文の形で書きます（答えは書かない）。",
  "",
  "出力は次のキーを持つJSONのみ。",
  '{"sections":[{"id":"<項目ID>","items":["箇条書き", ...]}, ...],"timeline":[{"time":"時期の表現","text":"そのとき何があったか"}, ...]}',
  "項目IDと意味は以下のとおり。",
  ...SECTION_IDS.map((id) => `- ${id}: ${SECTION_META[id].title}（${SECTION_META[id].hint}）`),
  "該当する内容が無い項目は items を空配列にします。",
  "",
  "timeline は症状の経過です。次を必ず守ってください。",
  "- time には入力に書かれている時期の表現をそのまま使う（例：「3日前」「昨日の夜」「今朝」）",
  "- 実際の日付・時刻に変換しない。書かれていない時期を作らない",
  "- 入力に時期の表現が無ければ timeline は空配列にする",
  "- 入力に書かれた順のまま並べる（前後関係が書かれていないものを並べ替えない）",
].join("\n");

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  const input =
    typeof payload === "object" && payload !== null
      ? (payload as { input?: unknown }).input
      : undefined;

  if (typeof input !== "string" || input.trim() === "") {
    return Response.json({ error: "input（症状のメモ）が必要です" }, { status: 400 });
  }
  if (input.length > MAX_INPUT_LENGTH) {
    return Response.json(
      { error: `入力は${MAX_INPUT_LENGTH}文字までにしてください` },
      { status: 413 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // APIキー無しでも使えるようにする、というのがこのアプリの前提
    return Response.json({
      ...organizeWithRules(input),
      provider: "rule-based (no API key)",
    });
  }

  try {
    const memo = parseVisitMemo(await callOpenAI(input, apiKey), input);
    return Response.json({ ...memo, provider: `ai (${MODEL})` });
  } catch (error) {
    // 失敗の理由はサーバーログにだけ残す（入力内容は出さない）
    console.warn(
      "[MediBrief] AI整理に失敗したためルールベースで返します:",
      error instanceof Error ? error.message : String(error),
    );
    return Response.json({
      ...organizeWithRules(input),
      provider: "rule-based (fallback)",
    });
  }
}

async function callOpenAI(input: string, apiKey: string): Promise<unknown> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: input },
      ],
    }),
    signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("AIの応答が空です");
  return JSON.parse(content);
}
