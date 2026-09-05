import { vi } from 'vitest';

// jsdom defines scrollTo/requestSubmit as stubs that log "Not implemented".
// Override them with silent no-ops to keep test output clean.
Object.defineProperty(globalThis, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('next/font/google', () => ({
  Inter: () => ({
    style: { fontFamily: 'inter' },
    className: 'mocked-inter-class',
    variable: '--font-inter-mocked',
  }),
  Montserrat: () => ({
    style: { fontFamily: 'montserrat' },
    className: 'mocked-montserrat-class',
    variable: '--font-heading-mocked',
  }),
}));

const themeReference = { current: 'light' as string | undefined };
const setThemeMock = vi.fn();

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  NextThemesProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: themeReference.current, setTheme: setThemeMock }),
}));

vi.mock('@/config/icons', () => ({
  ICONS: {},
  icon: vi.fn((_name: string, props: Record<string, unknown>) => (
    <svg data-testid="mock-icon" {...props} />
  )),
}));

export { setThemeMock, themeReference as themeRef };
