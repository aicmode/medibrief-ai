import DisclaimerNotice from "@/components/DisclaimerNotice";
import MemoBuilder from "@/components/MemoBuilder";
import { DISCLAIMER } from "@/lib/format";
import { resolveDefaultMode } from "@/lib/organizer";

/**
 * AIが使える設定かどうかを、ビルド時ではなく実行時に見るため動的描画にする。
 * （APIキーを後から設定しても、再ビルドなしで反映される）
 */
export const dynamic = "force-dynamic";

export default function Home() {
  // サーバー側でキーの「有無」だけを判定する。キーそのものはクライアントへ渡さない。
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const defaultMode = resolveDefaultMode(aiConfigured);

  return (
    <div className="flex min-h-full flex-col">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path d="M9 4.5H7.5A1.5 1.5 0 0 0 6 6v13.5A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H15" />
              <path d="M9 4.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4.5v.75H9V4.5Z" />
              <path d="M9.5 11.5h5M9.5 15h3.5" />
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              MediBrief
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              体調メモを、診察で伝えやすい形に整理
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <div className="no-print mb-4">
          <DisclaimerNotice />
        </div>
        <MemoBuilder aiConfigured={aiConfigured} defaultMode={defaultMode} />
      </main>

      <footer className="no-print mt-2 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-slate-500 sm:px-6">
          <p>{DISCLAIMER}</p>
          <p className="mt-2 font-medium text-slate-600">入力内容の扱い</p>
          <ul className="mt-1 space-y-0.5">
            <li>
              ・「この端末で整理」を選んだときは、入力内容を外部へ送信しません（ブラウザ内で処理します）。
            </li>
            <li>
              ・「AIで整理」を選んだときだけ、整理のために入力内容が外部API（OpenAI）へ送信されます。
            </li>
            <li>
              ・保存した受診メモは、この端末のブラウザ（localStorage）にのみ保存します。サーバーやクラウドのデータベースには保存しません。
            </li>
          </ul>
          <p className="mt-2 text-slate-400">MediBrief — 受診メモ整理ツール</p>
        </div>
      </footer>
    </div>
  );
}
