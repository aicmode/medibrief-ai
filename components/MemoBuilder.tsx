"use client";

import { useRef, useState } from "react";
import MemoResult from "@/components/MemoResult";
import SymptomForm from "@/components/SymptomForm";
import { organizeMemo } from "@/lib/organizer";
import type { VisitMemo } from "@/lib/types";

/** 入力と整理結果をつなぐ画面本体。状態はここだけで持つ。 */
export default function MemoBuilder() {
  const [input, setInput] = useState("");
  const [memo, setMemo] = useState<VisitMemo | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    setIsBusy(true);
    setError(null);
    try {
      setMemo(await organizeMemo(input));
      // スマホでは結果が入力欄の下に来るので、そこまで送る
      if (window.innerWidth < 1024) {
        window.requestAnimationFrame(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } catch (cause) {
      console.error(cause);
      setError("整理に失敗しました。お手数ですが、もう一度お試しください。");
    } finally {
      setIsBusy(false);
    }
  };

  const handleClear = () => {
    setInput("");
    setMemo(null);
    setError(null);
  };

  return (
    <div className="grid gap-4 print:block lg:grid-cols-2 lg:items-start lg:gap-6">
      {/* 画面が広いときは入力欄を追従させ、結果を見ながら書き足せるようにする */}
      <div className="lg:sticky lg:top-4">
        <SymptomForm
          value={input}
          isBusy={isBusy}
          onChange={setInput}
          onSubmit={handleSubmit}
          onClear={handleClear}
        />
      </div>

      <div ref={resultRef} className="scroll-mt-4">
        {error && (
          <p
            role="alert"
            className="no-print mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900"
          >
            {error}
          </p>
        )}
        <MemoResult memo={memo} isBusy={isBusy} />
      </div>
    </div>
  );
}
