import { createViewport } from '../create-viewport';

describe('createViewport', () => {
  it('sets width to a non-empty value', () => {
    const viewport = createViewport();

    expect(viewport.width).toBeTruthy();
  });

  it('sets initialScale to 1', () => {
    const viewport = createViewport();

    expect(viewport.initialScale).toBe(1);
  });

  it('provides themeColor entries for light and dark color schemes', () => {
    const viewport = createViewport();
    const themeColors = viewport.themeColor as {
      media: string;
      color: string;
    }[];

    expect(themeColors).toHaveLength(2);
  });

  it.each([
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ])('provides themeColor entry for $media', (entry) => {
    const viewport = createViewport();
    const themeColors = viewport.themeColor as {
      media: string;
      color: string;
    }[];

    expect(themeColors).toContainEqual(entry);
  });
});
