"use client";

import { SYMPTOM_EXAMPLES } from "@/lib/examples";

type Props = {
  value: string;
  isBusy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export default function SymptomForm({
  value,
  isBusy,
  onChange,
  onSubmit,
  onClear,
}: Props) {
  const canSubmit = value.trim().length > 0 && !isBusy;

  return (
    <form
      className="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor="symptoms" className="text-sm font-semibold text-slate-900">
          体調や困っていること
        </label>
        <span className="shrink-0 text-xs text-slate-400">{value.length}文字</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        話し言葉のままで大丈夫です。いつから・どんなふうに・気になることを書いてみてください。
      </p>

      <textarea
        id="symptoms"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="例）昨日の夜から喉が痛くて、今朝から少し熱っぽい。市販の風邪薬を飲んだ。"
        rows={8}
        className="mt-3 min-h-[180px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none sm:min-h-[220px]"
      />

      <div className="mt-3">
        <p className="text-xs font-medium text-slate-500">入力例を使う</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SYMPTOM_EXAMPLES.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => onChange(example.text)}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {isBusy ? "整理しています…" : "受診メモを作る"}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:outline-none sm:w-28"
        >
          クリア
        </button>
      </div>
    </form>
  );
}
