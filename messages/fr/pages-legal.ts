import type enPagesLegal from '../en/pages-legal';
import type { TranslationSchema } from '../types';

export default {
  cookies: {
    description:
      'Découvrez comment {brand} utilise les cookies et technologies similaires pour améliorer votre navigation, mesurer les performances et optimiser nos services.',
    keywords: ['confidentialité', 'consentement', 'cookies', 'suivi'],
    shortTitle: 'Cookies',
    title: 'Politique de Cookies',
  },
  license: {
    description:
      'Consultez les termes de la licence logicielle qui régissent votre utilisation de {brand}, incluant les usages autorisés, les restrictions et les droits de propriété intellectuelle.',
    keywords: ['conditions', 'licence', 'logiciel', 'propriété intellectuelle'],
    title: 'Licence',
  },
  privacy: {
    description:
      'Comprenez comment {brand} collecte, utilise et protège vos données personnelles conformément aux lois et réglementations applicables en matière de confidentialité.',
    keywords: [
      'confidentialité',
      'données personnelles',
      'protection des données',
      'rgpd',
    ],
    shortTitle: 'Confidentialité',
    title: 'Politique de Confidentialité',
  },
  terms: {
    description:
      "Lisez les conditions générales d'utilisation qui régissent votre utilisation de {brand}, incluant vos droits, vos responsabilités et les limites de responsabilité.",
    keywords: ['accord', 'cgu', 'conditions', 'conditions générales'],
    shortTitle: 'CGU',
    title: "Conditions Générales d'Utilisation",
  },
} as const satisfies TranslationSchema<typeof enPagesLegal>;
