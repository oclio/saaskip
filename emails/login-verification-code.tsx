import { Section, Tailwind, Text } from '@react-email/components';

import { brand } from '@/config/brand';
import EmailBody from '@/emails/_components/email-body';

interface Properties {
  locale: string;
  code: string;
  labels: {
    preview: string;
    title: string;
    greeting: string;
    content: string;
    disclaimer: string;
    footnote: string;
  };
}

export default function LoginVerificationCode({
  locale = 'en',
  code = '123456',
  labels = {
    preview: 'Verification code',
    title: 'Connection',
    greeting: 'Hello,',
    content: 'Here is your verification code to connect to LiftBase:',
    disclaimer:
      'This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.',
    footnote: `The ${brand.title} team`,
  },
}: Readonly<Properties>) {
  return (
    <EmailBody
      locale={locale}
      preview={labels.preview}
      title={labels.title}
      footnote={labels.footnote}
    >
      <Tailwind>
        <Text
          data-testid="greeting"
          className="text-left text-base leading-6 text-gray-600"
        >
          {labels.greeting}
        </Text>
        <Text
          data-testid="content"
          className="text-left text-base leading-6 text-gray-600"
        >
          {labels.content}
        </Text>

        <Section
          data-testid="code-box"
          className="my-8 rounded-lg bg-gray-100 py-4 text-center"
        >
          <Text
            data-testid="otp-code"
            className="m-0 text-center text-4xl font-bold tracking-[8px] text-gray-900"
          >
            {code}
          </Text>
        </Section>

        <Text
          data-testid="disclaimer"
          className="mt-5 text-sm leading-5 text-gray-500"
        >
          {labels.disclaimer}
        </Text>
      </Tailwind>
    </EmailBody>
  );
}
