"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * ブラウザにしか無い値（APIの対応有無など）を、hydration ずれなしで読む。
 *
 * サーバー描画では serverValue を返し、クライアントで読み直す。
 * useEffect + setState を使わずに済むので、React Compiler のルールにも触れない。
 *
 * get は同じ状況で同じ値を返すこと（プリミティブ推奨）。
 */
export function useBrowserValue<T>(get: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, get, () => serverValue);
}
