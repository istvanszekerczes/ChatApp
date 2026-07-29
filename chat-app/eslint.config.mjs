import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/**',
      '.angular/**',
      'node_modules/**',
      '.vscode/**',
      'package-lock.json'
    ]
  },
  
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ngDevMode: 'readonly',
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
];