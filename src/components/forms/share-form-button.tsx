"use client";

import { cn } from "@/lib/text";
import { useState } from "react";

export function ShareFormButton({
  formId,
  title,
  className,
}: {
  formId?: string;
  title?: string;
  className?: string;
}) {
  const [note, setNote] = useState<string | null>(null);

  async function share() {
    if (!formId) {
      setNote("O link fica disponível depois de criar o formulário.");
      return;
    }
    const url = `${window.location.origin}/f/${formId}`;
    try {
      await navigator.clipboard.writeText(url);
      setNote("Link copiado.");
    } catch {
      setNote(url);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void share()}
        aria-label={title ? `Compartilhar ${title}` : "Compartilhar"}
        className={cn("rounded-lg border border-border px-3 py-2 text-sm", className)}
      >
        Compartilhar
      </button>
      {note ? (
        <span className="text-xs text-muted" role="status">
          {note}
        </span>
      ) : null}
    </span>
  );
}
