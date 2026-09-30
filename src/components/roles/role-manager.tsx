"use client";

import { useDebounced, useEnvelope } from "@/components/hooks/use-envelope";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationBar } from "@/components/ui/pagination";
import { apiRequest, isSuccess } from "@/lib/api";
import { focusFirstFieldWithError } from "@/lib/focus-error";
import { PERMISSION_CATALOG, hasPermission } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";
import { textFilter, toQuery } from "@/lib/text";
import type { Role } from "@/types/domain";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RoleList() {
  const { session } = useAuth();
  const permissions = session?.user?.permissions;
  const [name, setName] = useState("");
  const [scope, setScope] = useState("");
  const [isSystem, setIsSystem] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<Role | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const debouncedName = useDebounced(name);
  const path = `/roles${toQuery({
    page,
    page_size: 15,
    name: textFilter(debouncedName),
    scope: scope || undefined,
    is_system: isSystem || undefined,
  })}`;
  const { envelope, loading, reload } = useEnvelope(hasPermission(permissions, "roles:list") ? path : null);

  async function remove() {
    if (!target) return;
    setPending(true);
    const result = await apiRequest(`/roles/${target.id}`, { method: "DELETE" });
    setPending(false);
    setTarget(null);
    setFeedback(result.message);
    if (isSuccess(result)) await reload();
  }

  if (!hasPermission(permissions, "roles:list")) return <Alert tone="error">Você não tem permissão para listar papéis.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Papéis"
        description="Papéis de sistema não podem ser alterados nem excluídos."
        action={hasPermission(permissions, "roles:create") ? <Link href="/roles/new" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white">Novo papel</Link> : null}
      />
      {feedback ? <Alert tone="info">{feedback}</Alert> : null}
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
        <input aria-label="Filtrar por nome" value={name} onChange={(event) => { setName(event.target.value); setPage(1); }} placeholder="Nome" className={inputClass(false)} />
        <select aria-label="Filtrar por escopo" value={scope} onChange={(event) => { setScope(event.target.value); setPage(1); }} className={inputClass(false)}>
          <option value="">Todos os escopos</option>
          <option value="master">Master</option>
          <option value="tenant">Tenant</option>
        </select>
        <select aria-label="Filtrar papéis de sistema" value={isSystem} onChange={(event) => { setIsSystem(event.target.value); setPage(1); }} className={inputClass(false)}>
          <option value="">Sistema e personalizados</option>
          <option value="true">Somente sistema</option>
          <option value="false">Somente personalizados</option>
        </select>
      </div>
      {loading ? <p className="text-sm text-muted">Carregando papéis...</p> : null}
      {envelope && envelope.status >= 400 ? <Alert tone="error">{envelope.message}</Alert> : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Escopo</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {envelope?.roles?.map((role) => (
              <tr key={role.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{role.display_name}</p>
                  <p className="text-xs text-muted">{role.name}</p>
                </td>
                <td className="px-4 py-3">{role.scope === "master" ? "Master" : "Tenant"}</td>
                <td className="px-4 py-3">{role.is_system ? "Sistema" : "Personalizado"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    {hasPermission(permissions, "roles:update") && !role.is_system ? <Link href={`/roles/${role.id}`} className="text-brand">Editar</Link> : null}
                    {hasPermission(permissions, "roles:delete") && !role.is_system ? (
                      <button type="button" className="text-danger" onClick={() => setTarget(role)}>Excluir</button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {envelope?.roles?.length === 0 ? <p className="px-4 py-6 text-sm text-muted">Nenhum papel encontrado.</p> : null}
      </div>
      <PaginationBar pagination={envelope?.pagination} onPage={setPage} />
      <ConfirmDialog
        open={Boolean(target)}
        title="Excluir papel"
        description={target ? `O papel ${target.display_name} será removido se não estiver atribuído a ninguém.` : ""}
        pending={pending}
        onClose={() => setTarget(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}

export function RoleForm({ roleId }: { roleId?: string }) {
  const { envelope, loading } = useEnvelope(roleId ? `/roles/${roleId}` : null);
  if (roleId && loading) return <p className="text-sm text-muted">Carregando papel...</p>;
  if (roleId && envelope && envelope.status >= 400) return <Alert tone="error">{envelope.message}</Alert>;
  if (roleId && !envelope?.role) return <p className="text-sm text-muted">Carregando papel...</p>;
  return <RoleFields key={envelope?.role?.updated_at ?? "new"} roleId={roleId} role={envelope?.role} />;
}

function RoleFields({ roleId, role }: { roleId?: string; role?: Role }) {
  const router = useRouter();
  const [name, setName] = useState(role?.name ?? "");
  const [displayName, setDisplayName] = useState(role?.display_name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [scope, setScope] = useState<"master" | "tenant">(role?.scope ?? "master");
  const [selected, setSelected] = useState<string[]>(role?.permissions.filter((item) => item !== "*") ?? []);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pending, setPending] = useState(false);
  const locked = Boolean(role?.is_system);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string[]> = {};
    if (!/^[a-z0-9_]+$/.test(name.trim()) || name.trim().length > 50) nextErrors.name = ["Use letras minúsculas, números e _ , até 50 caracteres."];
    if (displayName.trim().length < 2) nextErrors.display_name = ["Informe o nome de exibição."];
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstFieldWithError(nextErrors);
      return;
    }
    setPending(true);
    const result = await apiRequest(roleId ? `/roles/${roleId}` : "/roles", {
      method: roleId ? "PUT" : "POST",
      body: {
        name: name.trim().toLowerCase(),
        display_name: displayName.trim(),
        description: description.trim() || null,
        scope,
        permissions: selected,
      },
    });
    setPending(false);
    if (!isSuccess(result)) {
      setErrors(result.errors ?? {});
      setFeedback({ tone: "error", message: result.message });
      focusFirstFieldWithError(result.errors ?? {});
      return;
    }
    router.push("/roles");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={roleId ? "Editar papel" : "Novo papel"} description="A permissão curinga de administrador não pode ser atribuída por aqui." />
      {locked ? <Alert tone="info">Este papel é de sistema e não pode ser alterado.</Alert> : null}
      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5" noValidate>
        <Field label="Identificador" name="name" error={errors.name?.[0]} hint="Letras minúsculas, números e _.">
          <input id="name" data-field="name" value={name} disabled={locked} onChange={(event) => setName(event.target.value.toLowerCase())} className={inputClass(Boolean(errors.name))} autoComplete="off" />
        </Field>
        <Field label="Nome de exibição" name="display_name" error={errors.display_name?.[0]}>
          <input id="display_name" data-field="display_name" value={displayName} disabled={locked} onChange={(event) => setDisplayName(event.target.value)} className={inputClass(Boolean(errors.display_name))} />
        </Field>
        <Field label="Descrição" name="description" error={errors.description?.[0]}>
          <textarea id="description" data-field="description" value={description} disabled={locked} onChange={(event) => setDescription(event.target.value)} className={inputClass(Boolean(errors.description))} rows={3} />
        </Field>
        <Field label="Escopo" name="scope" error={errors.scope?.[0]}>
          <select id="scope" data-field="scope" value={scope} disabled={locked} onChange={(event) => setScope(event.target.value as "master" | "tenant")} className={inputClass(Boolean(errors.scope))}>
            <option value="master">Master</option>
            <option value="tenant">Tenant</option>
          </select>
        </Field>
        <fieldset className="space-y-2" disabled={locked}>
          <legend className="text-sm font-medium">Permissões</legend>
          <ul className="grid gap-2 sm:grid-cols-2">
            {PERMISSION_CATALOG.map((permission) => (
              <li key={permission.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selected.includes(permission.id)} onChange={() => toggle(permission.id)} />
                  {permission.label}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <div className="flex gap-2">
          {locked ? null : <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>}
          <Button variant="secondary" onClick={() => router.push("/roles")}>Voltar</Button>
        </div>
      </form>
    </div>
  );
}
