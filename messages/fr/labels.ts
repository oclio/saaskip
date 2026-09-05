import type enLabels from '../en/labels';
import type { TranslationSchema } from '../types';

export default {
  back: 'Retour',
  backToHome: "Retour à l'accueil",
  home: 'Accueil',
  loading: 'Chargement',
  login: 'Se connecter',
  logout: 'Se déconnecter',
  menu: 'Menu',
  opensInNewTab: "(s'ouvre dans un nouvel onglet)",
} as const satisfies TranslationSchema<typeof enLabels>;
