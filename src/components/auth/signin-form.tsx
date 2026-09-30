"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { isSuccess } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { focusFirstFieldWithError } from "@/lib/focus-error";
import { safeNextPath } from "@/lib/text";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function clientErrors(email: string, password: string): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  if (!email.trim()) errors.email = ["O campo email é obrigatório."];
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = ["O campo email deve ser válido."];
  if (password.length < 8 || password.length > 72) errors.password = ["A senha deve ter de 8 a 72 caracteres."];
  return errors;
}

export function SignInForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = clientErrors(email, password);
    setErrors(nextErrors);
    setMessage(null);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstFieldWithError(nextErrors);
      return;
    }
    setPending(true);
    const envelope = await login(email.trim(), password);
    setPending(false);
    if (!isSuccess(envelope)) {
      setErrors(envelope.errors ?? {});
      setMessage(envelope.message);
      focusFirstFieldWithError(envelope.errors ?? {});
      return;
    }
    router.replace(safeNextPath(params.get("next")));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {message ? <Alert tone="error">{message}</Alert> : null}
      <Field label="E-mail" name="email" error={errors.email?.[0]}>
        <input
          id="email"
          name="email"
          data-field="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass(Boolean(errors.email?.length))}
          aria-invalid={Boolean(errors.email?.length)}
          aria-describedby={errors.email?.length ? "email-error" : undefined}
        />
      </Field>
      <Field label="Senha" name="password" error={errors.password?.[0]}>
        <input
          id="password"
          name="password"
          data-field="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass(Boolean(errors.password?.length))}
          aria-invalid={Boolean(errors.password?.length)}
          aria-describedby={errors.password?.length ? "password-error" : undefined}
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
