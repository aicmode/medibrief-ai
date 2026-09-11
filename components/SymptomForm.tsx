"use client";

import { useState } from "react";
import VoiceInputButton from "@/components/VoiceInputButton";
import { SYMPTOM_EXAMPLES } from "@/lib/examples";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import type { MemoMode } from "@/lib/organizer";

type Props = {
  value: string;
  isBusy: boolean;
  hasMemo: boolean;
  mode: MemoMode;
  /** サーバーに OPENAI_API_KEY があるか（キー自体は渡さない） */
  aiConfigured: boolean;
  onChange: (value: string) => void;
  onAppend: (text: string) => void;
  onModeChange: (mode: MemoMode) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export default function SymptomForm({
  value,
  isBusy,
  hasMemo,
  mode,
  aiConfigured,
  onChange,
  onAppend,
  onModeChange,
  onSubmit,
  onClear,
}: Props) {
  // 押し間違いで入力が消えないようにするためだけの表示状態
  const [confirmClear, setConfirmClear] = useState(false);

  const length = value.length;
  const isOverLimit = length > MAX_INPUT_LENGTH;
  const canSubmit = value.trim().length > 0 && !isBusy && !isOverLimit;

  const handleClear = () => {
    if ((hasMemo || value.trim() !== "") && !confirmClear) {
      setConfirmClear(true);
      return;
    }
    setConfirmClear(false);
    onClear();
  };

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor="symptoms" className="text-sm font-semibold text-slate-900">
          <span className="mr-1.5 text-xs font-bold text-emerald-700">STEP 1</span>
          体調や困っていること
        </label>
        <span
          className={`shrink-0 text-xs tabular-nums ${
            isOverLimit
              ? "font-semibold text-amber-700"
              : length > MAX_INPUT_LENGTH * 0.9
                ? "text-amber-600"
                : "text-slate-400"
          }`}
        >
          {length} / {MAX_INPUT_LENGTH}文字
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        話し言葉のままで大丈夫です。いつから・どんなふうに・気になることを書いてみてください。
      </p>

      <textarea
        id="symptoms"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_INPUT_LENGTH}
        aria-describedby="symptoms-help"
        placeholder="例）昨日の夜から喉が痛くて、今朝から少し熱っぽい。市販の風邪薬を飲んだ。"
        rows={8}
        className="mt-3 min-h-[160px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none sm:min-h-[200px]"
      />
      <p id="symptoms-help" className="mt-1 text-xs text-slate-400">
        {MAX_INPUT_LENGTH}文字まで入力できます。
      </p>

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

      <div className="mt-4 border-t border-slate-100 pt-4">
        <VoiceInputButton onTranscript={onAppend} disabled={isBusy} />
      </div>

      <fieldset className="mt-4 border-t border-slate-100 pt-4">
        <legend className="text-xs font-semibold text-slate-700">
          <span className="mr-1.5 text-xs font-bold text-emerald-700">STEP 2</span>
          整理のしかたを選ぶ
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <ModeOption
            id="mode-ai"
            checked={mode === "ai"}
            disabled={!aiConfigured || isBusy}
            onSelect={() => onModeChange("ai")}
            title="AIで整理"
            description={
              aiConfigured
                ? "入力内容が整理のため外部API（OpenAI）に送信されます。"
                : "APIキーが未設定のため選べません（サーバー側の設定が必要です）。"
            }
          />
          <ModeOption
            id="mode-local"
            checked={mode === "local"}
            disabled={isBusy}
            onSelect={() => onModeChange("local")}
            title="この端末で整理"
            description="ルールベース。入力内容は外部に送信されません。"
          />
        </div>
        {mode === "ai" && (
          <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-900">
            AIが失敗したときは、この端末のルールベース整理に自動で切り替わります。どちらで整理したかは結果に表示されます。
          </p>
        )}
      </fieldset>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {isBusy ? "整理しています…" : hasMemo ? "この内容で作り直す" : "受診メモを作る"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          onBlur={() => setConfirmClear(false)}
          className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus:ring-2 focus:outline-none sm:w-40 ${
            confirmClear
              ? "border-amber-300 bg-amber-50 text-amber-900 focus:ring-amber-200"
              : "border-slate-200 text-slate-600 hover:bg-slate-50 focus:ring-slate-200"
          }`}
        >
          {confirmClear ? "もう一度押すと消去" : "クリア"}
        </button>
      </div>
    </form>
  );
}

type ModeOptionProps = {
  id: string;
  checked: boolean;
  disabled: boolean;
  onSelect: () => void;
  title: string;
  description: string;
};

function ModeOption({
  id,
  checked,
  disabled,
  onSelect,
  title,
  description,
}: ModeOptionProps) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer gap-2.5 rounded-xl border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-300 ${
        checked ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
      } ${disabled ? "cursor-not-allowed opacity-60" : "hover:bg-slate-50"}`}
    >
      <input
        id={id}
        type="radio"
        name="memo-mode"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed break-words text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}
