/**
 * いま4つの手順のどこにいるかを示す帯。
 * 画面遷移はしない（1ページの中で進むだけ）ので、押せるボタンにはしていない。
 */

export type StepNumber = 1 | 2 | 3 | 4;

const STEPS: { id: StepNumber; label: string; detail: string }[] = [
  { id: 1, label: "入力", detail: "体調を書く" },
  { id: 2, label: "整理", detail: "7項目に分ける" },
  { id: 3, label: "確認・編集", detail: "下書きを直す" },
  { id: 4, label: "受診で使う", detail: "見せる・保存" },
];

type Props = {
  current: StepNumber;
  /** ここまでは到達済み（＝結果がある）という印 */
  reached: StepNumber;
};

export default function StepIndicator({ current, reached }: Props) {
  return (
    <nav aria-label="作成の手順" className="no-print">
      <ol className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {STEPS.map((step) => {
          const isCurrent = step.id === current;
          const isDone = step.id < current || step.id <= reached;
          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className={`rounded-xl border px-1.5 py-2 text-center sm:px-3 sm:py-2.5 ${
                isCurrent
                  ? "border-emerald-300 bg-emerald-50"
                  : isDone
                    ? "border-emerald-100 bg-white"
                    : "border-slate-200 bg-white"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    isCurrent
                      ? "bg-emerald-600 text-white"
                      : isDone
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {step.id}
                </span>
                <span
                  className={`truncate text-[11px] font-semibold sm:text-sm ${
                    isCurrent ? "text-emerald-900" : isDone ? "text-slate-700" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </span>
              <span className="mt-0.5 hidden text-[11px] text-slate-500 sm:block">
                {step.detail}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
