import type enForms from '../en/forms';
import type { TranslationSchema } from '../types';

const fr = {
  errors: {
    invalidCode: 'Le code saisi est incorrect ou a expiré.',
    invalidEmail: 'Adresse email invalide.',
    maxLength:
      'Ce champ ne peut dépasser {limit} {limit, plural, one {caractère} other {caractères}}',
    minLength:
      'Ce champ doit faire au moins {limit} {limit, plural, one {caractère} other {caractères}}',
  },
  labels: {
    yourEmail: 'Votre email',
    yourFirstName: 'Votre prénom',
    yourLastName: 'Votre nom',
  },
  placeholders: {
    email: 'paul.durand@exemple.fr',
    firstName: 'Paul',
    lastName: 'Durand',
  },
} as const satisfies TranslationSchema<typeof enForms>;

export default fr;
