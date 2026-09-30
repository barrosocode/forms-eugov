"use client";

import { useDebounced, useEnvelope } from "@/components/hooks/use-envelope";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/modal";
import { PaginationBar } from "@/components/ui/pagination";
import { apiRequest, isSuccess } from "@/lib/api";
import { MEMBER_ROLE_LABEL } from "@/lib/labels";
import { hasPermission } from "@/lib/permissions";
import { textFilter, toQuery } from "@/lib/text";
import type { Envelope } from "@/types/envelope";
import type { Member, MembershipRole } from "@/types/domain";
import { useState } from "react";

export function MembersPanel({
  formId,
  canEdit,
  permissions,
  notify,
}: {
  formId: string;
  canEdit: boolean;
  permissions: readonly string[] | undefined;
  notify: (envelope: Envelope) => void;
}) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [role, setRole] = useState<MembershipRole>("member");
  const [target, setTarget] = useState<Member | null>(null);
  const [pending, setPending] = useState(false);
  const debouncedQuery = useDebounced(query);
  const canSearch = hasPermission(permissions, "users:list");
  const { envelope, loading, reload } = useEnvelope(`/forms/${formId}/members${toQuery({ page, page_size: 15 })}`);
  const { envelope: usersEnvelope, loading: usersLoading } = useEnvelope(
    canEdit && canSearch && textFilter(debouncedQuery)
      ? `/users${toQuery({ page: userPage, page_size: 5, name: textFilter(debouncedQuery), status: "active" })}`
      : null,
  );

  async function add(userId: string) {
    setPending(true);
    const result = await apiRequest(`/forms/${formId}/members`, { method: "POST", body: { user_id: userId, role } });
    setPending(false);
    notify(result);
    if (isSuccess(result)) await reload();
  }

  async function changeRole(member: Member, nextRole: MembershipRole) {
    const result = await apiRequest(`/forms/${formId}/members/${member.user_id}`, { method: "PATCH", body: { role: nextRole } });
    notify(result);
    if (isSuccess(result)) await reload();
  }

  async function remove() {
    if (!target) return;
    setPending(true);
    const result = await apiRequest(`/forms/${formId}/members/${target.user_id}`, { method: "DELETE" });
    setPending(false);
    setTarget(null);
    notify(result);
    if (isSuccess(result)) await reload();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">Pessoas</h2>
        <p className="text-sm text-muted">Responsáveis editam a estrutura. Membros visualizam e respondem.</p>
      </div>
      {loading ? <p className="text-sm text-muted">Carregando pessoas...</p> : null}
      {envelope && envelope.status >= 400 ? <Alert tone="error">{envelope.message}</Alert> : null}
      <ul className="divide-y divide-border">
        {envelope?.members?.map((member) => (
          <li key={member.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{member.user_name}</p>
              <p className="text-sm text-muted">{member.user_email}</p>
            </div>
            {canEdit ? (
              <div className="flex items-center gap-2">
                <select aria-label={`Papel de ${member.user_name}`} value={member.role} onChange={(event) => void changeRole(member, event.target.value as MembershipRole)} className={inputClass(false)}>
                  <option value="owner">{MEMBER_ROLE_LABEL.owner}</option>
                  <option value="member">{MEMBER_ROLE_LABEL.member}</option>
                </select>
                <Button variant="ghost" className="text-danger" onClick={() => setTarget(member)}>Remover</Button>
              </div>
            ) : (
              <span className="text-sm">{MEMBER_ROLE_LABEL[member.role]}</span>
            )}
          </li>
        ))}
      </ul>
      <PaginationBar pagination={envelope?.pagination} onPage={setPage} />
      {canEdit && canSearch ? (
        <div className="space-y-3 border-t border-border pt-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <input aria-label="Buscar pessoa pelo nome" value={query} onChange={(event) => { setQuery(event.target.value); setUserPage(1); }} placeholder="Buscar por nome" className={inputClass(false)} />
            <select aria-label="Papel ao adicionar" value={role} onChange={(event) => setRole(event.target.value as MembershipRole)} className={inputClass(false)}>
              <option value="member">Membro</option>
              <option value="owner">Responsável</option>
            </select>
          </div>
          {usersLoading ? <p className="text-sm text-muted">Buscando...</p> : null}
          <ul className="space-y-2">
            {usersEnvelope?.users?.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
                <Button variant="secondary" disabled={pending} onClick={() => void add(user.id)}>Adicionar</Button>
              </li>
            ))}
          </ul>
          <PaginationBar pagination={usersEnvelope?.pagination} onPage={setUserPage} />
        </div>
      ) : null}
      {canEdit && !canSearch ? (
        <p className="text-sm text-muted">Para buscar pessoas pelo nome é preciso a permissão de listar usuários. Um administrador pode adicionar membros.</p>
      ) : null}
      <ConfirmDialog
        open={Boolean(target)}
        title="Remover pessoa"
        description={target ? `${target.user_name} perderá o acesso a este formulário.` : ""}
        confirmLabel="Remover"
        pending={pending}
        onClose={() => setTarget(null)}
        onConfirm={() => void remove()}
      />
    </section>
  );
}
