/**
 * 受診メモの編集操作。
 *
 * AIやルールベースが出した結果は「下書き」なので、ユーザーが直せるようにする。
 * ここで扱うのは項目の中身（箇条書き）だけ。7つの大分類そのものは増減させない。
 *
 * すべて新しいオブジェクトを返す純粋関数にしてある（Reactの状態更新とテストのため）。
 */

import { MAX_ITEMS_PER_SECTION, MAX_ITEM_LENGTH } from "./limits";
import type { MemoSection, SectionId, VisitMemo } from "./types";

function mapSection(
  memo: VisitMemo,
  sectionId: SectionId,
  update: (section: MemoSection) => string[],
): VisitMemo {
  return {
    ...memo,
    sections: memo.sections.map((section) =>
      section.id === sectionId ? { ...section, items: update(section) } : section,
    ),
  };
}

function clamp(text: string): string {
  return text.length > MAX_ITEM_LENGTH ? text.slice(0, MAX_ITEM_LENGTH) : text;
}

/** 項目の1行を書き換える（空文字のままにもできる。確定は保存時のtrimで行う） */
export function updateItem(
  memo: VisitMemo,
  sectionId: SectionId,
  index: number,
  text: string,
): VisitMemo {
  return mapSection(memo, sectionId, (section) =>
    section.items.map((item, i) => (i === index ? clamp(text) : item)),
  );
}

/** 項目に1行足す */
export function addItem(
  memo: VisitMemo,
  sectionId: SectionId,
  text = "",
): VisitMemo {
  return mapSection(memo, sectionId, (section) =>
    section.items.length >= MAX_ITEMS_PER_SECTION
      ? section.items
      : [...section.items, clamp(text)],
  );
}

/** 項目の1行を消す */
export function removeItem(
  memo: VisitMemo,
  sectionId: SectionId,
  index: number,
): VisitMemo {
  return mapSection(memo, sectionId, (section) =>
    section.items.filter((_, i) => i !== index),
  );
}

/** 項目の中で1行を上下に動かす（項目をまたぐ移動はしない） */
export function moveItem(
  memo: VisitMemo,
  sectionId: SectionId,
  index: number,
  direction: -1 | 1,
): VisitMemo {
  return mapSection(memo, sectionId, (section) => {
    const target = index + direction;
    if (index < 0 || index >= section.items.length) return section.items;
    if (target < 0 || target >= section.items.length) return section.items;

    const items = [...section.items];
    [items[index], items[target]] = [items[target], items[index]];
    return items;
  });
}

/** 編集を終えるときの後片付け。空行を落とし、前後の空白を取る。 */
export function tidyMemo(memo: VisitMemo): VisitMemo {
  return {
    ...memo,
    sections: memo.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => item.trim()).filter((item) => item !== ""),
    })),
  };
}
