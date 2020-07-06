module.exports = {
  extends: 'eslint:recommended',
  rules: {
    'no-constant-condition': ['error', { checkLoops: false }],
  },
  ignorePatterns: ['.*.js'],
  overrides: [
    {
      files: ['src.js'],
      parserOptions: {
        ecmaVersion: 2017, // Power x**y, and trailing commas in calls.
        sourceType: 'script',
      },
      env: {
        browser: true,
        es2017: true,
      },
      globals: {
        a: 'readonly',
        b: 'readonly',
        c: 'readonly',
        d: 'readonly',
        title: 'readonly',
      },
    },
    {
      files: ['record.js', 'reload.js'],
      parserOptions: {
        ecmaVersion: 2017, // Power x**y, and trailing commas in calls.
        sourceType: 'module',
      },
      env: {
        browser: true,
        es2017: true,
      },
    },
    {
      files: ['build.mjs'],
      parserOptions: {
        ecmaVersion: 2020, // import.meta
        sourceType: 'module',
      },
      env: {
        es2017: true,
        node: true,
      },
    },
  ],
};
