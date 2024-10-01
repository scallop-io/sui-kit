import globals from 'globals';
import jsLint from '@eslint/js';
import tsLint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfigs from 'eslint-config-prettier';
import { fixupPluginRules, fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: jsLint.configs.recommended,
  allConfig: jsLint.configs.all,
});

const esConfigs = [
  {
    ignores: ['dist/**/*', 'docs/**/*'],
  },
  {
    files: ['**/*.{ts}'],
    plugins: {
      '@typescript-eslint': tsLint.plugin,
      prettier: fixupPluginRules(prettierPlugin),
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parser: tsLint.parser,
      parserOptions: {
        projectService: true,
        project: './tsconfig.json',
      },
    },
    rules: {
      'prettier/prettier': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  ...fixupConfigRules(compat.extends('plugin:prettier/recommended')),
  ...tsLint.configs.recommended,
  prettierConfigs,
];

export default esConfigs;
