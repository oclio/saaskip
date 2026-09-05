import type hooksEn from '../en/hooks';
import type { TranslationSchema } from '../types';

export default {
  useSignOut: {
    success: 'Vous avez été déconnecté avec succès !',
  },
} as const satisfies TranslationSchema<typeof hooksEn>;
