// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default defineConfig([
  // 1. Files ESLint should ignore entirely.
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/axe-reports/**',
    ],
  },

  // 2. Recommended baseline config for JavaScript and TypeScript.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. Project-specific TypeScript customization (.ts and .tsx).
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',
    },
  },

  // 4. Allow CommonJS config files (.cjs), such as Tailwind and PostCSS.
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // 5. k6 runtime globals used by load scripts.
  {
    files: ['non-functional-tests/load/**/*.js'],
    languageOptions: {
      globals: {
        __ENV: 'readonly',
        __ITER: 'readonly',
      },
    },
  },

  // 6. Node runtime scripts used by GitHub workflows.
  {
    files: ['.github/scripts/**/*.js', '.github/scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]);
