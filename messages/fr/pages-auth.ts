import type enPagesAuth from '../en/pages-auth';
import type { TranslationSchema } from '../types';

export default {
  authLayout: {
    byContinuing:
      "En poursuivant, vous acceptez nos <terms>Conditions Générales d'Utilisation</terms>, notre <privacy>Politique de Confidentialité</privacy> et notre <cookies>Politique de Cookies</cookies>.",
  },
  login: {
    backToEmail: "Retour à l'email",
    codeLabel: 'Code de vérification',
    codeSent: {
      description: 'Un code a été envoyé à <strong>{email}</strong>.',
      title: 'Code renvoyé',
    },
    description:
      'Connectez-vous à votre compte {brand} pour accéder à votre tableau de bord, gérer votre abonnement et reprendre là où vous vous êtes arrêté.',
    emailForm: {
      emailNotAuthorized: 'Email non autorisé',
      emailNotAuthorizedDescription:
        '{brand} est en phase de déploiement, durant cette période seuls quelques chanceux pourront en bénéficier. À très vite !',
      otpSent: 'Code envoyé',
      otpSentDescription:
        'Un email contenant votre code de vérification a été envoyé à {email}.',
      receiveACode: 'Recevoir un code',
    },
    invalidCode: {
      description: 'Le code saisi est incorrect ou a expiré.',
      title: 'Code invalide',
    },
    keywords: ['authentification', 'compte', 'connexion', 'se connecter'],
    orContinueWith: 'Ou poursuivez avec',
    resendCode: 'Renvoyer le code',
    resendCodeCountdown: 'Renvoyer dans {seconds}s',
    socialProviders: {
      description:
        'Utilisez vos comptes de réseaux sociaux favoris pour vous connecter instantanément à {brand} :',
      signInWith: 'Se connecter avec {provider}',
    },
    title: 'Se connecter',
    verifyCode: 'Vérifier le code',
  },
} as const satisfies TranslationSchema<typeof enPagesAuth>;
