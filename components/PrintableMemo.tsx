import { DISCLAIMER, formatDateTime, TIMELINE_NOTE, TIMELINE_TITLE } from "@/lib/format";
import type { VisitMemo } from "@/lib/types";

/**
 * 印刷／PDF保存のための本文。
 *
 * 画面には出さず（.print-only）、印刷のときだけ出す。
 * 画面用のUI（入力欄・ボタン・履歴など）は .no-print で消えるので、
 * 紙に出るのはこのコンポーネントだけになる。レイアウトは app/globals.css の @media print。
 */
export default function PrintableMemo({ memo }: { memo: VisitMemo | null }) {
  if (!memo) return null;

  return (
    <div className="print-only print-doc">
      <header className="print-header">
        <h1>受診メモ</h1>
        <p className="print-meta">
          作成日時：{formatDateTime(memo.generatedAt)} ／ 作成：MediBrief（受診メモ整理ツール）
        </p>
      </header>

      {memo.sections.map((section) => {
        // 編集途中の空行は紙に出さない
        const items = section.items.map((item) => item.trim()).filter((item) => item !== "");
        return (
          <section key={section.id} className="print-section">
            <h2>{section.title}</h2>
            {items.length > 0 ? (
              <ul>
                {items.map((item, index) => (
                  <li key={`${section.id}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="print-empty">（未記入）</p>
            )}
          </section>
        );
      })}

      {memo.timeline.length > 0 && (
        <section className="print-section">
          <h2>{TIMELINE_TITLE}</h2>
          <p className="print-note">{TIMELINE_NOTE}</p>
          <ul>
            {memo.timeline.map((entry, index) => (
              <li key={`${entry.time}-${index}`}>
                <span className="print-time">{entry.time}</span>
                {entry.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="print-footer">
        <p>{DISCLAIMER}</p>
        <p>本人の入力をもとに作成したメモです。診療記録の代わりにはなりません。</p>
      </footer>
    </div>
  );
}
