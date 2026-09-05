# Forms

saaskip builds forms on [React Hook Form](https://react-hook-form.com) for state management, [Zod](https://zod.dev) for schema validation, and [`@hookform/resolvers`](https://github.com/react-hook-form/resolvers) to bridge the two. Reusable form primitives in `src/ui/components/forms/` wrap the raw libraries with consistent styling, accessibility, and i18n integration.

## useZodForm

The `useZodForm` hook (`src/ui/hooks/use-zod-form.ts`) is a thin wrapper around `useForm` that wires the Zod resolver automatically. It accepts a Zod schema and the standard `useForm` options (minus `resolver`, which is set internally).

```ts
import { useZodForm } from '@/ui/hooks/use-zod-form';
import { z } from 'zod';

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const form = useZodForm(schema, {
  defaultValues: { email: '', password: '' },
});

return (
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* fields */}
  </form>
);
```

The returned object is a standard `UseFormReturn` — all React Hook Form methods (`register`, `handleSubmit`, `control`, `formState`, `watch`, etc.) work as expected.

## Field primitives

Form fields use the shadcn `Field` components (`src/ui/components/shadcn/field.tsx`) — `Field`, `FieldGroup`, `FieldLabel`, `FieldError`, `FieldDescription`. See the [shadcn/ui Field documentation](https://ui.shadcn.com/docs/components/field) for the full API.

The pattern for wiring a field with React Hook Form's `Controller`:

```tsx
import { Controller } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/ui/components/shadcn/field';
import { Input } from '@/ui/components/shadcn/input';

<Controller
  name="email"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input {...field} id="email" aria-invalid={fieldState.invalid} />
      {fieldState.error && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>;
```

## Form components

### PendingButton

A button that shows a loading spinner and pending label when `pending` is `true`. Falls back to the `labels.loading` translation if no `pendingLabel` is provided.

```tsx
import PendingButton from '@/ui/components/forms/pending-button';

<PendingButton type="submit" pending={isPending}>
  Submit
</PendingButton>;
```

| Prop                    | Type      | Description                                              |
| ----------------------- | --------- | -------------------------------------------------------- |
| `pending`               | `boolean` | Shows spinner and pending label when `true`              |
| `pendingLabel`          | `string?` | Custom pending label (defaults to `t('labels.loading')`) |
| `pendingLabelClassName` | `string?` | Class for the pending label span                         |

### OtpField

A 6-digit OTP input wired to React Hook Form via `Controller`. Auto-submits via `onComplete` when all digits are entered.

```tsx
import OtpField from '@/ui/components/forms/otp-field';

<OtpField
  name="code"
  control={form.control}
  label="Verification code"
  length={6}
  onComplete={() => form.handleSubmit(onSubmit)()}
/>;
```

| Prop         | Type         | Default | Description                       |
| ------------ | ------------ | ------- | --------------------------------- |
| `control`    | `Control`    | —       | React Hook Form control           |
| `name`       | `string`     | —       | Field name                        |
| `label`      | `string`     | —       | Field label                       |
| `length`     | `number`     | `6`     | Number of OTP slots               |
| `onComplete` | `() => void` | —       | Called when all digits are filled |
| `disabled`   | `boolean`    | —       | Disables the input                |

### CountdownButton

A button that disables itself for a countdown period after each click. Useful for resend-OTP or rate-limited actions.

```tsx
import CountdownButton from '@/ui/components/forms/countdown-button';

<CountdownButton seconds={60} onAction={handleResend} label="Resend code" />;
```

| Prop       | Type         | Description                                            |
| ---------- | ------------ | ------------------------------------------------------ |
| `seconds`  | `number`     | Countdown duration in seconds                          |
| `onAction` | `() => void` | Called on click (countdown restarts)                   |
| `label`    | `string`     | Button label — countdown suffix appended automatically |

### MultiStepForm

An animated multi-step form with an optional progress bar. Each step is a React component that receives `goTo`, `isFirstStep`, and `isLastStep` props.

```tsx
import { MultiStepForm } from '@/ui/components/forms/multi-step-form';

const steps = [
  { id: 'email', component: StepEmail },
  { id: 'otp', component: StepOtp, label: 'Verify' },
];

const [activeStep, setActiveStep] = useState('email');

<MultiStepForm
  steps={steps}
  activeStep={activeStep}
  onStepChange={setActiveStep}
  progressBar
/>;
```

| Prop           | Type                   | Default | Description                          |
| -------------- | ---------------------- | ------- | ------------------------------------ |
| `steps`        | `Step[]`               | —       | Array of `{ id, component, label? }` |
| `activeStep`   | `string`               | —       | Current step id                      |
| `onStepChange` | `(id: string) => void` | —       | Step change handler                  |
| `progressBar`  | `boolean`              | `true`  | Show animated progress bar           |

Step transitions are animated with Motion (`AnimatePresence` + `motion.div`). The progress bar uses Motion for active/inactive bar and label animations.

The `StepComponentProps` interface passed to each step:

```ts
interface StepComponentProps {
  goTo: (stepId: string) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}
```

## Validation patterns

### Email

```ts
const emailSchema = z.object({
  email: z.email('Invalid email address'),
});
```

### OTP code

```ts
const otpSchema = z.object({
  code: z.string().min(6, 'Code must be 6 digits').max(6),
});
```

### With refine

```ts
const schema = z
  .object({
    password: z.string().min(8),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
```

## Accessibility

- `FieldError` uses `role="alert"` so screen readers announce validation errors immediately
- `FieldLabel` links to controls via `htmlFor` + `id`
- `OtpField` sets `aria-invalid` when the field has errors
- `CountdownButton` uses `aria-live="polite"` so screen readers announce the countdown
- `PendingButton` marks the spinner icon with `aria-label` and `aria-hidden` when a visible label is present
