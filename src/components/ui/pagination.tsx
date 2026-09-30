"use client";

import { Button } from "@/components/ui/button";
import type { Pagination } from "@/types/envelope";

export function PaginationBar({
  pagination,
  onPage,
}: {
  pagination: Pagination | null | undefined;
  onPage: (page: number) => void;
}) {
  if (!pagination || pagination.total_pages <= 1) return null;
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        Página {pagination.page} de {pagination.total_pages} · {pagination.total_items} itens
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>
          Anterior
        </Button>
        <Button
          variant="secondary"
          disabled={pagination.page >= pagination.total_pages}
          onClick={() => onPage(pagination.page + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
