
import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import pluginVue from "eslint-plugin-vue";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    // Vue plugin flat config (Vue 3)
    ...pluginVue.configs['flat/recommended'],
    {
        files: ["**/*.{js,ts,vue}"],
        ignores: ["dist/**", "node_modules/**", "src/components/ui/**"],
        extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
            },
            parser: tsParser,
            ecmaVersion: 12,
            sourceType: "module",
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "complexity": ["warn", { max: 10 }],
            "max-depth": ["warn", { max: 5 }],
            "no-unused-vars": "off"
        },
    }
]);