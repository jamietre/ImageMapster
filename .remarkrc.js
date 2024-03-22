module.exports = {
  settings: {
    bullet: '-',
    emphasis: '*',
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
    ['remark-lint-list-item-indent', 'space'],
    ['remark-lint-maximum-line-length', false],
    ['remark-lint-list-item-spacing', { checkBlanks: true }],
    ['remark-lint-no-file-name-irregular-characters', false],
    ['remark-lint-ordered-list-marker-value', 'ordered'],
    'remark-frontmatter',
    'remark-gfm'
  ]
};
