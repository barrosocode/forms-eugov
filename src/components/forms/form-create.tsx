"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { ShareFormButton } from "@/components/forms/share-form-button";
import { PageHeader } from "@/components/ui/page-header";
import { apiRequest, isSuccess } from "@/lib/api";
import { focusFirstFieldWithError } from "@/lib/focus-error";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function FormCreate() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string[]> = {};
    if (title.trim().length < 3 || title.trim().length > 200) nextErrors.title = ["O título deve ter de 3 a 200 caracteres."];
    if (description.length > 5000) nextErrors.description = ["A descrição deve ter no máximo 5000 caracteres."];
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstFieldWithError(nextErrors);
      return;
    }
    setPending(true);
    const envelope = await apiRequest("/forms", {
      method: "POST",
      body: { title: title.trim(), description: description.trim() || null },
    });
    setPending(false);
    if (!isSuccess(envelope) || !envelope.form) {
      setErrors(envelope.errors ?? {});
      setMessage(envelope.message);
      focusFirstFieldWithError(envelope.errors ?? {});
      return;
    }
    router.replace(`/forms/${envelope.form.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Novo formulário"
        description="Ele nasce como rascunho e você entra como responsável."
        action={<ShareFormButton />}
      />
      {message ? <Alert tone="error">{message}</Alert> : null}
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5" noValidate>
        <Field label="Título" name="title" error={errors.title?.[0]}>
          <input id="title" data-field="title" value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass(Boolean(errors.title))} />
        </Field>
        <Field label="Descrição" name="description" error={errors.description?.[0]}>
          <textarea id="description" data-field="description" value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass(Boolean(errors.description))} rows={4} />
        </Field>
        <Button type="submit" disabled={pending}>{pending ? "Criando..." : "Criar e montar"}</Button>
      </form>
    </div>
  );
}
