export default {
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
    ['remark-lint-file-extension', ['md', 'mdx']],
    ['remark-lint-list-item-indent', 'one'],
    ['remark-lint-maximum-line-length', false],
    ['remark-lint-list-item-spacing', { checkBlanks: true }],
    ['remark-lint-no-file-name-irregular-characters', false],
    ['remark-lint-ordered-list-marker-value', 'ordered'],
    ['remark-lint-emphasis-marker', '_'],
    ['remark-lint-unordered-list-marker-style', '-'],
    ['remark-lint-link-title-style', "'"],
    ['remark-lint-rule-style', '---'],
    ['remark-lint-strong-marker', '*'],
    // remark-validate-links does NOT check headings in other markdown files, the CLI is required for that (see
    // the note at the bottom of the Use section at https://github.com/remarkjs/remark-validate-links?tab=readme-ov-file#use).
    // TODO: Determine how to configure .remarkrc.js to parse/evaluate content inside of MDX blocks when invoked via CLI and
    // then add call to CLI during dist build to validate all links
    'remark-validate-links',
    // remark-link-no-dead-urls slows down eslint a lot so we disable during standard processing
    // and check external urls only when explicitly enabled (e.g., dist build)
    process.env.CHECK_LINKS
      ? [
          'remark-lint-no-dead-urls',
          {
            // TODO: jsFiddle sits behind cloudflare which has a human detector
            // there may be a way using https://radar.cloudflare.com/ to bypass
            // but dead-or-alive library doesn't support.  Need to find a solution
            // to validate jsfiddle urls.
            skipUrlPatterns: [/^https:\/\/(www\.)?jsfiddle\.net\/[^\s]*$/]
          }
        ]
      : null,
    'remark-frontmatter',
    'remark-gfm'
  ].filter(Boolean)
};
