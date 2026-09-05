export default {
  authLayout: {
    byContinuing:
      'By continuing, you agree to our <terms>Terms of Service</terms>, our <privacy>Privacy Policy</privacy> and our <cookies>Cookie Policy</cookies>.',
  },
  login: {
    backToEmail: 'Back to email',
    codeLabel: 'Verification code',
    codeSent: {
      description: 'A code has been sent to <strong>{email}</strong>.',
      title: 'Code resent',
    },
    description:
      'Sign in to your {brand} account to access your dashboard, manage your subscription, and continue where you left off.',
    emailForm: {
      emailNotAuthorized: 'Email not authorized',
      emailNotAuthorizedDescription:
        '{brand} is in its deployment phase, during this period only a few lucky ones will benefit. See you soon!',
      otpSent: 'Code sent',
      otpSentDescription:
        'An email containing your verification code has been sent to {email}.',
      receiveACode: 'Receive a code',
    },
    invalidCode: {
      description: 'The code entered is incorrect or has expired.',
      title: 'Invalid code',
    },
    keywords: ['account', 'authentication', 'login', 'sign in'],
    orContinueWith: 'Or continue with',
    resendCode: 'Resend code',
    resendCodeCountdown: 'Resend in {seconds}s',
    socialProviders: {
      description:
        'Use your favorite social media accounts to instantly sign in to {brand}:',
      signInWith: 'Sign in with {provider}',
    },
    title: 'Login',
    verifyCode: 'Verify code',
  },
} as const;
