import type enEmails from '../en/emails';
import type { TranslationSchema } from '../types';

const fr = {
  footer: "Oubliez « Production-Ready ». Bâtissez sur de l'Indéstructible.",
  loginVerificationCode: {
    content:
      'Utilisez le code de vérification ci-dessous pour finaliser votre connexion à votre compte Shaper.',
    disclaimer:
      "Votre code de vérification est valable 1 jour. Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail en toute sécurité.",
    greeting: 'Bonjour,',
    preview: 'Votre code de vérification',
    title: 'Code de vérification',
  },
  newsletterConfirmation: {
    button: 'Confirmer mon abonnement',
    content:
      'Merci pour votre intérêt pour {brand} ! Veuillez confirmer votre adresse e-mail pour finaliser votre abonnement :',
    disclaimer:
      'Si vous ne vous êtes pas inscrit à cette newsletter, vous pouvez ignorer cet e-mail en toute sécurité.',
    footnote: "L'équipe {brand}",
    greeting: 'Bonjour,',
    preview: 'Confirmez votre abonnement à la newsletter',
    title: 'Abonnement à la newsletter',
  },
} as const satisfies TranslationSchema<typeof enEmails>;

export default fr;
