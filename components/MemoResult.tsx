"use client";

import { useState } from "react";
import MemoSectionCard from "@/components/MemoSectionCard";
import { DISCLAIMER, formatDateTime, memoToPlainText } from "@/lib/format";
import type { VisitMemo } from "@/lib/types";

type CopyState = "idle" | "copied" | "failed";

type Props = {
  memo: VisitMemo | null;
  isBusy: boolean;
};

export default function MemoResult({ memo, isBusy }: Props) {
  // どのメモに対する結果かを一緒に持つ。メモを作り直したら自動的に "idle" に戻る。
  const [copy, setCopy] = useState<{ target: VisitMemo | null; state: CopyState }>({
    target: null,
    state: "idle",
  });
  const copyState: CopyState = copy.target === memo ? copy.state : "idle";

  const handleCopy = async () => {
    if (!memo) return;
    try {
      await navigator.clipboard.writeText(memoToPlainText(memo));
      setCopy({ target: memo, state: "copied" });
      window.setTimeout(() => setCopy({ target: memo, state: "idle" }), 2000);
    } catch {
      setCopy({ target: memo, state: "failed" });
    }
  };

  return (
    <section className="print-plain rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">受診メモ</h2>
          {memo && (
            <p className="mt-0.5 text-xs text-slate-400">
              {formatDateTime(memo.generatedAt)} 作成
            </p>
          )}
        </div>

        {memo && (
          <div className="no-print flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            >
              {copyState === "copied" ? "コピーしました" : "コピー"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:outline-none"
            >
              印刷
            </button>
          </div>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {copyState === "copied" ? "受診メモをコピーしました" : ""}
      </p>
      {copyState === "failed" && (
        <p className="no-print mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          コピーできませんでした。メモの文字を長押し（またはドラッグ）して選択してください。
        </p>
      )}

      {memo ? (
        <>
          <div className="mt-3 space-y-2.5">
            {memo.sections.map((section) => (
              <MemoSectionCard key={section.id} section={section} />
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            入力した言葉をもとに項目へ振り分けたものです。{DISCLAIMER}
          </p>
        </>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-500">
            {isBusy ? "整理しています…" : "ここに受診メモが表示されます"}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            気になっていることを入力して「受診メモを作る」を押してください。
            <br />
            7つの項目に振り分けて、伝え忘れも一緒にまとめます。
          </p>
        </div>
      )}
    </section>
  );
}
