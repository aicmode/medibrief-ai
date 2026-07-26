import type { MemoSection } from "@/lib/types";

/** 項目ごとの見た目。主な困りごとと伝え忘れ防止メモだけ、色で少し目立たせる。 */
const TONES: Record<string, { card: string; dot: string }> = {
  mainConcern: { card: "border-emerald-200 bg-emerald-50/60", dot: "bg-emerald-500" },
  reminders: { card: "border-sky-200 bg-sky-50/50", dot: "bg-sky-500" },
  default: { card: "border-slate-200 bg-white", dot: "bg-slate-300" },
};

export default function MemoSectionCard({ section }: { section: MemoSection }) {
  const tone = TONES[section.id] ?? TONES.default;
  const hasItems = section.items.length > 0;

  return (
    <article className={`rounded-xl border p-3.5 ${tone.card}`}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
        {section.title}
      </h3>
      {section.hint && (
        <p className="mt-1 pl-3.5 text-xs leading-relaxed text-slate-500">
          {section.hint}
        </p>
      )}

      {hasItems ? (
        <ul className="mt-2 space-y-1.5 pl-3.5">
          {section.items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-700">
              <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-slate-400" />
              <span className="min-w-0 break-words whitespace-pre-wrap">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 ml-3.5 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
          {section.emptyGuide}
        </p>
      )}
    </article>
  );
}
