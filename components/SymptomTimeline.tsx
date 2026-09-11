import { TIMELINE_NOTE, TIMELINE_TITLE } from "@/lib/format";
import type { TimelineEntry } from "@/lib/types";

/**
 * 症状経過タイムライン。
 * 入力に書かれていた時期の表現だけを、書かれた順に並べる。
 * 日付の推測や並べ替えはしない（lib/timeline.ts 参照）。
 */
export default function SymptomTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3.5">
      <h3 className="text-sm font-semibold text-slate-900">{TIMELINE_TITLE}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{TIMELINE_NOTE}</p>

      <ol className="mt-3 space-y-0">
        {entries.map((entry, index) => (
          <li key={`${entry.time}-${index}`} className="flex gap-3">
            {/* 縦線と丸で経過を表す（装飾なので読み上げからは隠す） */}
            <div aria-hidden="true" className="flex w-3 shrink-0 flex-col items-center">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              {index < entries.length - 1 && (
                <span className="w-px flex-1 bg-emerald-200" />
              )}
            </div>
            <div className="min-w-0 pb-3">
              <p className="text-xs font-semibold text-emerald-800">{entry.time}</p>
              <p className="mt-0.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-700">
                {entry.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
