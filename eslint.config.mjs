import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // The codebase predates strict typing enforcement.
    // Downgrade to warn so CI stays green while we migrate gradually.
    // The async-in-effect pattern (fetch → setState) is intentional throughout.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // WebGL fluid-cursor is a 1300-line JS port; @ts-nocheck suppresses
    // the implicit-any cascade until the file is rewritten in proper TS.
    files: ["hooks/use-fluid-cursor.ts"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
]);

export default eslintConfig;
