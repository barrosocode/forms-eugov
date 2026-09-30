"use client";

import { useDebounced, useEnvelope } from "@/components/hooks/use-envelope";
import { Alert } from "@/components/ui/alert";
import { inputClass } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationBar } from "@/components/ui/pagination";
import { ShareFormButton } from "@/components/forms/share-form-button";
import { FormStatusBadge } from "@/components/ui/status-badge";
import { MEMBER_ROLE_LABEL } from "@/lib/labels";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";
import { formatDateTime, textFilter, toQuery } from "@/lib/text";
import Link from "next/link";
import { useState } from "react";

export function FormList() {
  const { session } = useAuth();
  const permissions = session?.user?.permissions;
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedTitle = useDebounced(title);
  const path = `/forms${toQuery({ page, page_size: 15, title: textFilter(debouncedTitle), status: status || undefined })}`;
  const { envelope, loading } = useEnvelope(hasPermission(permissions, "forms:list") ? path : null);

  if (!hasPermission(permissions, "forms:list")) {
    return <Alert tone="error">Você não tem permissão para listar formulários.</Alert>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Formulários"
        description="Rascunhos ficam visíveis para quem participa. Publicados podem ser respondidos sem entrar na conta."
        action={
          hasPermission(permissions, "forms:create") ? (
            <Link href="/forms/new" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white">
              Novo formulário
            </Link>
          ) : null
        }
      />
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
        <input aria-label="Filtrar por título" value={title} onChange={(event) => { setTitle(event.target.value); setPage(1); }} placeholder="Título" className={inputClass(false)} />
        <select aria-label="Filtrar por status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={inputClass(false)}>
          <option value="">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
          <option value="archived">Arquivado</option>
        </select>
      </div>
      {loading ? <p className="text-sm text-muted">Carregando formulários...</p> : null}
      {envelope && envelope.status >= 400 ? <Alert tone="error">{envelope.message}</Alert> : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Seu papel</th>
              <th className="px-4 py-3 font-medium">Atualizado</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {envelope?.forms?.map((form) => (
              <tr key={form.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/forms/${form.id}`} className="font-medium hover:text-brand">{form.title}</Link>
                  {form.description ? <p className="line-clamp-1 text-xs text-muted">{form.description}</p> : null}
                </td>
                <td className="px-4 py-3"><FormStatusBadge status={form.status} /></td>
                <td className="px-4 py-3">{form.my_role ? MEMBER_ROLE_LABEL[form.my_role] : "Administração"}</td>
                <td className="px-4 py-3">{formatDateTime(form.updated_at)}</td>
                <td className="px-4 py-3"><ShareFormButton formId={form.id} title={form.title} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {envelope?.forms?.length === 0 ? <p className="px-4 py-6 text-sm text-muted">Nenhum formulário encontrado.</p> : null}
      </div>
      <PaginationBar pagination={envelope?.pagination} onPage={setPage} />
    </div>
  );
}
