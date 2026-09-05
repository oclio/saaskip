import type enErrors from '../en/errors';
import type { TranslationSchema } from '../types';

export default {
  invalidEmailDomain: "Le domaine de l'email ne semble pas valide.",
  rateLimitExceeded: 'Trop de requêtes. Veuillez réessayer plus tard.',
  title: 'Erreur',
  turnstileFailed: 'La vérification anti-bot a échoué. Veuillez réessayer.',
  unexpectedError:
    "Une erreur inattendue s'est produite, si le problème persiste, veuillez contacter le support.",
  validationFailed:
    'Veuillez corriger les champs en erreur avant de soumettre.',
} as const satisfies TranslationSchema<typeof enErrors>;
