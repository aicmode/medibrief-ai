"use client";

import { MAX_ITEMS_PER_SECTION, MAX_ITEM_LENGTH } from "@/lib/limits";
import type { MemoSection, SectionId } from "@/lib/types";

/** 受診メモの編集操作。状態は MemoBuilder が持ち、ここは呼ぶだけ。 */
export type MemoEditHandlers = {
  updateItem: (sectionId: SectionId, index: number, text: string) => void;
  addItem: (sectionId: SectionId) => void;
  removeItem: (sectionId: SectionId, index: number) => void;
  moveItem: (sectionId: SectionId, index: number, direction: -1 | 1) => void;
};

/** 項目ごとの見た目。主な困りごとと伝え忘れ防止メモだけ、色で少し目立たせる。 */
const TONES: Record<string, { card: string; dot: string }> = {
  mainConcern: { card: "border-emerald-200 bg-emerald-50/60", dot: "bg-emerald-500" },
  reminders: { card: "border-sky-200 bg-sky-50/50", dot: "bg-sky-500" },
  default: { card: "border-slate-200 bg-white", dot: "bg-slate-300" },
};

type Props = {
  section: MemoSection;
  isEditing?: boolean;
  edit?: MemoEditHandlers;
};

export default function MemoSectionCard({ section, isEditing = false, edit }: Props) {
  const tone = TONES[section.id] ?? TONES.default;
  const hasItems = section.items.length > 0;

  return (
    <article className={`rounded-xl border p-3.5 ${tone.card}`}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
        {section.title}
      </h3>
      {section.hint && (
        <p className="mt-1 pl-3.5 text-xs leading-relaxed text-slate-500">{section.hint}</p>
      )}

      {isEditing && edit ? (
        <EditableItems section={section} edit={edit} />
      ) : hasItems ? (
        <ul className="mt-2 space-y-1.5 pl-3.5">
          {section.items.map((item, index) => (
            // 編集で同じ文が並ぶこともあるため、位置をキーにする
            <li
              key={`${section.id}-${index}`}
              className="flex gap-2 text-sm leading-relaxed text-slate-700"
            >
              <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-slate-400" />
              <span className="min-w-0 break-words whitespace-pre-wrap">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 ml-3.5 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
          {section.emptyGuide || "この項目に入る内容はありませんでした。"}
        </p>
      )}
    </article>
  );
}

function EditableItems({
  section,
  edit,
}: {
  section: MemoSection;
  edit: MemoEditHandlers;
}) {
  const isFull = section.items.length >= MAX_ITEMS_PER_SECTION;

  return (
    <div className="mt-2 space-y-2 pl-3.5">
      {section.items.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-500">
          {section.emptyGuide || "必要なら「行を追加」から書き足せます。"}
        </p>
      )}

      {section.items.map((item, index) => (
        // 並び替えと削除で中身が入れ替わるため、位置をキーにする
        <div key={`${section.id}-${index}`} className="rounded-lg border border-slate-200 bg-white p-2">
          <textarea
            value={item}
            rows={2}
            maxLength={MAX_ITEM_LENGTH}
            aria-label={`${section.title} ${index + 1}行目`}
            onChange={(event) => edit.updateItem(section.id, index, event.target.value)}
            className="w-full resize-y rounded-md border border-slate-200 px-2.5 py-2 text-sm leading-relaxed text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
          />
          <div className="mt-1.5 flex flex-wrap justify-end gap-1.5">
            <IconButton
              label={`${section.title} ${index + 1}行目を上へ移動`}
              disabled={index === 0}
              onClick={() => edit.moveItem(section.id, index, -1)}
            >
              ↑ 上へ
            </IconButton>
            <IconButton
              label={`${section.title} ${index + 1}行目を下へ移動`}
              disabled={index === section.items.length - 1}
              onClick={() => edit.moveItem(section.id, index, 1)}
            >
              ↓ 下へ
            </IconButton>
            <IconButton
              label={`${section.title} ${index + 1}行目を削除`}
              tone="danger"
              onClick={() => edit.removeItem(section.id, index)}
            >
              削除
            </IconButton>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => edit.addItem(section.id)}
        disabled={isFull}
        className="rounded-lg border border-dashed border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-200 focus:outline-none disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
      >
        ＋ 行を追加
      </button>
      {isFull && (
        <p className="text-xs text-slate-500">
          この項目は{MAX_ITEMS_PER_SECTION}行までです。
        </p>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled = false,
  tone = "normal",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "normal" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "danger"
          ? "border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-900 focus:ring-amber-200"
          : "border-slate-200 text-slate-600 hover:bg-slate-50 focus:ring-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
