interface Props {
  label?: string;
  className?: string;
}

export default function CardDivider({ label, className }: Readonly<Props>) {
  return (
    <div
      className={`after:border-border relative text-center after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t ${className}`}
    >
      {label && (
        <span className="bg-card text-muted-foreground relative z-10 px-2">
          {label}
        </span>
      )}
    </div>
  );
}
