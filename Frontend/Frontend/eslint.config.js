import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Native dialogs are unstyled, block the main thread, and are
      // unsuppressable. Use ConfirmModal for decisions, toast for messages.
      'no-restricted-globals': [
        'error',
        { name: 'alert',   message: 'Use toast from react-hot-toast instead.' },
        { name: 'confirm', message: 'Use ConfirmModal from @/components/ui/Modal instead.' },
        { name: 'prompt',  message: 'Use a Modal with an Input instead.' },
      ],
    },
  }
);
