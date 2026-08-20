import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

// eslint-config-next@15 still ships legacy eslintrc-format configs (not flat-config
// arrays), so we bridge them into flat config with FlatCompat rather than the
// `eslint-config-next/core-web-vitals` flat export used by newer eslint-config-next.
const compat = new FlatCompat({ baseDirectory: fileURLToPath(new URL(".", import.meta.url)) });

// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config gives array-spread typing that plain arrays lack
export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "drizzle/**",
      "coverage/**",
      "playwright-report/**",
      "design/**",
      ".superpowers/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ["*.config.mjs"] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { import: importPlugin },
    rules: {
      "no-console": "error",
      "import/order": [
        "error",
        {
          "newlines-between": "never",
          alphabetize: { order: "asc" },
          groups: ["builtin", "external", "internal", "parent", "sibling"],
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  {
    files: ["tests/**", "e2e/**"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off", "@typescript-eslint/no-unsafe-assignment": "off" },
  },
  prettier,
);
