// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default defineConfig([
  // 1. Archivos que ESLint debe ignorar por completo
  {
    ignores: ['**/.next/**', '**/node_modules/**', '**/dist/**']
  },

  // 2. Configuración base recomendada para JavaScript y TypeScript
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. Tus personalizaciones para TypeScript (.ts y .tsx)
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
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-unused-vars': 'off',
    },
  },

  // 4. NUEVO: Configuración para permitir archivos CommonJS (.cjs) como Tailwind y PostCSS
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node, // Esto le dice a ESLint que "module" y "require" son válidos aquí
      },
    },
  },
]);
