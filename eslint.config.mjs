import html from 'eslint-plugin-html';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import mdxeslint from 'eslint-plugin-mdx';
import jseslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginYml from 'eslint-plugin-yml';
import eslintPluginJsonc from 'eslint-plugin-jsonc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default [
  {
    files: [
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.html',
      '**/*.yml',
      '**/*.yaml',
      '**/*.md',
      '**/*.mdx',
      '**/*.json',
      '**/*.jsonc',
      '**/*.ts',
      '**/*.tsx',
      '**/*.astro'
    ]
  },
  {
    ignores: [
      'tests/redist/',
      'examples/redist/',
      '**/build/',
      '**/dist/',
      '**/node_modules/',
      '!.github',
      '!.vscode',
      '**/package-lock.json',
      '!**/.*.json',
      '!**/.*.jsonc',
      'docs/',
      '**/*.d.ts',
      '**/.astro/'
    ]
  },
  jseslint.configs.recommended,
  ...compat.extends('jquery'),
  eslintConfigPrettier,
  ...eslintPluginYml.configs['flat/standard'],
  ...eslintPluginYml.configs['flat/prettier'],
  ...eslintPluginJsonc.configs['flat/recommended-with-jsonc'],
  ...eslintPluginAstro.configs.recommended,
  {
    plugins: {
      html
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jquery
      },
      ecmaVersion: 5,
      sourceType: 'script'
    },
    settings: {
      'html/indent': '+2',
      'html/report-bad-indent': 'error'
    },
    rules: {
      'one-var': ['error', { var: 'consecutive' }],
      strict: ['error', 'function'],
      'no-nested-ternary': 0,
      camelcase: 0,
      'no-console': ['error', { allow: ['warn', 'error'] }]
    }
  },
  {
    ...mdxeslint.flat,
    processor: mdxeslint.createRemarkProcessor({
      lintCodeBlocks: true
    }),
    rules: {
      ...mdxeslint.flat.rules,
      'no-unused-vars': 'off'
    }
  },
  mdxeslint.flatCodeBlocks,
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    }
  },
  {
    files: ['.remarkrc.js'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['site/**/*'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    }
  },
  ...tseslint.config({
    files: ['site/**/*.ts'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: `${__dirname}/site`
      }
    }
  }),
  {
    files: ['site/astro.config.mjs'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
