import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ["**/*.{js,mjs,cjs,ts,vue}"] },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs["flat/essential"],
    { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
    {
        rules: {
            "@typescript-eslint/no-namespace": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "indent": ["error", 4],
            "semi": ["error", "always"]
        },
    },
    {
        files: ["**/*.cjs"],
        languageOptions: { globals: globals.node },
        rules: {
            "@typescript-eslint/no-require-imports": "off"
        }
    },
    {
        ignores: ["dist", "config/webpack/generated/**/*"]
    }
];