import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginTypeScript from 'typescript-eslint';
import eslintPluginYml from 'eslint-plugin-yml';
import eslintPluginAstro from 'eslint-plugin-astro';
import eslintPluginJsonc from 'eslint-plugin-jsonc';
import eslintPluginHtmlInlineScripts from 'eslint-plugin-html';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginHtml from '@html-eslint/eslint-plugin';
import eslintPluginHtmlParser from '@html-eslint/parser';
import eslintPluginMdx from 'eslint-plugin-mdx';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

// TODO: Change to import.meta.dirname once Node 18 is no longer supported (Node >= >=20.11.0)
const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname
});

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...[
    ...compat.extends('jquery'),
    {
      languageOptions: {
        sourceType: 'script',
        ecmaVersion: 5,
        globals: { ...globals.browser, ...globals.jquery }
      },
      rules: {
        'one-var': ['error', { var: 'consecutive' }],
        strict: ['error', 'function'],
        'no-nested-ternary': 0,
        camelcase: 0,
        'no-console': ['error', { allow: ['warn', 'error'] }]
      }
    }
  ].map((cfg) => ({
    ignores: [
      'site/**',
      '!site/src/components/demos/**/map.{js,html}',
      '**/*.{mjs,cjs}'
    ],
    ...cfg
  })),
  {
    ignores: [
      '**/redist/**',
      '**/build/**',
      '**/dist/**',
      '**/.astro/**',
      'docs/**'
    ]
  },
  {
    files: ['site/src/components/demos/**/map.js'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          // these files are directly displayed in `Scripts` tab in website so avoid having to include use strict
          impliedStrict: true
        }
      }
    }
  },
  {
    files: ['.remarkrc.mjs'],
    languageOptions: { globals: { ...globals.node } }
  },
  pluginJs.configs.recommended,
  ...pluginTypeScript.config({
    files: ['site/**/*.{js,mjs,cjs,ts}'],
    ignores: ['site/src/components/demos/**/map.js'],
    extends: [
      pluginTypeScript.configs.strictTypeChecked,
      pluginTypeScript.configs.stylisticTypeChecked
    ],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: `${__dirname}/site`
      }
    }
  }),
  ...eslintPluginAstro.configs.recommended,
  {
    ...eslintPluginMdx.flat,
    processor: eslintPluginMdx.createRemarkProcessor({
      lintCodeBlocks: true
    }),
    rules: {
      ...eslintPluginMdx.flat.rules,
      'no-unused-vars': 'off'
    }
  },
  {
    ...eslintPluginMdx.flatCodeBlocks,
    rules: {
      ...eslintPluginMdx.flatCodeBlocks.rules,
      'no-var': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    // Configuration for `<script>` tag using TypeScript in `.astro` files and code blocks in markdown.
    files: ['site/**/*.astro/*.ts', 'site/**/*.{md,mdx}/*.js'],
    languageOptions: {
      parserOptions: {
        project: false
      }
    },
    rules: {
      ...pluginTypeScript.configs.disableTypeChecked.rules
    }
  },
  ...eslintPluginYml.configs['flat/recommended'],
  ...eslintPluginJsonc.configs['flat/recommended-with-jsonc'],
  {
    ...eslintPluginHtml.configs['flat/recommended'],
    files: ['**/*.html'],
    plugins: {
      eslintPluginHtmlInlineScripts,
      '@html-eslint': eslintPluginHtml
    },
    languageOptions: {
      parser: eslintPluginHtmlParser
    },
    settings: {
      'html/indent': '+2',
      'html/report-bad-indent': 'error'
    },
    rules: {
      ...eslintPluginHtml.configs['flat/recommended'].rules,
      '@html-eslint/require-img-alt': 'off',
      /* Disable rules that conflict with prettier */
      '@html-eslint/require-closing-tags': 'off',
      '@html-eslint/no-multiple-empty-lines': 'off',
      '@html-eslint/no-extra-spacing-attrs': 'off',
      '@html-eslint/element-newline': 'off',
      '@html-eslint/indent': 'off',
      '@html-eslint/quotes': 'off',
      '@html-eslint/no-trailing-spaces': 'off',
      '@html-eslint/attrs-newline': 'off'
    }
  },
  eslintConfigPrettier
];
