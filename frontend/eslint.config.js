import js from "@eslint/js";
import globals from "globals";
import preact from "eslint-config-preact";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import tailwind from "eslint-plugin-tailwindcss";
import { fileURLToPath } from "url";
import { dirname } from "path";

export default defineConfig([
  ...tailwind.configs["flat/recommended"],
  ...preact,
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
  },
  {
    languageOptions: {
      globals: {
        __APP_VERSION__: "readonly",
      },
    },
  },
  {
    settings: {
      tailwindcss: {
        config: dirname(fileURLToPath(import.meta.url)) + "/src/styles/tailwind.css",
      },
    },
  },
]);
