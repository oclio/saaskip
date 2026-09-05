import { Button, Link, Section, Tailwind, Text } from '@react-email/components';

import { brand } from '@/config/brand';
import EmailBody from '@/emails/_components/email-body';

interface Properties {
  url: string;
  token: string;
  locale: string;
  labels: {
    preview: string;
    title: string;
    greeting: string;
    content: string;
    button: string;
    disclaimer: string;
    footnote: string;
  };
}

export default function NewsletterConfirmation({
  url = 'https://saaskip.dev/newsletter/confirm?token=xyz',
  locale = 'en',
  labels = {
    preview: 'Confirm your subscription',
    title: 'Newsletter Subscription',
    greeting: 'Hello,',
    content: `Thank you for your interest in ${brand.title}! Please confirm your email address to finalize your subscription:`,
    button: 'Confirm my subscription',
    disclaimer:
      'If you did not sign up for this newsletter, you can safely ignore this email.',
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
        <Text className="text-left text-base leading-6 text-gray-600">
          {labels.greeting}
        </Text>
        <Text className="text-left text-base leading-6 text-gray-600">
          {labels.content}
        </Text>

        <Section className="my-8 text-center">
          <Button
            href={url}
            className="block w-full rounded-lg bg-blue-600 py-3 text-center text-base font-semibold text-white"
          >
            {labels.button}
          </Button>
        </Section>

        <Section className="my-6 rounded-lg bg-gray-100 p-4 text-center">
          <Link
            href={url}
            className="text-sm break-all text-blue-600 underline"
          >
            {url}
          </Link>
        </Section>

        <Text className="mt-5 text-sm leading-5 text-gray-500">
          {labels.disclaimer}
        </Text>
      </Tailwind>
    </EmailBody>
  );
}
