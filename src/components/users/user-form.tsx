"use client";

import { useEnvelope } from "@/components/hooks/use-envelope";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationBar } from "@/components/ui/pagination";
import { apiRequest, isSuccess } from "@/lib/api";
import { focusFirstFieldWithError } from "@/lib/focus-error";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";
import { maskPhone, onlyDigits, toQuery } from "@/lib/text";
import type { Role, User, UserStatus } from "@/types/domain";
import type { Envelope } from "@/types/envelope";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserForm({ userId }: { userId?: string }) {
  const { session } = useAuth();
  const canPickRoles = hasPermission(session?.user?.permissions, "roles:list");
  const [rolePage, setRolePage] = useState(1);
  const userPath = userId ? `/users/${userId}` : null;
  const { envelope: userEnvelope, loading } = useEnvelope(userPath);
  const { envelope: rolesEnvelope } = useEnvelope(canPickRoles ? `/roles${toQuery({ page: rolePage, page_size: 15 })}` : null);
  if (userId && loading) return <p className="text-sm text-muted">Carregando usuário...</p>;
  if (userId && userEnvelope && userEnvelope.status >= 400) return <Alert tone="error">{userEnvelope.message}</Alert>;
  if (userId && !userEnvelope?.user) return <p className="text-sm text-muted">Carregando usuário...</p>;

  return (
    <UserFields
      key={userEnvelope?.user?.updated_at ?? "new"}
      userId={userId}
      user={userEnvelope?.user}
      roles={rolesEnvelope?.roles ?? []}
      rolesPagination={rolesEnvelope?.pagination}
      canPickRoles={canPickRoles}
      onRolePage={setRolePage}
    />
  );
}

function UserFields({
  userId,
  user,
  roles,
  rolesPagination,
  canPickRoles,
  onRolePage,
}: {
  userId?: string;
  user?: User;
  roles: Role[];
  rolesPagination: Envelope["pagination"];
  canPickRoles: boolean;
  onRolePage: (page: number) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(user?.phone ? maskPhone(user.phone) : "");
  const [status, setStatus] = useState<UserStatus>(user?.status ?? "active");
  const [roleIds, setRoleIds] = useState<string[]>(user?.roles.map((role) => role.id) ?? []);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pending, setPending] = useState(false);

  function toggleRole(id: string) {
    setRoleIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string[]> = {};
    if (name.trim().length < 3 || name.trim().length > 150) nextErrors.name = ["O nome deve ter de 3 a 150 caracteres."];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = ["O campo email deve ser válido."];
    if (!userId && (password.length < 8 || password.length > 72)) nextErrors.password = ["A senha deve ter de 8 a 72 caracteres."];
    if (userId && password && (password.length < 8 || password.length > 72)) nextErrors.password = ["A senha deve ter de 8 a 72 caracteres."];
    if (userId && roleIds.length === 0) nextErrors.role_ids = ["Selecione ao menos um papel."];
    const phoneDigits = onlyDigits(phone);
    if (phoneDigits && (phoneDigits.length < 10 || phoneDigits.length > 13)) nextErrors.phone = ["O telefone deve ter de 10 a 13 dígitos."];
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstFieldWithError(nextErrors);
      return;
    }

    const body: Record<string, unknown> = {
      name: name.trim(),
      email: email.trim(),
      phone: phoneDigits || null,
      status,
      role_ids: roleIds,
    };
    if (password) body.password = password;
    setPending(true);
    const result = await apiRequest(userId ? `/users/${userId}` : "/users", {
      method: userId ? "PUT" : "POST",
      body,
    });
    setPending(false);
    if (!isSuccess(result)) {
      setErrors(result.errors ?? {});
      setFeedback({ tone: "error", message: result.message });
      focusFirstFieldWithError(result.errors ?? {});
      return;
    }
    router.push("/users");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={userId ? "Editar usuário" : "Novo usuário"} description="O CPF de outra pessoa não é exibido nem pedido nesta tela." />
      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5" noValidate>
        <Field label="Nome" name="name" error={errors.name?.[0]}>
          <input id="name" data-field="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass(Boolean(errors.name))} autoComplete="name" />
        </Field>
        <Field label="E-mail" name="email" error={errors.email?.[0]}>
          <input id="email" data-field="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass(Boolean(errors.email))} autoComplete="off" />
        </Field>
        <Field label={userId ? "Nova senha" : "Senha"} name="password" error={errors.password?.[0]} hint={userId ? "Opcional." : "De 8 a 72 caracteres."}>
          <input id="password" data-field="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass(Boolean(errors.password))} autoComplete="new-password" />
        </Field>
        <Field label="Telefone" name="phone" error={errors.phone?.[0]}>
          <input id="phone" data-field="phone" value={phone} onChange={(event) => setPhone(maskPhone(event.target.value))} className={inputClass(Boolean(errors.phone))} autoComplete="off" inputMode="tel" />
        </Field>
        <Field label="Status" name="status" error={errors.status?.[0]}>
          <select id="status" data-field="status" value={status} onChange={(event) => setStatus(event.target.value as UserStatus)} className={inputClass(Boolean(errors.status))}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="suspended">Suspenso</option>
          </select>
        </Field>
        <fieldset className="space-y-2" data-field="role_ids">
          <legend className="text-sm font-medium">Papéis</legend>
          {userId ? null : <p className="text-xs text-muted">Sem seleção, a API atribui o papel de usuário.</p>}
          {errors.role_ids?.[0] ? <p className="text-sm text-danger" role="alert">{errors.role_ids[0]}</p> : null}
          {!canPickRoles ? <p className="text-sm text-muted">Seu papel não lista os papéis disponíveis. Os papéis atuais serão mantidos.</p> : null}
          {user && !canPickRoles ? (
            <p className="text-sm">{user.roles.map((role) => role.display_name).join(", ")}</p>
          ) : null}
          <ul className="space-y-2">
            {roles.map((role) => (
              <li key={role.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={roleIds.includes(role.id)} onChange={() => toggleRole(role.id)} />
                  {role.display_name}
                </label>
              </li>
            ))}
          </ul>
          <PaginationBar pagination={rolesPagination} onPage={onRolePage} />
        </fieldset>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
          <Button variant="secondary" onClick={() => router.push("/users")}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
