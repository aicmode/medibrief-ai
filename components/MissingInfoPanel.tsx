"use client";

import { useState } from "react";
import type { MissingInfo } from "@/lib/missing";

type Props = {
  items: MissingInfo[];
  isBusy: boolean;
  /** 書き足した文章を入力に追記して、もう一度整理する */
  onAppendAndReorganize: (text: string) => void;
};

/**
 * 不足情報チェック。
 *
 * 「診察でよく聞かれるのに、まだ書かれていないこと」を並べるだけ。
 * こちらで勝手に埋めることはしない。書き足すかどうかはユーザーが決める。
 */
export default function MissingInfoPanel({
  items,
  isBusy,
  onAppendAndReorganize,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
        <h3 className="text-sm font-semibold text-slate-900">確認すると伝わりやすいこと</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          よく聞かれる項目は、ひととおり書かれています。
        </p>
      </section>
    );
  }

  const open = (id: string) => {
    setOpenId(id);
    setDraft("");
  };

  const submit = () => {
    const text = draft.trim();
    if (!text || isBusy) return;
    setOpenId(null);
    setDraft("");
    onAppendAndReorganize(text);
  };

  return (
    <section className="rounded-xl border border-sky-200 bg-sky-50/60 p-3.5">
      <h3 className="text-sm font-semibold text-slate-900">確認すると伝わりやすいこと</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        まだ書かれていない項目です（{items.length}件）。分かる範囲で書き足すと、診察で伝わりやすくなります。
        こちらで内容を補うことはしません。
      </p>

      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <li key={item.id} className="rounded-lg border border-sky-100 bg-white p-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium break-words text-slate-800">
                    {item.question}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => (isOpen ? setOpenId(null) : open(item.id))}
                  aria-expanded={isOpen}
                  className="shrink-0 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-900 transition-colors hover:bg-sky-100 focus:ring-2 focus:ring-sky-200 focus:outline-none"
                >
                  {isOpen ? "閉じる" : "書き足す"}
                </button>
              </div>

              {isOpen && (
                <div className="mt-2">
                  <label htmlFor={`missing-${item.id}`} className="sr-only">
                    {item.question}
                  </label>
                  <textarea
                    id={`missing-${item.id}`}
                    value={draft}
                    rows={2}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={item.placeholder}
                    className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={submit}
                      disabled={draft.trim() === "" || isBusy}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-300 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isBusy ? "整理しています…" : "入力に追記して整理し直す"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenId(null)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:outline-none"
                    >
                      やめる
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
