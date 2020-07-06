module.exports = {
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'script',
  },
  env: {
    browser: true,
    es2017: true,
  },
  rules: {
    'no-unused-vars': 'error',
    'no-undef': 'error',
  },
  globals: {
    a: 'readonly',
    b: 'readonly',
    c: 'readonly',
    d: 'readonly',
    title: 'readonly',
  },
};
