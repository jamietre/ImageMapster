import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { rehypeAutoLink, rehypeExternalLink } from './plugins/rehype.ts';
import rehypeSlug from 'rehype-slug';
import rehypeAstroRelativeMarkdownLinks from 'astro-rehype-relative-markdown-links';

const sharedConfig = {
  // astro hasn't made import.meta.env available yet so we need
  // to use process to obtain variables
  // https://github.com/withastro/astro/issues/3897#issuecomment-1181381500
  base: process.env.BASE_PATH || 'ImageMapster',
  site: process.env.SITE_URL || 'https://jamietre.github.io',
  // github pages redirects to trailingSlash urls so force dev
  // server to use them to help ensure we are using proper
  // paths and avoid unnecessary 301's by GH servers
  trailingSlash: 'always'
};

export default defineConfig({
  ...sharedConfig,
  site: process.env.SITE_URL || 'https://jamietre.github.io',
  base: process.env.BASE_PATH || 'ImageMapster',
  vite: {
    resolve: {
      /*
         Vite treats linked dependencies differently than standard dependencies (e.g., they aren't included for optimization by default).
         Vite is including the 'sites' import of jquery and also imagemapsters peer dependency of jquery resulting in jquery being in the
         bundled output twice (this is likely a Vite bug).  To avoid and ensure we only get jquery once, we dedupe.

         Note - This would not be needed if imagemapster was not a linked dependency, Vite properly dedupes when standard dependency.
         Note - Could alternatively use alias or a package like https://github.com/mgcrea/vite-plugin-linked-dependencies
         See
           https://vitejs.dev/config/shared-options#resolve-dedupe
           https://vitejs.dev/config/shared-options#resolve-alias
      */
      dedupe: ['jquery']
    }
  },
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAstroRelativeMarkdownLinks,
        {
          basePath: sharedConfig.base,
          trailingSlash: sharedConfig.trailingSlash,
          contentPath: 'src/content/docs',
          collectionPathMode: 'root'
        }
      ],
      ...rehypeAutoLink(),
      ...rehypeExternalLink()
    ]
  },
  integrations: [
    starlight({
      title: 'ImageMapster',
      social: {
        github: 'https://github.com/jamietre/ImageMapster'
      },
      components: {
        ThemeSelect: './src/components/starlight/theme-select.astro'
      },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Overview',
          items: [
            {
              label: 'Introduction',
              link: '/overview/introduction/'
            },
            {
              label: 'Getting Started',
              link: '/overview/getting-started/'
            },
            { label: 'Demos', link: '/overview/demos/' }
          ]
        },
        {
          label: 'Reference',
          items: [
            { label: 'Terminology', link: '/reference/terminology/' },
            {
              label: 'Configuration Reference',
              link: '/reference/configuration-reference/'
            },
            { label: 'API Reference', link: '/reference/api-reference/' }
          ]
        },
        {
          label: 'Resources',
          items: [
            {
              label: 'FAQ',
              link: '/resources/faq/'
            },
            {
              label: 'Feedback',
              link: '/resources/feedback/'
            },
            {
              label: 'Live Examples',
              link: '/resources/live-examples/'
            },
            {
              label: 'Support',
              link: 'https://github.com/jamietre/ImageMapster/blob/main/SUPPORT.md',
              attrs: { class: 'external-link', rel: 'nofollow' }
            },
            {
              label: 'Changelog',
              link: 'https://github.com/jamietre/ImageMapster/blob/main/CHANGELOG.md',
              attrs: { class: 'external-link', rel: 'nofollow' }
            },
            {
              label: 'License',
              link: 'https://github.com/jamietre/ImageMapster/blob/main/LICENSE',
              attrs: { class: 'external-link', rel: 'nofollow' }
            }
          ]
        }
      ]
    })
  ]
});
