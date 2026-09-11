"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import DoctorView from "@/components/DoctorView";
import HistoryPanel from "@/components/HistoryPanel";
import MemoResult from "@/components/MemoResult";
import type { MemoEditHandlers } from "@/components/MemoSectionCard";
import PrintableMemo from "@/components/PrintableMemo";
import StepIndicator, { type StepNumber } from "@/components/StepIndicator";
import SymptomForm from "@/components/SymptomForm";
import { MAX_INPUT_LENGTH } from "@/lib/limits";
import * as MemoEdit from "@/lib/memo-edit";
import { organizeMemo, type MemoMode } from "@/lib/organizer";
import {
  clearHistory,
  deleteHistoryEntry,
  getHistoryServerSnapshot,
  getHistorySnapshot,
  isHistoryAvailable,
  saveMemoToHistory,
  subscribeHistory,
  type HistoryEntry,
} from "@/lib/storage";
import type { SectionId, VisitMemo } from "@/lib/types";
import { useBrowserValue } from "@/lib/use-browser-value";

type Props = {
  /** サーバーに OPENAI_API_KEY があるか（キーそのものは決してクライアントへ渡さない） */
  aiConfigured: boolean;
  defaultMode: MemoMode;
};

type SaveNotice = { text: string; ok: boolean };

/** 入力・整理結果・履歴をつなぐ画面本体。受診メモの状態はここだけで持つ。 */
export default function MemoBuilder({ aiConfigured, defaultMode }: Props) {
  const [input, setInput] = useState("");
  const [memo, setMemo] = useState<VisitMemo | null>(null);
  const [mode, setMode] = useState<MemoMode>(defaultMode);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDoctorView, setIsDoctorView] = useState(false);
  const [saveNotice, setSaveNotice] = useState<SaveNotice | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const history = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot,
  );
  const historyAvailable = useBrowserValue(isHistoryAvailable, false);

  const scrollToResult = () => {
    // スマホでは結果が入力欄の下に来るので、そこまで送る
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;
    window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const runOrganize = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed === "") {
      setError("体調や困っていることを入力してください。");
      return;
    }
    setIsBusy(true);
    setError(null);
    setSaveNotice(null);
    try {
      const next = await organizeMemo(trimmed, mode);
      setMemo(next);
      setIsEditing(false);
      scrollToResult();
    } catch (cause) {
      // ここに来るのは想定外の失敗だけ（AI経路はルールベースへ自動で戻る）
      console.error("[MediBrief] 受診メモの整理に失敗しました:", cause);
      setError("整理に失敗しました。お手数ですが、もう一度お試しください。");
    } finally {
      setIsBusy(false);
    }
  };

  /** 音声入力・不足情報の追記。上限を超える分は足さない。 */
  const appendToInput = (extra: string): string => {
    const addition = extra.trim();
    if (addition === "") return input;
    const joiner = input.trim() === "" ? "" : input.endsWith("\n") ? "" : "\n";
    const next = `${input}${joiner}${addition}`.slice(0, MAX_INPUT_LENGTH);
    setInput(next);
    return next;
  };

  const handleAppendAndReorganize = (extra: string) => {
    const next = appendToInput(extra);
    void runOrganize(next);
  };

  const handleClear = () => {
    setInput("");
    setMemo(null);
    setError(null);
    setIsEditing(false);
    setSaveNotice(null);
  };

  const editMemo = (update: (current: VisitMemo) => VisitMemo) => {
    setMemo((current) => (current ? update(current) : current));
    setSaveNotice(null);
  };

  const edit: MemoEditHandlers = {
    updateItem: (sectionId: SectionId, index: number, text: string) =>
      editMemo((current) => MemoEdit.updateItem(current, sectionId, index, text)),
    addItem: (sectionId: SectionId) =>
      editMemo((current) => MemoEdit.addItem(current, sectionId)),
    removeItem: (sectionId: SectionId, index: number) =>
      editMemo((current) => MemoEdit.removeItem(current, sectionId, index)),
    moveItem: (sectionId: SectionId, index: number, direction: -1 | 1) =>
      editMemo((current) => MemoEdit.moveItem(current, sectionId, index, direction)),
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // 編集を終えるときに、空行と前後の空白を片づける
      setMemo((current) => (current ? MemoEdit.tidyMemo(current) : current));
    }
    setIsEditing((current) => !current);
  };

  const handleSave = () => {
    if (!memo) return;
    const tidied = MemoEdit.tidyMemo(memo);
    setMemo(tidied);
    const result = saveMemoToHistory(tidied);
    setSaveNotice(
      result.ok
        ? { text: "この端末のブラウザに保存しました。", ok: true }
        : {
            text:
              result.reason === "unavailable"
                ? "このブラウザでは保存できませんでした。コピーや印刷はそのまま使えます。"
                : "保存できませんでした。保存容量がいっぱいの可能性があります。",
            ok: false,
          },
    );
  };

  const handleOpenHistory = (entry: HistoryEntry) => {
    setMemo(entry.memo);
    setInput(entry.memo.sourceInput);
    setIsEditing(false);
    setError(null);
    setSaveNotice(null);
    scrollToResult();
  };

  const handleDeleteHistory = (id: string) => {
    const ok = deleteHistoryEntry(id);
    if (!ok) setSaveNotice({ text: "削除できませんでした。", ok: false });
  };

  const handleClearHistory = () => {
    const ok = clearHistory();
    setSaveNotice(
      ok
        ? { text: "保存した受診メモをすべて削除しました。", ok: true }
        : { text: "削除できませんでした。", ok: false },
    );
  };

  const handleDoctorView = () => {
    setMemo((current) => (current ? MemoEdit.tidyMemo(current) : current));
    setIsEditing(false);
    setIsDoctorView(true);
  };

  const currentStep: StepNumber = isBusy ? 2 : memo ? (isEditing ? 3 : 4) : 1;
  const reachedStep: StepNumber = memo ? 4 : 1;

  return (
    <>
      <div className="no-print space-y-4">
        <StepIndicator current={currentStep} reached={reachedStep} />

        <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
          <div className="space-y-4">
            <SymptomForm
              value={input}
              isBusy={isBusy}
              hasMemo={memo !== null}
              mode={mode}
              aiConfigured={aiConfigured}
              onChange={setInput}
              onAppend={(text) => appendToInput(text)}
              onModeChange={setMode}
              onSubmit={() => void runOrganize(input)}
              onClear={handleClear}
            />

            <HistoryPanel
              entries={history}
              available={historyAvailable}
              canSave={memo !== null}
              notice={saveNotice}
              onSave={handleSave}
              onOpen={handleOpenHistory}
              onDelete={handleDeleteHistory}
              onClearAll={handleClearHistory}
            />
          </div>

          <div ref={resultRef} className="scroll-mt-4">
            {error && (
              <p
                role="alert"
                className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900"
              >
                {error}
              </p>
            )}
            <MemoResult
              memo={memo}
              isBusy={isBusy}
              isEditing={isEditing}
              edit={edit}
              onToggleEdit={handleToggleEdit}
              onDoctorView={handleDoctorView}
              onAppendAndReorganize={handleAppendAndReorganize}
            />
          </div>
        </div>
      </div>

      {isDoctorView && memo && (
        <DoctorView memo={memo} onClose={() => setIsDoctorView(false)} />
      )}

      {/* 印刷／PDF保存のときだけ出る本文 */}
      <PrintableMemo memo={memo} />
    </>
  );
}
