import ignore from './ignore.mjs';

const config = {
  dictionaries: ['node', 'npm', 'softwareTerms', 'typescript'],
  ignorePaths: [
    ...ignore,
    '**/docs/**',
    '.github/workflows/**',
    'drizzle/**',
    'messages/fr/**',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'src/app/[locale]/**/__e2e__/**',
  ],
  language: 'en,fr',
  words: [
    'arcjet',
    'axiomhq',
    'credentialless',
    'emaillist',
    'français',
    'healthcheck',
    'httponly',
    'hugeicons',
    'isready',
    'lintignore',
    'msvalidate',
    'nojekyll',
    'nosniff',
    'oclio',
    'oklch',
    'pgvector',
    'prerendering',
    'saaskip',
    'sonarqube',
    'srcs',
    'ttfb',
    'turbopack',
    'unstub',
  ],
};

export default config;
