
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import vueParser from "vue-eslint-parser";
import pluginVue from "eslint-plugin-vue";

export default [
    // Vue files configuration
    {
        files: ["**/*.vue"],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                ecmaVersion: 2020,
                sourceType: "module",
                extraFileExtensions: [".vue"]
            },
            globals: {
                ...globals.browser,
            }
        },
        plugins: {
            "vue": pluginVue,
            "@typescript-eslint": typescriptEslint,
        },
        rules: {
                ...(pluginVue.configs && pluginVue.configs["vue3-recommended"] && pluginVue.configs["vue3-recommended"].rules ? pluginVue.configs["vue3-recommended"].rules : {}),
                "vue/multi-word-component-names": "off",
        },
    },
    // TypeScript and JavaScript files
    {
        files: ["**/*.{js,ts}"],
        ignores: ["dist/**", "node_modules/**"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
            },
            parser: tsParser,
            ecmaVersion: 2020,
            sourceType: "module",
        },
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },
        rules: {
                ...(typescriptEslint.configs && typescriptEslint.configs["recommended"] && typescriptEslint.configs["recommended"].rules ? typescriptEslint.configs["recommended"].rules : {})
        },
    }
];