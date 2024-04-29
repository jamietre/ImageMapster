module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsonc/recommended-with-jsonc',
    'plugin:mdx/recommended',
    'plugin:astro/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: true,
    tsconfigRootDir: __dirname
  },
  settings: {
    'mdx/code-blocks': true
  },
  overrides: [
    {
      files: ['./src/components/demos/**/map.js'],
      env: {
        browser: true,
        jquery: true
      }
    },
    {
      files: ['*.mdx'],
      rules: {
        'react/jsx-uses-vars': 'error'
      }
    },
    {
      files: ['**/*.{md,mdx}/**'],
      parserOptions: {
        project: false
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off'
      }
    },
    {
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      files: ['./**/*.cjs'],
      env: {
        node: true
      }
    },
    {
      files: ['astro.config.mjs'],
      env: {
        node: true
      }
    }
  ]
};
