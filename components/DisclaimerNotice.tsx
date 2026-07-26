/** 画面上部に常に出す注意書き。このアプリの性格を最初に伝える。 */
export default function DisclaimerNotice() {
  return (
    <div
      role="note"
      className="flex gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden="true"
        className="mt-0.5 h-5 w-5 shrink-0 text-sky-500"
      >
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 11v5" />
        <path strokeLinecap="round" d="M12 8h.01" />
      </svg>
      <p className="text-[13px] leading-relaxed text-sky-900 sm:text-sm">
        <span className="font-semibold">診断ではありません。</span>
        強い症状や不安がある場合は医療機関へ相談してください。
        このアプリは病名や薬の判断をせず、伝えたいことの整理だけを行います。
      </p>
    </div>
  );
}
