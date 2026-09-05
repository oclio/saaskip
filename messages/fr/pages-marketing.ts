import type enPagesMarketing from '../en/pages-marketing';
import type { TranslationSchema } from '../types';

export default {
  about: {
    title: 'À propos',
  },
  blog: {
    title: 'Blog',
  },
  partners: {
    title: 'Partenaires',
  },
  press: {
    title: 'Presse',
  },
} as const satisfies TranslationSchema<typeof enPagesMarketing>;
