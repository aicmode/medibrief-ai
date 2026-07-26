import DisclaimerNotice from "@/components/DisclaimerNotice";
import MemoBuilder from "@/components/MemoBuilder";
import { isLocalOnly } from "@/lib/organizer";
import { DISCLAIMER } from "@/lib/format";

export default function Home() {
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
        <MemoBuilder />
      </main>

      <footer className="no-print mt-2 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-slate-500 sm:px-6">
          <p>{DISCLAIMER}</p>
          <p className="mt-1">
            {isLocalOnly()
              ? "入力した内容はブラウザの中だけで処理され、外部に送信・保存されません。"
              : "現在はサーバー経由で整理する設定です（NEXT_PUBLIC_MEMO_PROVIDER=api）。入力内容は整理のため外部APIに送信されます。"}
          </p>
          <p className="mt-1 text-slate-400">MediBrief — 受診メモ整理ツール</p>
        </div>
      </footer>
    </div>
  );
}
