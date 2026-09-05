import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { vi } from 'vitest';

import { sendEmail } from '@/core/mailer';
import { translationMock } from '@/tests/unit/mocks/intl';

import { sendVerificationOTPEmail } from '../index';

const { createElementMock } = vi.hoisted(() => ({
  createElementMock: vi.fn(
    (_component: unknown, _props: Record<string, unknown>) => null,
  ),
}));

vi.mock('react', () => ({
  createElement: createElementMock,
}));

vi.mock('@/config/brand', () => ({
  brand: { title: 'TestBrand' },
}));

vi.mock('@/core/mailer', () => ({
  sendEmail: vi.fn(async () => ({ id: 'mock-email-id' })),
}));

describe('sendVerificationOTPEmail', () => {
  const EMAIL = 'user@example.com';
  const OTP = '123456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('calls sendEmail with the recipient email and subject from translations', async () => {
    await sendVerificationOTPEmail(EMAIL, OTP);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: EMAIL, subject: expect.any(String) }),
    );
    const { subject } = vi.mocked(sendEmail).mock.calls[0][0];
    expect(subject).toBeTruthy();
  });

  it('creates the email element with otp code, locale, and translation labels', async () => {
    await sendVerificationOTPEmail(EMAIL, OTP);

    expect(createElementMock).toHaveBeenCalled();
    const [, props] = createElementMock.mock.calls[0];
    expect(props).toMatchObject({ code: OTP });
    expect(props.labels).toMatchObject({
      preview: expect.any(String),
      title: expect.any(String),
      greeting: expect.any(String),
      content: expect.any(String),
      disclaimer: expect.any(String),
      footnote: expect.any(String),
    });
    for (const value of Object.values(
      props.labels as Record<string, unknown>,
    )) {
      expect(value).toBeTruthy();
    }

    expect(translationMock).toHaveBeenCalledWith(
      'emails.loginVerificationCode.content',
      { brand: 'TestBrand' },
    );
    expect(translationMock).toHaveBeenCalledWith('emails.footer', {
      brand: 'TestBrand',
    });
  });

  it('calls getTranslations with the locale from x-locale header', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({ 'x-locale': 'fr' }));

    await sendVerificationOTPEmail(EMAIL, OTP);

    expect(getTranslations).toHaveBeenCalledWith({ locale: 'fr' });
  });

  it('defaults to en locale when x-locale header is absent', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers());

    await sendVerificationOTPEmail(EMAIL, OTP);

    expect(getTranslations).toHaveBeenCalledWith({ locale: 'en' });
  });

  it('logs the OTP to console in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const consoleLogSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => consoleLogSpy);

    await sendVerificationOTPEmail(EMAIL, OTP);

    expect(consoleLogSpy).toHaveBeenCalled();
    expect(
      consoleLogSpy.mock.calls.some((call) =>
        call.some((argument) => String(argument).includes(OTP)),
      ),
    ).toBe(true);
    expect(
      consoleLogSpy.mock.calls.every((call) => String(call[0]) !== ''),
    ).toBe(true);
  });

  it('does not log to console in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const consoleLogSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => consoleLogSpy);

    await sendVerificationOTPEmail(EMAIL, OTP);

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
