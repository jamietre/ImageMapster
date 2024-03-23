module.exports = {
  settings: {
    bullet: '-',
    emphasis: '_',
    listItemIndent: 'one',
    quote: "'",
    rule: '-',
    strong: '*',
    tightDefinitions: true
  },
  plugins: [
    'remark-preset-lint-consistent',
    'remark-preset-lint-markdown-style-guide',
    'remark-preset-lint-recommended',
    'remark-preset-prettier',
    ['remark-lint-list-item-indent', 'space'],
    ['remark-lint-maximum-line-length', false],
    ['remark-lint-list-item-spacing', { checkBlanks: true }],
    ['remark-lint-no-file-name-irregular-characters', false],
    ['remark-lint-ordered-list-marker-value', 'ordered'],
    ['remark-lint-emphasis-marker', '_'],
    ['remark-lint-unordered-list-marker-style', '-'],
    ['remark-lint-link-title-style', "'"],
    ['remark-lint-rule-style', '---'],
    ['remark-lint-strong-marker', '*'],
    'remark-frontmatter',
    'remark-gfm'
  ]
};
