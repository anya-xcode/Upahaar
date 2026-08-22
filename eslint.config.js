import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * One flat config for both workspaces.
 *
 * Deliberately close to `js.configs.recommended` — the value here is catching
 * the class of bug that has actually bitten this codebase (an identifier used
 * but never imported, which Rollup compiles happily and the browser throws on),
 * not enforcing a house style.
 */
export default [
  { ignores: ['**/node_modules/**', '**/dist/**', 'client/public/**'] },

  js.configs.recommended,

  // --- server ---
  {
    files: ['server/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // --- client ---
  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',

      // Apostrophes and quotes in prose are intentional; the copy on this site
      // is written, not escaped.
      'react/no-unescaped-entities': 'off',

      /**
       * These components resolve an icon from a module-level registry:
       *   const Icon = resolveIcon(key)  ->  <Icon />
       * The reference is stable across renders, so nothing remounts. The rule
       * cannot distinguish that from defining a component inline, which would
       * be a real bug.
       */
      'react-hooks/static-components': 'off',

      // Worth seeing, not worth blocking: async fetch-then-setState in an
      // effect is the standard pattern here.
      'react-hooks/set-state-in-effect': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // The bug class that shipped once already.
      'no-undef': 'error',
    },
  },

  // --- build + config files run in Node ---
  {
    files: ['**/vite.config.js', '**/tailwind.config.js', '**/postcss.config.js', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },

  // --- tests ---
  {
    files: ['server/tests/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
