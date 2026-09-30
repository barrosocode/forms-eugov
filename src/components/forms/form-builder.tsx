"use client";

import { useEnvelope } from "@/components/hooks/use-envelope";
import { MembersPanel } from "@/components/forms/members-panel";
import { SectionEditor } from "@/components/forms/section-editor";
import { ShareFormButton } from "@/components/forms/share-form-button";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/modal";
import { FormStatusBadge } from "@/components/ui/status-badge";
import { apiRequest, isSuccess } from "@/lib/api";
import { sortedSections } from "@/lib/answers";
import { useAuth } from "@/lib/auth";
import { focusFirstFieldWithError } from "@/lib/focus-error";
import { canEditForm } from "@/lib/permissions";
import type { FormStatus } from "@/types/domain";
import type { Envelope } from "@/types/envelope";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function FormBuilder({ formId }: { formId: string }) {
  const router = useRouter();
  const { session } = useAuth();
  const { envelope, loading, reload } = useEnvelope(`/forms/${formId}`);
  const [title, setTitle] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const form = envelope?.form;
  const permissions = session?.user?.permissions;
  const canEdit = form ? canEditForm(form.my_role, permissions) : false;
  const locked = !canEdit || form?.status === "archived";
  const sections = form ? sortedSections(form) : [];
  const currentTitle = title ?? form?.title ?? "";
  const currentDescription = description ?? form?.description ?? "";

  function notify(result: Envelope): boolean {
    if (isSuccess(result)) {
      setFeedback({ tone: "success", message: result.message });
      setErrors({});
      return true;
    }
    setFeedback({ tone: "error", message: result.message });
    setErrors(result.errors ?? {});
    focusFirstFieldWithError(result.errors ?? {});
    return false;
  }

  async function refresh() {
    await reload();
    setTitle(null);
    setDescription(null);
    setRevision((value) => value + 1);
  }

  async function saveDetails() {
    const nextErrors: Record<string, string[]> = {};
    if (currentTitle.trim().length < 3 || currentTitle.trim().length > 200) nextErrors.title = ["O título deve ter de 3 a 200 caracteres."];
    if (currentDescription.length > 5000) nextErrors.description = ["A descrição deve ter no máximo 5000 caracteres."];
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstFieldWithError(nextErrors);
      return;
    }
    const result = await apiRequest(`/forms/${formId}`, {
      method: "PATCH",
      body: { title: currentTitle.trim(), description: currentDescription.trim() || null },
    });
    if (notify(result)) await refresh();
  }

  async function changeStatus(status: FormStatus) {
    const result = await apiRequest(`/forms/${formId}`, { method: "PATCH", body: { status } });
    notify(result);
    await refresh();
  }

  async function addSection() {
    if (sectionTitle.trim().length < 1) return;
    setPending(true);
    const result = await apiRequest(`/forms/${formId}/sections`, { method: "POST", body: { title: sectionTitle.trim() } });
    setPending(false);
    if (notify(result)) {
      setSectionTitle("");
      await refresh();
    }
  }

  async function removeForm() {
    setPending(true);
    const result = await apiRequest(`/forms/${formId}`, { method: "DELETE" });
    setPending(false);
    if (!notify(result)) {
      setConfirmDelete(false);
      return;
    }
    router.push("/forms");
  }

  if (loading) return <p className="text-sm text-muted">Carregando formulário...</p>;
  if (!form || (envelope && envelope.status >= 400)) return <Alert tone="error">{envelope?.message ?? "Formulário indisponível."}</Alert>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FormStatusBadge status={form.status} />
        <div className="flex flex-wrap gap-2">
          <Link href={`/forms/${formId}/responses`} className="rounded-lg border border-border px-3 py-2 text-sm">Respostas</Link>
          <Link href={`/f/${formId}`} className="rounded-lg border border-border px-3 py-2 text-sm">Página de resposta</Link>
          <ShareFormButton formId={formId} title={form.title} />
        </div>
      </div>
      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}
      {form.status === "archived" ? <Alert tone="info">Formulário arquivado. Dá para alterar somente o status.</Alert> : null}
      {!canEdit ? <Alert tone="info">Você visualiza este formulário. A estrutura é editada por um responsável.</Alert> : null}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <Field label="Título" name="title" error={errors.title?.[0]}>
          <input id="title" data-field="title" value={currentTitle} disabled={!canEdit} onChange={(event) => setTitle(event.target.value)} className={inputClass(Boolean(errors.title))} />
        </Field>
        <Field label="Descrição" name="description" error={errors.description?.[0]}>
          <textarea id="description" data-field="description" value={currentDescription} disabled={!canEdit} onChange={(event) => setDescription(event.target.value)} className={inputClass(Boolean(errors.description))} rows={3} />
        </Field>
        <Field label="Status" name="status" error={errors.status?.[0]} hint="Publicar exige ao menos uma seção, uma pergunta em cada seção e duas opções nas perguntas de escolha.">
          <select id="status" data-field="status" value={form.status} disabled={!canEdit} onChange={(event) => void changeStatus(event.target.value as FormStatus)} className={inputClass(Boolean(errors.status))}>
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
        </Field>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void saveDetails()}>Salvar dados</Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>Excluir formulário</Button>
          </div>
        ) : null}
      </section>
      {sections.map((section, index) => (
        <SectionEditor
          key={`${section.id}-${revision}`}
          section={section}
          index={index}
          total={sections.length}
          locked={locked}
          onReload={refresh}
          notify={notify}
        />
      ))}
      {locked ? null : (
        <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-card p-5 sm:flex-row">
          <input aria-label="Título da nova seção" value={sectionTitle} onChange={(event) => setSectionTitle(event.target.value)} placeholder="Título da nova seção" className={inputClass(false)} />
          <Button disabled={pending} onClick={() => void addSection()}>Adicionar seção</Button>
        </section>
      )}
      <MembersPanel formId={formId} canEdit={canEdit && form.status !== "archived"} permissions={permissions} notify={notify} />
      <ConfirmDialog
        open={confirmDelete}
        title="Excluir formulário"
        description="O formulário sai da listagem. As respostas deixam de ser acessadas por esta tela."
        pending={pending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void removeForm()}
      />
    </div>
  );
}
