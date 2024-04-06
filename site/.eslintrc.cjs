module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsonc/recommended-with-jsonc',
    // Need plug:react even though we're not using react because mdx is MD & "JSX"
    // and react plugin applies related rules.  For example:
    //  https://github.com/mdx-js/eslint-mdx/issues/444
    //  https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-uses-vars.md
    'plugin:react/recommended',
    // to support new JSX Transform https://github.com/jsx-eslint/eslint-plugin-react?tab=readme-ov-file#configuration-legacy-eslintrc-
    'plugin:react/jsx-runtime',
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
    'mdx/code-blocks': true,
    react: {
      // don't have react installed and will get a warning with 'detect' so using 'latest' as defined by
      // https://github.com/jsx-eslint/eslint-plugin-react/blob/e4ecbcfc8f83099a9bd5da18f45b5a6e66ebfb4a/lib/util/version.js#L74
      // See
      //   https://github.com/jsx-eslint/eslint-plugin-react/issues/1955
      //   https://github.com/jsx-eslint/eslint-plugin-react/issues/1981
      version: '999.999.999'
    }
  },
  overrides: [
    {
      files: ['**/*.{md,mdx}/*.{js,ts}'],
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
    }
  ]
};
