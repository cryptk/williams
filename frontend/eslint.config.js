import js from "@eslint/js";
import globals from "globals";
import preact from "eslint-config-preact";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // ...preact,
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
]);
