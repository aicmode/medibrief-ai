"use client";

import { useEffect, useRef, useState } from "react";
import {
  collectFinalTranscript,
  createRecognition,
  describeSpeechError,
  getSpeechRecognitionCtor,
  type SpeechRecognitionLike,
} from "@/lib/speech";
import { useBrowserValue } from "@/lib/use-browser-value";

type Props = {
  /** 認識できた文章を入力欄に足す */
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

/**
 * 音声入力ボタン。
 *
 * ・対応ブラウザでだけ出す（非対応なら案内文に置き換える）
 * ・マイクが拒否された場合もアプリは動き続け、キーボード入力に戻れる
 * ・認識結果は入力欄に足すだけ。内容の解釈はしない。
 */
export default function VoiceInputButton({ onTranscript, disabled = false }: Props) {
  const supported = useBrowserValue(() => getSpeechRecognitionCtor() !== null, false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // 画面から離れるときに認識を止める（マイクを掴んだままにしない）
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // すでに終了している場合は何もしなくてよい
      }
      recognitionRef.current = null;
    };
  }, []);

  const stop = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // stop 前に終了していることがある
    }
    recognitionRef.current = null;
    setIsListening(false);
  };

  const start = () => {
    setError(null);
    const recognition = createRecognition();
    if (!recognition) {
      setError("このブラウザでは音声入力を利用できません。キーボード入力をお使いください。");
      return;
    }

    recognition.onresult = (event) => {
      const text = collectFinalTranscript(event);
      if (text) onTranscript(text);
    };
    recognition.onerror = (event) => {
      const message = describeSpeechError(event.error);
      if (message) setError(message);
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setError("音声入力を開始できませんでした。キーボード入力をお使いください。");
      setIsListening(false);
    }
  };

  if (!supported) {
    return (
      <p className="text-xs leading-relaxed text-slate-500">
        このブラウザは音声入力（音声認識）に対応していません。キーボードで入力してください。
      </p>
    );
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={isListening ? stop : start}
        disabled={disabled}
        aria-pressed={isListening}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
          isListening
            ? "border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-300"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-emerald-200"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
        >
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
        </svg>
        {isListening ? "音声入力を停止" : "音声で入力"}
      </button>

      <p aria-live="polite" className="mt-1.5 text-xs leading-relaxed text-slate-500">
        {isListening
          ? "聞き取り中です。話し終えたら「停止」を押してください。"
          : "話した内容が入力欄に追加されます。"}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900"
        >
          {error}
        </p>
      )}
    </div>
  );
}
