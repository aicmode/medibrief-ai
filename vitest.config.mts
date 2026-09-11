import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * ロジック（lib/）のテスト。ブラウザは使わないので environment は node。
 * localStorage が要るテストは、テスト側で最小限のモックを差し込む。
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
