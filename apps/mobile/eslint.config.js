// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // Type-aware rules. Expo's config wires up the TS parser but not the type
    // information these need, so turn on the project service here.
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // An async call whose rejection nobody handles fails silently — the
      // exact failure mode that made mutation errors invisible in the UI.
      "@typescript-eslint/no-floating-promises": "error",

      // Same idea for promises handed to something expecting a sync result.
      // `attributes` is off because `onPress={async () => …}` is the normal
      // React idiom and flagging it just produces noisy `void` wrappers.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],

      // AGENTS.md says avoid `any` — make that enforceable rather than advisory.
      "@typescript-eslint/no-explicit-any": "error",

      // @nudge/shared-types is types-only; `import type` keeps it erased at
      // build time instead of becoming a runtime import Metro has to resolve.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
    },
  },
  {
    ignores: ["dist/*", ".expo/*"],
  }
]);
