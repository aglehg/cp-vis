import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Keep builds unblocked; tighten later if desired
      "@typescript-eslint/no-explicit-any": "off",
      // Allow temporary unused vars when prefixed with _
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Avoid failing on apostrophes in text content
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
