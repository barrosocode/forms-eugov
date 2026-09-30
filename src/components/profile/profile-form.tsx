"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { apiRequest, isSuccess } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { focusFirstFieldWithError } from "@/lib/focus-error";
import { maskCpf, maskPhone, onlyDigits } from "@/lib/text";
import type { User } from "@/types/domain";
import { useState } from "react";

export function ProfileForm() {
  const { session, loading, refreshSession } = useAuth();
  if (loading) return <p className="text-sm text-muted">Carregando perfil...</p>;
  if (!session?.user) return <Alert tone="error">Não foi possível carregar o perfil.</Alert>;
  return <ProfileFields key={session.user.updated_at} user={session.user} onSaved={refreshSession} />;
}

function ProfileFields({ user, onSaved }: { user: User; onSaved: () => Promise<unknown> }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ? maskPhone(user.phone) : "");
  const [cpf, setCpf] = useState(user.cpf ? maskCpf(user.cpf) : "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string[]> = {};
    if (name.trim().length < 3) nextErrors.name = ["O nome deve ter de 3 a 150 caracteres."];
    if (password && (password.length < 8 || password.length > 72)) nextErrors.password = ["A senha deve ter de 8 a 72 caracteres."];
    if (password && !currentPassword) nextErrors.current_password = ["Informe a senha atual para definir uma nova."];
    const phoneDigits = onlyDigits(phone);
    if (phoneDigits && (phoneDigits.length < 10 || phoneDigits.length > 13)) nextErrors.phone = ["O telefone deve ter de 10 a 13 dígitos."];
    const cpfDigits = onlyDigits(cpf);
    if (cpfDigits && cpfDigits.length !== 11) nextErrors.cpf = ["O CPF deve ter 11 dígitos."];
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstFieldWithError(nextErrors);
      return;
    }

    const body: Record<string, string | null> = {
      name: name.trim(),
      email: email.trim(),
      phone: phoneDigits || null,
      cpf: cpfDigits || null,
      avatar_url: avatarUrl.trim() || null,
    };
    if (password) {
      body.password = password;
      body.current_password = currentPassword;
    }

    setPending(true);
    const envelope = await apiRequest("/auth/me", { method: "PUT", body });
    setPending(false);
    if (!isSuccess(envelope)) {
      setErrors(envelope.errors ?? {});
      setFeedback({ tone: "error", message: envelope.message });
      focusFirstFieldWithError(envelope.errors ?? {});
      return;
    }
    setPassword("");
    setCurrentPassword("");
    setFeedback({ tone: "success", message: envelope.message });
    await onSaved();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Perfil" description="Estes dados são seus. O CPF aparece somente nesta tela." />
      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5" noValidate>
        <Field label="Nome" name="name" error={errors.name?.[0]}>
          <input id="name" data-field="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass(Boolean(errors.name))} autoComplete="name" />
        </Field>
        <Field label="E-mail" name="email" error={errors.email?.[0]}>
          <input id="email" data-field="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass(Boolean(errors.email))} autoComplete="email" />
        </Field>
        <Field label="Telefone" name="phone" error={errors.phone?.[0]}>
          <input id="phone" data-field="phone" value={phone} onChange={(event) => setPhone(maskPhone(event.target.value))} className={inputClass(Boolean(errors.phone))} autoComplete="tel" inputMode="tel" />
        </Field>
        <Field label="CPF" name="cpf" error={errors.cpf?.[0]} hint="Dado sensível. Fica visível apenas para você.">
          <input id="cpf" data-field="cpf" value={cpf} onChange={(event) => setCpf(maskCpf(event.target.value))} className={inputClass(Boolean(errors.cpf))} autoComplete="off" inputMode="numeric" />
        </Field>
        <Field label="URL do avatar" name="avatar_url" error={errors.avatar_url?.[0]}>
          <input id="avatar_url" data-field="avatar_url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className={inputClass(Boolean(errors.avatar_url))} autoComplete="off" />
        </Field>
        <Field label="Nova senha" name="password" error={errors.password?.[0]} hint="Deixe em branco para manter a senha atual.">
          <input id="password" data-field="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass(Boolean(errors.password))} autoComplete="new-password" />
        </Field>
        <Field label="Senha atual" name="current_password" error={errors.current_password?.[0]}>
          <input id="current_password" data-field="current_password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass(Boolean(errors.current_password))} autoComplete="current-password" />
        </Field>
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar perfil"}</Button>
      </form>
    </div>
  );
}
