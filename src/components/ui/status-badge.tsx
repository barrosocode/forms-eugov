import { FORM_STATUS_LABEL, USER_STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/text";
import type { FormStatus, UserStatus } from "@/types/domain";

export function FormStatusBadge({ status }: { status: FormStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "published" && "bg-success/10 text-success",
        status === "archived" && "bg-warning/10 text-warning",
        status === "draft" && "bg-border text-foreground",
      )}
    >
      {FORM_STATUS_LABEL[status]}
    </span>
  );
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className="inline-flex rounded-full bg-border px-2.5 py-0.5 text-xs font-medium text-foreground">
      {USER_STATUS_LABEL[status]}
    </span>
  );
}
