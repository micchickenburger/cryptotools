module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    project: './src/tsconfig.json',
  },
  ignorePatterns: [
    'node_modules/**',
    '.eslintrc.cjs',
    'jest.config.cjs',
    '*.d.ts',
  ],
  overrides: [
    {
      files: '**/*.test.ts',
      plugins: ['jest'],
      extends: [
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:jest/all',
      ],
      rules: {
        'jest/no-hooks': 'off',
      },
    },
  ],
};
