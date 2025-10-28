import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import tseslint from "typescript-eslint";

const tsFileGlobs = ["**/*.ts", "**/*.tsx", "**/*.cts", "**/*.mts"];

const tsConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: config.files ?? tsFileGlobs,
  languageOptions: {
    ...config.languageOptions,
    parser: tseslint.parser,
    parserOptions: {
      ...config.languageOptions?.parserOptions,
      project: "./tsconfig.json",
      tsconfigRootDir: import.meta.dirname,
      sourceType: "module",
    },
  },
}));

export default tseslint.config(
  {
    ignores: ["bun.lockb"],
  },
  js.configs.recommended,
  ...tsConfigs,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
        sourceType: "module",
      },
      ecmaVersion: 2022,
    },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: true,
      },
      "import/core-modules": ["bun", "bun:test"],
    },
    rules: {
      "prettier/prettier": "error",
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],
    },
  }
);
