import type enDashboard from '../en/dashboard';
import type { TranslationSchema } from '../types';

const fr = {
  home: {
    title: 'Tableau de bord',
  },
} as const satisfies TranslationSchema<typeof enDashboard>;

export default fr;
