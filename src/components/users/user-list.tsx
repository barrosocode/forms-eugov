"use client";

import { useDebounced, useEnvelope } from "@/components/hooks/use-envelope";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationBar } from "@/components/ui/pagination";
import { inputClass } from "@/components/ui/field";
import { UserStatusBadge } from "@/components/ui/status-badge";
import { apiRequest, isSuccess } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";
import { textFilter, toQuery } from "@/lib/text";
import type { User } from "@/types/domain";
import Link from "next/link";
import { useState } from "react";

export function UserList() {
  const { session } = useAuth();
  const permissions = session?.user?.permissions;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<User | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const debouncedName = useDebounced(name);
  const debouncedEmail = useDebounced(email);
  const path = `/users${toQuery({
    page,
    page_size: 15,
    name: textFilter(debouncedName),
    email: textFilter(debouncedEmail),
    status: status || undefined,
  })}`;
  const { envelope, loading, reload } = useEnvelope(hasPermission(permissions, "users:list") ? path : null);

  async function remove() {
    if (!target) return;
    setPending(true);
    const result = await apiRequest(`/users/${target.id}`, { method: "DELETE" });
    setPending(false);
    setTarget(null);
    setFeedback(result.message);
    if (isSuccess(result)) await reload();
  }

  if (!hasPermission(permissions, "users:list")) {
    return <Alert tone="error">Você não tem permissão para listar usuários.</Alert>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Contas criadas pelo administrador. Não existe cadastro público."
        action={
          hasPermission(permissions, "users:create") ? (
            <Link href="/users/new" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white">
              Novo usuário
            </Link>
          ) : null
        }
      />
      {feedback ? <Alert tone="info">{feedback}</Alert> : null}
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
        <input aria-label="Filtrar por nome" value={name} onChange={(event) => { setName(event.target.value); setPage(1); }} placeholder="Nome" className={inputClass(false)} />
        <input aria-label="Filtrar por e-mail exato" value={email} onChange={(event) => { setEmail(event.target.value); setPage(1); }} placeholder="E-mail exato" className={inputClass(false)} />
        <select aria-label="Filtrar por status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={inputClass(false)}>
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="suspended">Suspenso</option>
        </select>
      </div>
      {loading ? <p className="text-sm text-muted">Carregando usuários...</p> : null}
      {envelope && envelope.status >= 400 ? <Alert tone="error">{envelope.message}</Alert> : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Papéis</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {envelope?.users?.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3"><UserStatusBadge status={user.status} /></td>
                <td className="px-4 py-3">{user.roles.map((role) => role.display_name).join(", ") || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {hasPermission(permissions, "users:update") ? (
                      <Link href={`/users/${user.id}`} className="text-brand">Editar</Link>
                    ) : null}
                    {hasPermission(permissions, "users:delete") ? (
                      <button type="button" className="text-danger" onClick={() => setTarget(user)}>Excluir</button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {envelope?.users?.length === 0 ? <p className="px-4 py-6 text-sm text-muted">Nenhum usuário encontrado.</p> : null}
      </div>
      <PaginationBar pagination={envelope?.pagination} onPage={setPage} />
      <ConfirmDialog
        open={Boolean(target)}
        title="Excluir usuário"
        description={target ? `${target.name} deixará de acessar o sistema. A exclusão é lógica.` : ""}
        pending={pending}
        onClose={() => setTarget(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
