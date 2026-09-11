import { beforeEach, describe, expect, it } from "vitest";
import { organizeWithRules } from "@/lib/organizer/rule-based";
import {
  clearHistory,
  deleteHistoryEntry,
  getHistorySnapshot,
  isHistoryAvailable,
  parseHistoryEntry,
  resetHistoryCache,
  saveMemoToHistory,
  STORAGE_KEY,
} from "@/lib/storage";

/** localStorage の最小限のモック（ブラウザ無しでも保存まわりを試せるようにする） */
class MemoryStorage {
  private map = new Map<string, string>();
  /** 容量超過を再現するためのスイッチ */
  failOnSet = false;
  /** アクセス自体が例外になる環境（ストレージがブロックされている）を再現する */
  failOnAll = false;

  get length() {
    return this.map.size;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  getItem(key: string) {
    if (this.failOnAll) throw new Error("blocked");
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failOnAll || this.failOnSet) throw new Error("QuotaExceededError");
    this.map.set(key, value);
  }
  removeItem(key: string) {
    if (this.failOnAll) throw new Error("blocked");
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
  /** テストから直接壊れたデータを入れるため */
  seed(key: string, value: string) {
    this.map.set(key, value);
  }
}

let store: MemoryStorage;

function installWindow(storage: MemoryStorage | null): void {
  Object.defineProperty(globalThis, "window", {
    value: storage
      ? {
          localStorage: storage,
          addEventListener: () => {},
          removeEventListener: () => {},
        }
      : undefined,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  store = new MemoryStorage();
  installWindow(store);
  resetHistoryCache();
});

const memo = organizeWithRules("昨日の夜から喉が痛い。市販の風邪薬を飲んだ。");

describe("履歴の保存（localStorage）", () => {
  it("保存すると一覧に出て、新しいものが先頭に来る", () => {
    expect(getHistorySnapshot()).toHaveLength(0);

    const first = saveMemoToHistory(memo);
    expect(first.ok).toBe(true);

    const second = saveMemoToHistory(organizeWithRules("3日前から胃が重い。"));
    expect(second.ok).toBe(true);

    const entries = getHistorySnapshot();
    expect(entries).toHaveLength(2);
    expect(entries[0].title).toContain("胃");
    expect(entries[0].memo.sourceInput).toBe("3日前から胃が重い。");
  });

  it("書き出した内容を読み直しても同じ受診メモになる", () => {
    saveMemoToHistory(memo);
    resetHistoryCache();
    const restored = getHistorySnapshot()[0].memo;
    expect(restored.sections).toEqual(memo.sections);
    expect(restored.timeline).toEqual(memo.timeline);
    expect(restored.provider).toBe(memo.provider);
    expect(restored.sourceInput).toBe(memo.sourceInput);
  });

  it("1件削除・全件削除ができる", () => {
    saveMemoToHistory(memo);
    saveMemoToHistory(organizeWithRules("頭が痛い。"));
    const [first] = getHistorySnapshot();

    expect(deleteHistoryEntry(first.id)).toBe(true);
    expect(getHistorySnapshot()).toHaveLength(1);

    expect(clearHistory()).toBe(true);
    expect(getHistorySnapshot()).toHaveLength(0);
  });

  it("保存できない環境では ok:false を返す（例外にしない）", () => {
    store.failOnSet = true;
    resetHistoryCache();
    const result = saveMemoToHistory(memo);
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ reason: "unavailable" });
  });

  it("保存の途中で容量超過が起きたときも ok:false を返す", () => {
    expect(isHistoryAvailable()).toBe(true);
    store.failOnSet = true; // 空き容量チェックのあとで書き込みだけ失敗する状況
    expect(saveMemoToHistory(memo)).toMatchObject({ ok: false, reason: "failed" });
  });

  it("ストレージが無い環境（サーバー側）でも落ちない", () => {
    installWindow(null);
    resetHistoryCache();
    expect(isHistoryAvailable()).toBe(false);
    expect(getHistorySnapshot()).toEqual([]);
    expect(saveMemoToHistory(memo).ok).toBe(false);
  });
});

describe("壊れた保存データの扱い", () => {
  it("JSONが壊れていても空として扱う", () => {
    store.seed(STORAGE_KEY, "{ではないもの");
    resetHistoryCache();
    expect(getHistorySnapshot()).toEqual([]);
  });

  it("配列でなければ空として扱う", () => {
    store.seed(STORAGE_KEY, JSON.stringify({ id: "x" }));
    resetHistoryCache();
    expect(getHistorySnapshot()).toEqual([]);
  });

  it("壊れた項目だけを捨てて、読めるものは残す", () => {
    store.seed(
      STORAGE_KEY,
      JSON.stringify([
        null,
        { id: "", savedAt: new Date().toISOString(), memo: { sections: [] } },
        { id: "a", savedAt: "きのう", memo: { sections: [] } },
        { id: "b", savedAt: new Date().toISOString(), memo: "こわれている" },
        {
          id: "c",
          savedAt: new Date().toISOString(),
          memo: { sections: [{ id: "mainConcern", items: ["のどの痛み"] }] },
        },
      ]),
    );
    resetHistoryCache();
    const entries = getHistorySnapshot();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("c");
    expect(entries[0].title).toContain("のどの痛み");
  });

  it("1件分の検証：形が違えば null", () => {
    expect(parseHistoryEntry(null)).toBeNull();
    expect(parseHistoryEntry({ id: 1 })).toBeNull();
    expect(parseHistoryEntry({ id: "a", savedAt: "x", memo: { sections: [] } })).toBeNull();
    expect(
      parseHistoryEntry({ id: "a", savedAt: new Date().toISOString(), memo: { sections: [] } }),
    ).not.toBeNull();
  });
});
