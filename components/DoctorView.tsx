"use client";

import { useEffect } from "react";
import { DISCLAIMER, formatDateTime, TIMELINE_NOTE, TIMELINE_TITLE } from "@/lib/format";
import type { VisitMemo } from "@/lib/types";

type Props = {
  memo: VisitMemo;
  onClose: () => void;
};

/**
 * 医師に見せるモード。
 *
 * 診察室でスマホの画面をそのまま渡せるように、
 * 入力欄・編集・保存などの操作を全部消して、大きな文字で内容だけを出す。
 */
export default function DoctorView({ memo, onClose }: Props) {
  // Escape で閉じられるようにする（画面を渡したあと戻れなくならないように）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // 背面のスクロールを止める
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="医師に見せる画面"
      className="no-print fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-white"
    >
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-base font-bold text-slate-900 sm:text-lg">受診メモ</p>
            <p className="text-xs text-slate-600">
              {formatDateTime(memo.generatedAt)} 作成
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="shrink-0 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-emerald-300 focus:outline-none"
          >
            通常画面に戻る
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-4 pb-16 sm:px-6">
        <div className="space-y-5">
          {memo.sections.map((section) => (
            <section key={section.id}>
              <h2 className="border-l-4 border-emerald-500 pl-2.5 text-lg font-bold text-slate-900 sm:text-xl">
                {section.title}
              </h2>
              {section.items.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {section.items.map((item, index) => (
                    <li
                      key={`${section.id}-${index}`}
                      className="flex gap-2.5 text-base leading-relaxed text-slate-900 sm:text-lg"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500"
                      />
                      <span className="min-w-0 break-words whitespace-pre-wrap">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-base text-slate-500">（未記入）</p>
              )}
            </section>
          ))}

          {memo.timeline.length > 0 && (
            <section>
              <h2 className="border-l-4 border-emerald-500 pl-2.5 text-lg font-bold text-slate-900 sm:text-xl">
                {TIMELINE_TITLE}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{TIMELINE_NOTE}</p>
              <ol className="mt-2 space-y-2">
                {memo.timeline.map((entry, index) => (
                  <li
                    key={`${entry.time}-${index}`}
                    className="rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <p className="text-sm font-bold text-emerald-800">{entry.time}</p>
                    <p className="mt-0.5 text-base leading-relaxed break-words whitespace-pre-wrap text-slate-900">
                      {entry.text}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <p className="mt-8 border-t border-slate-200 pt-4 text-sm leading-relaxed text-slate-600">
          {DISCLAIMER}
          <br />
          このメモは MediBrief（受診メモ整理ツール）で、本人の入力をもとに作成しました。
        </p>
      </div>
    </div>
  );
}
