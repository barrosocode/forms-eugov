import { cn } from "@/lib/text";

export function inputClass(invalid: boolean): string {
  return cn(
    "w-full rounded-lg border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
    invalid ? "border-danger focus:ring-danger/20" : "border-border focus:border-brand focus:ring-brand/20",
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p id={`${name}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
