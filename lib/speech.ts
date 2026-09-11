/**
 * 音声入力（ブラウザの Web Speech API）。
 *
 * 追加の依存や有料APIは使わない。対応していないブラウザでは
 * ボタンを出さずに案内だけ出す（アプリは壊さない）。
 * 認識した文章は入力欄に足すだけで、内容の解釈はしない。
 */

export type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

export type SpeechRecognitionErrorEventLike = {
  error: string;
};

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

/** 使えるなら SpeechRecognition のコンストラクタを返す。使えなければ null。 */
export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function createRecognition(lang = "ja-JP"): SpeechRecognitionLike | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;
  try {
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    return recognition;
  } catch {
    return null;
  }
}

/** 認識エラーを、ユーザーが次に何をすればよいか分かる日本語にする */
export function describeSpeechError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "マイクの使用が許可されていません。ブラウザの設定でマイクを許可すると使えます。キーボード入力はそのまま使えます。";
    case "no-speech":
      return "音声を聞き取れませんでした。もう一度お試しください。";
    case "audio-capture":
      return "マイクが見つかりませんでした。接続を確認してください。";
    case "network":
      return "音声認識サービスに接続できませんでした。時間をおいてお試しください。";
    case "aborted":
      return "";
    default:
      return "音声入力を開始できませんでした。キーボード入力をお使いください。";
  }
}

/** 認識結果のイベントから、確定した文章だけを取り出す */
export function collectFinalTranscript(event: SpeechRecognitionEventLike): string {
  let text = "";
  for (let i = event.resultIndex; i < event.results.length; i += 1) {
    const result = event.results[i];
    if (result?.isFinal) text += result[0]?.transcript ?? "";
  }
  return text.trim();
}
