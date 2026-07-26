import { parseVisitMemo } from "@/lib/organizer/remote";
import { organizeWithRules } from "@/lib/organizer/rule-based";
import { SECTION_META } from "@/lib/sections";
import { SECTION_IDS } from "@/lib/types";

/**
 * 受診メモ整理API（任意）。
 *
 * OPENAI_API_KEY が無いときはルールベースの結果をそのまま返す。
 * つまりAPIキー無しでもこのエンドポイントは動く。
 * AI を別のサービスに変えたいときは callOpenAI() だけ差し替えればよい。
 */

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/** AI に渡す指示。禁止事項をここで明示する。 */
const SYSTEM_PROMPT = [
  "あなたは、患者が書いた体調のメモを、診察で医師に伝えやすい形に整理する編集者です。",
  "整理だけを行います。次のことは絶対にしてはいけません。",
  "- 病名や原因を推測・断定する",
  "- 薬や治療法を提案する",
  "- 緊急度や重症度を判定する（「すぐ受診すべき」などの判断を書かない）",
  "- 入力に無い症状・事実を足す",
  "書き換えは、患者の言葉を分かりやすい表現に整えるところまでに留めます。",
  "「医師に聞きたいこと」は、患者が医師に尋ねる質問文の形で書きます（答えは書かない）。",
  "",
  "出力は次のキーを持つJSONのみ。",
  '{"sections":[{"id":"<項目ID>","items":["箇条書き", ...]}, ...]}',
  "項目IDと意味は以下のとおり。",
  ...SECTION_IDS.map((id) => `- ${id}: ${SECTION_META[id].title}（${SECTION_META[id].hint}）`),
  "該当する内容が無い項目は items を空配列にします。",
].join("\n");

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = (await request.json())?.input;
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }
  if (typeof input !== "string" || input.trim() === "") {
    return Response.json({ error: "input（症状のメモ）が必要です" }, { status: 400 });
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
    const memo = parseVisitMemo(await callOpenAI(input, apiKey));
    return Response.json({ ...memo, provider: `ai (${MODEL})` });
  } catch (error) {
    console.warn("[MediBrief] AI整理に失敗したためルールベースで返します", error);
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
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("AIの応答が空です");
  return JSON.parse(content);
}
