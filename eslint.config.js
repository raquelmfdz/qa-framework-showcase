import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: ['**/.next/**', '**/node_modules/**', '**/dist/**']
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      globals: {
        // Node globals (for scripts, API routes)
        console: 'readonly',
        process: 'readonly',
        // Browser globals (for client components)
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        Node: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        URLSearchParams: 'readonly',
        URL: 'readonly',
        Request: 'readonly',
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-unused-vars': 'off', // use TS version instead
    },
  },
]