import { cn } from "@/lib/text";

export function Alert({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "error" && "border-danger/30 bg-danger/10 text-danger",
        tone === "info" && "border-border bg-card text-foreground",
      )}
    >
      {children}
    </div>
  );
}
