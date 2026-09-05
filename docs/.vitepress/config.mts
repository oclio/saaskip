import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitepress';

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../src', import.meta.url)),
      },
    },
  },
  title: 'saaskip',
  description: 'The opinionated Next.js SaaS starter for senior devs.',

  base: '/',
  cleanUrls: true,
  ignoreDeadLinks: true,

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],

  sitemap: {
    hostname: 'https://docs.saaskip.dev',
  },

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/getting-started/' },
      { text: 'Core', link: '/core/architecture' },
      { text: 'UI', link: '/ui' },
      { text: 'API', link: '/api/health' },
    ],

    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Quick Start', link: '/getting-started/' },
            { text: 'Onboarding', link: '/getting-started/onboarding' },
            { text: 'Scripts', link: '/getting-started/scripts' },
            { text: 'Infrastructure', link: '/getting-started/infrastructure' },
          ],
        },
        {
          text: 'Core',
          items: [
            { text: 'Architecture', link: '/core/architecture' },
            { text: 'Environment Variables', link: '/core/env' },
            { text: 'Authentication', link: '/core/auth' },
            { text: 'Database', link: '/core/database' },
            { text: 'Forms', link: '/core/forms' },
            { text: 'Security', link: '/core/security' },
            { text: 'Observability', link: '/core/observability' },
            { text: 'Mailer', link: '/core/mailer' },
            { text: 'Internationalization', link: '/core/i18n' },
            { text: 'SEO', link: '/core/seo' },
          ],
        },
        {
          text: 'UI',
          items: [{ text: 'Overview', link: '/ui' }],
        },
        {
          text: 'API',
          items: [{ text: 'Endpoints', link: '/api/health' }],
        },
      ],
    },

    search: {
      provider: 'local',
    },

    footer: {
      message:
        'Released under the <a href="https://github.com/oclio/saaskip/blob/main/LICENSE">MIT License</a> · <a href="https://github.com/sponsors/oclio">GitHub Sponsors</a> · <a href="https://buymeacoffee.com/oclio">Buy Me a Coffee</a>',
      copyright:
        'Copyright © 2026 <a href="https://oclio.dev">@oclio</a> — TypeScript Engineer',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/oclio/saaskip' }],

    editLink: {
      pattern: 'https://github.com/oclio/saaskip/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
});
