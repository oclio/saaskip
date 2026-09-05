export const stepAnimations = {
  forward: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  backward: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
};

export const labelAnimations = {
  active: {
    animate: { color: 'var(--primary)', fontWeight: 500 },
    transition: { duration: 0.6 },
  },
  inactive: {
    animate: { color: 'var(--muted-foreground)', fontWeight: 400 },
    transition: { duration: 0.6 },
  },
};

export const barAnimations = {
  active: {
    animate: { backgroundColor: 'var(--primary)' },
    transition: { duration: 0.6 },
  },
  inactive: {
    animate: { backgroundColor: 'var(--muted)' },
    transition: { duration: 0.6 },
  },
};
