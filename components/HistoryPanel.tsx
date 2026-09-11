"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import { MAX_HISTORY_ENTRIES } from "@/lib/limits";
import { describeProvider } from "@/lib/organizer";
import type { HistoryEntry } from "@/lib/storage";

type Props = {
  entries: readonly HistoryEntry[];
  /** localStorage が使えるか（プライベートbrowsing等で false になる） */
  available: boolean;
  canSave: boolean;
  /** 保存・削除の結果メッセージ */
  notice: { text: string; ok: boolean } | null;
  onSave: () => void;
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
};

/**
 * 保存した受診メモの一覧。保存先はこの端末のブラウザ（localStorage）だけ。
 * 削除はどれも2段階（押し間違い防止）。
 */
export default function HistoryPanel({
  entries,
  available,
  canSave,
  notice,
  onSave,
  onOpen,
  onDelete,
  onClearAll,
}: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">
          保存した受診メモ
          <span className="ml-1.5 text-xs font-normal text-slate-500">
            （{entries.length}件／最大{MAX_HISTORY_ENTRIES}件）
          </span>
        </h2>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || !available}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:outline-none disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          いまのメモを保存
        </button>
      </div>

      <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
        保存先は<span className="font-semibold">この端末のブラウザの中だけ</span>です
        （サーバーやクラウドには保存しません）。ブラウザのデータを消すと履歴も消えます。
        共用の端末では、使い終わったら削除してください。
      </p>

      {!available && (
        <p role="alert" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          このブラウザでは保存機能を利用できません（プライベートブラウズや設定でブロックされている可能性があります）。コピーや印刷はそのまま使えます。
        </p>
      )}

      <p aria-live="polite" className="sr-only">
        {notice?.text ?? ""}
      </p>
      {notice && (
        <p
          className={`mt-2 rounded-lg px-3 py-2 text-xs leading-relaxed ${
            notice.ok ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
          }`}
        >
          {notice.text}
        </p>
      )}

      {entries.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-6 text-center text-xs leading-relaxed text-slate-500">
          まだ保存された受診メモはありません。
          <br />
          作成した受診メモは「いまのメモを保存」で残せます。
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map((entry) => {
            const badge = describeProvider(entry.memo.provider);
            const isConfirming = confirmId === entry.id;
            return (
              <li key={entry.id} className="rounded-xl border border-slate-200 p-2.5">
                <p className="text-sm font-medium break-words text-slate-800">{entry.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDateTime(entry.savedAt)} 保存 ・ {badge.label}
                </p>

                {isConfirming ? (
                  <div className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2">
                    <p className="text-xs text-amber-900">この保存を削除しますか？</p>
                    <div className="mt-1.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmId(null);
                          onDelete(entry.id);
                        }}
                        className="rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 focus:ring-2 focus:ring-amber-200 focus:outline-none"
                      >
                        削除する
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:outline-none"
                      >
                        やめる
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpen(entry)}
                      className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                    >
                      開く
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(entry.id)}
                      className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:outline-none"
                    >
                      削除
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {entries.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          {confirmAll ? (
            <div className="rounded-lg bg-amber-50 px-2.5 py-2">
              <p className="text-xs text-amber-900">
                保存した受診メモを{entries.length}件すべて削除します。元に戻せません。
              </p>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmAll(false);
                    onClearAll();
                  }}
                  className="rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 focus:ring-2 focus:ring-amber-200 focus:outline-none"
                >
                  すべて削除する
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAll(false)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:outline-none"
                >
                  やめる
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmAll(true)}
              className="text-xs font-medium text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-700 focus:ring-2 focus:ring-slate-200 focus:outline-none"
            >
              すべての履歴を削除
            </button>
          )}
        </div>
      )}
    </section>
  );
}
