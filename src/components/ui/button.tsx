import { cn } from "@/lib/text";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-strong",
  secondary: "border border-border bg-card text-foreground hover:bg-background",
  ghost: "text-foreground hover:bg-background",
  danger: "bg-danger text-white hover:opacity-90",
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
