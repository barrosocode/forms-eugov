"use client";

import { PageHeader } from "@/components/ui/page-header";
import { FormStatusBadge } from "@/components/ui/status-badge";
import { useEnvelope } from "@/components/hooks/use-envelope";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";
import { formatDateTime, toQuery } from "@/lib/text";
import Link from "next/link";

export function DashboardHome() {
  const { session } = useAuth();
  const permissions = session?.user?.permissions;
  const canList = hasPermission(permissions, "forms:list");
  const { envelope, loading } = useEnvelope(canList ? `/forms${toQuery({ page: 1, page_size: 5 })}` : null);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Painel"
        title={session?.user?.name ? `Olá, ${session.user.name.split(" ")[0]}` : "Olá"}
        description="Crie formulários, acompanhe respostas e compartilhe a página de preenchimento com quem já tem acesso."
        action={
          hasPermission(permissions, "forms:create") ? (
            <Link href="/forms/new" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white">
              Novo formulário
            </Link>
          ) : null
        }
      />
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Formulários recentes</h2>
          {canList ? (
            <Link href="/forms" className="text-sm font-medium text-brand">
              Ver todos
            </Link>
          ) : null}
        </div>
        {!canList ? <p className="mt-4 text-sm text-muted">Seu papel não lista formulários.</p> : null}
        {canList && loading ? <p className="mt-4 text-sm text-muted">Carregando...</p> : null}
        {canList && envelope && envelope.status >= 400 ? <p className="mt-4 text-sm text-danger">{envelope.message}</p> : null}
        {canList && envelope?.forms && envelope.forms.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nenhum formulário por aqui ainda.</p>
        ) : null}
        {envelope?.forms && envelope.forms.length > 0 ? (
          <ul className="mt-4 divide-y divide-border">
            {envelope.forms.map((form) => (
              <li key={form.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/forms/${form.id}`} className="font-medium hover:text-brand">
                    {form.title}
                  </Link>
                  <p className="text-xs text-muted">Atualizado em {formatDateTime(form.updated_at)}</p>
                </div>
                <FormStatusBadge status={form.status} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
