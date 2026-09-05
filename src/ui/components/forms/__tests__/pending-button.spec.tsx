import { fireEvent, render, screen } from '@testing-library/react';
import * as nextIntl from 'next-intl';

import { icon } from '@/config/icons';
import { translationMock } from '@/tests/unit/mocks/intl';
import PendingButton from '@/ui/components/forms/pending-button';

describe('PendingButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(nextIntl, 'useTranslations');
    translationMock.mockImplementation((key: string) => key);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders children when not pending', () => {
      render(
        <PendingButton pending={false} pendingLabel="Loading">
          Submit
        </PendingButton>,
      );

      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('renders the pending label with ellipsis when pending', () => {
      render(
        <PendingButton pending pendingLabel="Loading">
          Submit
        </PendingButton>,
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not render children when pending', () => {
      render(
        <PendingButton pending pendingLabel="Loading">
          Submit
        </PendingButton>,
      );

      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('calls useTranslations with the labels namespace', () => {
      render(
        <PendingButton pending={false} pendingLabel="Loading">
          Submit
        </PendingButton>,
      );

      expect(nextIntl.useTranslations).toHaveBeenCalledWith('labels');
    });
  });

  describe('pending label fallback', () => {
    it('uses the translated loading label when pendingLabel is not provided', () => {
      render(<PendingButton pending>Submit</PendingButton>);

      expect(translationMock).toHaveBeenCalledWith('loading');
      expect(screen.getByText('loading...')).toBeInTheDocument();
    });
  });

  describe('pendingLabelClassName', () => {
    it('applies the provided pendingLabelClassName to the pending label span', () => {
      render(
        <PendingButton
          pending
          pendingLabel="Loading"
          pendingLabelClassName="test-pending-class"
        >
          Submit
        </PendingButton>,
      );

      expect(screen.getByText('Loading...')).toHaveClass('test-pending-class');
    });
  });

  describe('disabled state', () => {
    it.each([
      { pending: true, disabled: undefined, expected: true },
      { pending: false, disabled: true, expected: true },
      { pending: false, disabled: false, expected: false },
      { pending: true, disabled: true, expected: true },
    ])(
      'is disabled=$expected when pending=$pending and disabled=$disabled',
      ({ pending, disabled, expected }) => {
        render(
          <PendingButton
            pending={pending}
            pendingLabel="Loading"
            disabled={disabled}
          >
            Submit
          </PendingButton>,
        );

        const button = screen.getByRole('button');
        expect(button.hasAttribute('disabled')).toBe(expected);
      },
    );
  });

  describe('icon', () => {
    it('renders the loading icon when pending', () => {
      render(
        <PendingButton pending pendingLabel="Loading">
          Submit
        </PendingButton>,
      );

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('does not render the loading icon when not pending', () => {
      render(
        <PendingButton pending={false} pendingLabel="Loading">
          Submit
        </PendingButton>,
      );

      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
    });

    it('passes the loading icon name to the icon registry', () => {
      render(
        <PendingButton pending pendingLabel="Loading">
          Submit
        </PendingButton>,
      );

      expect(icon).toHaveBeenCalledWith(
        'loading',
        expect.objectContaining({
          className: expect.any(String),
        }),
      );
      expect(
        String(
          (icon as unknown as { mock: { calls: { className?: string }[][] } })
            .mock.calls[0][1].className,
        ),
      ).not.toBe('');
    });

    it('sets aria-label on the icon with the translated loading label', () => {
      render(
        <PendingButton pending pendingLabel="Loading">
          Submit
        </PendingButton>,
      );

      expect(icon).toHaveBeenCalledWith(
        'loading',
        expect.objectContaining({
          'aria-label': 'loading',
        }),
      );
    });

    it('sets aria-hidden to true on the icon when a pendingLabel is provided', () => {
      render(
        <PendingButton pending pendingLabel="Loading">
          Submit
        </PendingButton>,
      );

      expect(icon).toHaveBeenCalledWith(
        'loading',
        expect.objectContaining({
          'aria-hidden': true,
        }),
      );
    });
  });

  describe('event forwarding', () => {
    it('forwards onClick to the button', () => {
      const onClick = vi.fn();

      render(
        <PendingButton pending={false} pendingLabel="Loading" onClick={onClick}>
          Submit
        </PendingButton>,
      );

      fireEvent.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalled();
    });
  });
});
