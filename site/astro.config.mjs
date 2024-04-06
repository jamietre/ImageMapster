import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  // astro hasn't made import.meta.env available yet so we need
  // to use process to obtain variables
  // https://github.com/withastro/astro/issues/3897#issuecomment-1181381500
  site: process.env.SITE_URL || 'https://jamietre.github.io',
  base: process.env.BASE_PATH || 'ImageMapster',
  integrations: [
    starlight({
      title: 'My Docs',
      social: {
        github: 'https://github.com/withastro/starlight'
      },
      sidebar: [
        {
          label: 'Guides',
          items: [
            // Each item here is one entry in the navigation menu.
            { label: 'Example Guide', link: '/guides/example/' }
          ]
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' }
        }
      ]
    })
  ]
});
