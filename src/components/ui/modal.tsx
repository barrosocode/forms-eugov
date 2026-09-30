"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Excluir",
  pending = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-slate-950/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 id="confirm-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={pending}>
            {pending ? "Excluindo..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
