"use client";

import { useState } from "react";
import MemoSectionCard, { type MemoEditHandlers } from "@/components/MemoSectionCard";
import MissingInfoPanel from "@/components/MissingInfoPanel";
import SymptomTimeline from "@/components/SymptomTimeline";
import { DISCLAIMER, formatDateTime, memoToPlainText } from "@/lib/format";
import { findMissingInfo } from "@/lib/missing";
import { describeProvider } from "@/lib/organizer";
import type { VisitMemo } from "@/lib/types";

type CopyState = "idle" | "copied" | "failed";

type Props = {
  memo: VisitMemo | null;
  isBusy: boolean;
  isEditing: boolean;
  edit: MemoEditHandlers;
  onToggleEdit: () => void;
  onDoctorView: () => void;
  onAppendAndReorganize: (text: string) => void;
};

export default function MemoResult({
  memo,
  isBusy,
  isEditing,
  edit,
  onToggleEdit,
  onDoctorView,
  onAppendAndReorganize,
}: Props) {
  // どのメモに対する結果かを一緒に持つ。メモを作り直したら自動的に "idle" に戻る。
  const [copy, setCopy] = useState<{ target: VisitMemo | null; state: CopyState }>({
    target: null,
    state: "idle",
  });
  const copyState: CopyState = copy.target === memo ? copy.state : "idle";

  const handleCopy = async () => {
    if (!memo) return;
    try {
      if (!navigator.clipboard) throw new Error("clipboard is unavailable");
      await navigator.clipboard.writeText(memoToPlainText(memo));
      setCopy({ target: memo, state: "copied" });
      window.setTimeout(() => setCopy({ target: memo, state: "idle" }), 2000);
    } catch {
      // 権限・非対応・非セキュアコンテキストなど。案内に切り替える。
      setCopy({ target: memo, state: "failed" });
    }
  };

  if (!memo) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">受診メモ</h2>
        <div
          aria-live="polite"
          className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center"
        >
          <p className="text-sm font-medium text-slate-500">
            {isBusy ? "整理しています…" : "ここに受診メモが表示されます"}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            気になっていることを入力して「受診メモを作る」を押してください。
            <br />
            7つの項目に振り分けて、伝え忘れも一緒にまとめます。
          </p>
        </div>
      </section>
    );
  }

  const badge = describeProvider(memo.provider);
  const missing = findMissingInfo(memo);

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">
              <span className="mr-1.5 text-xs font-bold text-emerald-700">STEP 3</span>
              受診メモを確認・編集
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatDateTime(memo.generatedAt)} 作成
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              badge.kind === "ai"
                ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200"
                : badge.kind === "fallback"
                  ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                  : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
            }`}
          >
            {badge.label}
          </span>
        </div>
        <p aria-live="polite" className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {isBusy ? "整理しています…" : badge.detail}
        </p>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-700">
            <span className="mr-1.5 text-xs font-bold text-emerald-700">STEP 4</span>
            受診で使う
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={onDoctorView}
              className="col-span-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:outline-none sm:col-span-1"
            >
              医師に見せる
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            >
              {copyState === "copied" ? "コピーしました" : "コピー"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            >
              印刷／PDF
            </button>
            <button
              type="button"
              onClick={onToggleEdit}
              aria-pressed={isEditing}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors focus:ring-2 focus:outline-none ${
                isEditing
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-200"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-emerald-200"
              }`}
            >
              {isEditing ? "編集を終える" : "内容を直す"}
            </button>
          </div>

          <p aria-live="polite" className="sr-only">
            {copyState === "copied" ? "受診メモをコピーしました" : ""}
          </p>
          {copyState === "failed" && (
            <p
              role="alert"
              className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900"
            >
              コピーできませんでした。メモの文字を長押し（またはドラッグ）して選択してからコピーしてください。
            </p>
          )}
        </div>
      </div>

      {isEditing && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-900">
          整理結果は下書きです。事実と違うところは直してください。
          編集した内容は、コピー・保存・医師に見せる・印刷のすべてに反映されます。
        </p>
      )}

      <div className="space-y-2.5">
        {memo.sections.map((section) => (
          <MemoSectionCard
            key={section.id}
            section={section}
            isEditing={isEditing}
            edit={edit}
          />
        ))}
      </div>

      <SymptomTimeline entries={memo.timeline} />

      <MissingInfoPanel
        items={missing}
        isBusy={isBusy}
        onAppendAndReorganize={onAppendAndReorganize}
      />

      <p className="text-[11px] leading-relaxed text-slate-400">
        入力した言葉をもとに項目へ振り分けたものです。{DISCLAIMER}
      </p>
    </section>
  );
}
