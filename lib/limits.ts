/**
 * 入力・保存まわりの上限値。
 *
 * 画面（文字数カウンタ）・APIルート・localStorage の検証で同じ値を使う。
 * 極端に長い入力や壊れた保存データでアプリが止まらないようにするための線引き。
 */

/** 自由入力の最大文字数（画面に表示する） */
export const MAX_INPUT_LENGTH = 2000;

/** 1項目あたりの箇条書きの最大文字数 */
export const MAX_ITEM_LENGTH = 300;

/** 1項目に入る箇条書きの最大数 */
export const MAX_ITEMS_PER_SECTION = 20;

/** タイムラインの最大件数 */
export const MAX_TIMELINE_ENTRIES = 20;

/** localStorage に残す履歴の最大件数（古いものから消える） */
export const MAX_HISTORY_ENTRIES = 20;
