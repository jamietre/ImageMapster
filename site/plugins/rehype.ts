import type { RehypePlugins } from 'astro';
import { toString } from 'hast-util-to-string';
import { h } from 'hastscript';
import rehypeAutoLinkHeadings, {
  type Options as AutoLinkOptions
} from 'rehype-autolink-headings';
import rehypeExternalLinks, {
  type Options as ExternalLinkOoptions
} from 'rehype-external-links';
import { escape } from 'html-escaper';

const AnchorLinkIcon = h(
  'span',
  { ariaHidden: 'true', class: 'anchor-icon' },
  h(
    'svg',
    { width: 16, height: 16, viewBox: '0 0 24 24' },
    h('path', {
      fill: 'currentcolor',
      d: 'm12.11 15.39-3.88 3.88a2.52 2.52 0 0 1-3.5 0 2.47 2.47 0 0 1 0-3.5l3.88-3.88a1 1 0 0 0-1.42-1.42l-3.88 3.89a4.48 4.48 0 0 0 6.33 6.33l3.89-3.88a1 1 0 1 0-1.42-1.42Zm8.58-12.08a4.49 4.49 0 0 0-6.33 0l-3.89 3.88a1 1 0 0 0 1.42 1.42l3.88-3.88a2.52 2.52 0 0 1 3.5 0 2.47 2.47 0 0 1 0 3.5l-3.88 3.88a1 1 0 1 0 1.42 1.42l3.88-3.89a4.49 4.49 0 0 0 0-6.33ZM8.83 15.17a1 1 0 0 0 1.1.22 1 1 0 0 0 .32-.22l4.92-4.92a1 1 0 0 0-1.42-1.42l-4.92 4.92a1 1 0 0 0 0 1.42Z'
    })
  )
);

const createSROnlyLabel = (text: string) => {
  return h(
    'span',
    { 'is:raw': true, class: 'sr-only' },
    `Section titled ${escape(text)}`
  );
};

/**
 * Configuration for the `rehype-autolink-headings` plugin.
 * This set-up was informed by https://amberwilson.co.uk/blog/are-your-anchor-links-accessible/
 */
const autoLinkConfig: AutoLinkOptions = {
  properties: { class: 'anchor-link' },
  behavior: 'after',
  group: ({ tagName }) =>
    h('div', { tabIndex: -1, class: `heading-wrapper level-${tagName}` }),
  content: (heading) => [AnchorLinkIcon, createSROnlyLabel(toString(heading))]
};

const externalLinkConfig: ExternalLinkOoptions = {
  properties: { class: 'external-link' },
  content: { type: 'text', value: 'External link leaves this site' },
  contentProperties: { className: 'sr-only' }
};

/**
 * Configure heading anchor links.
 * Spread this into Astro’s `markdown.rehypePlugins` option.
 */
export const rehypeAutoLink = (): RehypePlugins => [
  [rehypeAutoLinkHeadings, autoLinkConfig]
];

export const rehypeExternalLink = (): RehypePlugins => [
  [rehypeExternalLinks, externalLinkConfig]
];
