@AGENTS.md

# MediBrief — このプロジェクトのルール

体調の自由入力を、診察で医師に伝えやすい「受診メモ」に整理するWebアプリ。
受診**前**のメモ整理ツールであり、医療判断は一切しない。

## 絶対にしないこと（最優先）

コード・辞書・文言・プロンプトのすべてに適用する。

- 病名・原因の推測や断定
- 薬やサプリの提案、飲み方の指示
- 緊急度・重症度の判定（「すぐ受診すべき」「様子見でよい」などを出力しない）
- 入力に無い症状や事実の追加
- 診断・治療に見える表現（「〜の可能性があります」も禁止）

やってよいのは次の3つだけ。

1. ユーザーの言葉を、伝わりやすい表現に言い換える（「喉が痛くて」→「のどの痛み」）
2. 内容を7つの項目に振り分ける
3. **医師に尋ねる質問文**を組み立てる（答えは書かない）

## 画面と文言

- 「診断ではありません。強い症状や不安がある場合は医療機関へ相談してください。」を画面から消さない（`lib/format.ts` の `DISCLAIMER`）。同じ文はコピー用テキストにも入れる。
- 不安を煽らない落ち着いた表現にする。警告色（赤）や「危険」「至急」といった語は使わない。
- 配色は白ベース＋薄いグリーン（emerald）とブルー（sky）、文字は slate。ダークモードには反転させない（`app/globals.css` で `color-scheme: light` 固定）。
- 入口はランディングページではなく、すぐ入力できるツール画面。
- スマホ優先。横スクロールを発生させない（長い文は `break-words whitespace-pre-wrap`）。

## 構成

```
app/
  page.tsx                  画面全体（サーバーコンポーネント）
  layout.tsx  globals.css
  api/organize/route.ts     任意のAI経路。APIキーが無ければルールベースを返す
components/                 表示用。状態を持つのは MemoBuilder だけ
lib/
  types.ts                  VisitMemo / MemoSection / MemoOrganizer
  sections.ts               7項目の見出し・説明・空欄ガイド
  format.ts                 コピー用テキスト、注意書き
  examples.ts               入力例3つ
  organizer/
    index.ts                差し替えポイント（getOrganizer / organizeMemo）
    rule-based.ts           既定の整理ロジック（外部送信なし）
    remote.ts               /api/organize を呼ぶ実装 + 応答の検証
    dictionaries.ts         症状の言い換えと振り分けの手がかり語
```

- 整理ロジックを増やすときは `MemoOrganizer` を実装し、`lib/organizer/index.ts` の `ORGANIZERS` に足す。画面側は触らない。
- 項目を増減するときは `lib/types.ts` の `SECTION_IDS` と `lib/sections.ts` の `SECTION_META` を両方直す。
- 辞書に語を足すときは、症状の**言い換え**にとどめる。病名を足さない。

## 開発

```bash
npm run dev     # http://localhost:3000
npm run lint    # eslint（React Compiler のルールが有効。effect内での setState は不可）
npm run build   # 型チェックを含む
```

## 変更したら確認すること

1. 入力例3つがすべて意図どおりに整理されるか（症状・時期・薬・質問の振り分け）
2. 否定表現（「吐いてはいない」）を症状として拾っていないか
3. 辞書に無い言い方（「なんとなくしんどい」）でも、入力した文がどこかの項目に必ず残るか
4. スマホ幅（390px）で横スクロールが出ないか
5. 注意書きが画面とコピー結果の両方にあるか
