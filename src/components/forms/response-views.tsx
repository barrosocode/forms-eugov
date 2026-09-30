"use client";

import { useEnvelope } from "@/components/hooks/use-envelope";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationBar } from "@/components/ui/pagination";
import { apiRequest, isSuccess } from "@/lib/api";
import { displayAnswer, flattenQuestions } from "@/lib/answers";
import { canEditForm } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";
import { formatDateTime, toQuery } from "@/lib/text";
import type { Submission } from "@/types/domain";
import Link from "next/link";
import { useState } from "react";

export function ResponseList({ formId }: { formId: string }) {
  const { session } = useAuth();
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<Submission | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const formState = useEnvelope(`/forms/${formId}`);
  const listState = useEnvelope(`/forms/${formId}/responses${toQuery({ page, page_size: 15 })}`);
  const canModerate = canEditForm(formState.envelope?.form?.my_role, session?.user?.permissions);
  const userId = session?.user?.id;

  async function remove() {
    if (!target) return;
    setPending(true);
    const result = await apiRequest(`/forms/${formId}/responses/${target.id}`, { method: "DELETE" });
    setPending(false);
    setTarget(null);
    setFeedback(result.message);
    if (isSuccess(result)) await listState.reload();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={formState.envelope?.form?.title ?? "Respostas"}
        description="Responsáveis veem todas as respostas. Os demais veem as próprias."
        action={<Link href={`/forms/${formId}`} className="text-sm font-medium text-brand">Voltar ao formulário</Link>}
      />
      {feedback ? <Alert tone="info">{feedback}</Alert> : null}
      {listState.loading ? <p className="text-sm text-muted">Carregando respostas...</p> : null}
      {listState.envelope && listState.envelope.status >= 400 ? <Alert tone="error">{listState.envelope.message}</Alert> : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Pessoa</th>
              <th className="px-4 py-3 font-medium">Enviada em</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {listState.envelope?.responses?.map((submission) => {
              const canDelete = canModerate || submission.respondent_id === userId;
              return (
                <tr key={submission.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{submission.respondent_name || "Visitante"}</p>
                    {submission.respondent_email ? <p className="text-xs text-muted">{submission.respondent_email}</p> : null}
                  </td>
                  <td className="px-4 py-3">{formatDateTime(submission.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link href={`/forms/${formId}/responses/${submission.id}`} className="text-brand">Ver</Link>
                      {canDelete ? <button type="button" className="text-danger" onClick={() => setTarget(submission)}>Excluir</button> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {listState.envelope?.responses?.length === 0 ? <p className="px-4 py-6 text-sm text-muted">Nenhuma resposta ainda.</p> : null}
      </div>
      <PaginationBar pagination={listState.envelope?.pagination} onPage={setPage} />
      <ConfirmDialog
        open={Boolean(target)}
        title="Excluir resposta"
        description="A resposta será removida da listagem."
        pending={pending}
        onClose={() => setTarget(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}

export function ResponseDetail({ formId, responseId }: { formId: string; responseId: string }) {
  const formState = useEnvelope(`/forms/${formId}`);
  const responseState = useEnvelope(`/forms/${formId}/responses/${responseId}`);
  const questions = formState.envelope?.form ? flattenQuestions(formState.envelope.form) : [];
  const submission = responseState.envelope?.response;

  if (responseState.loading) return <p className="text-sm text-muted">Carregando resposta...</p>;
  if (!submission || (responseState.envelope && responseState.envelope.status >= 400)) {
    return <Alert tone="error">{responseState.envelope?.message ?? "Resposta indisponível."}</Alert>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={submission.respondent_name || "Visitante"}
        description={`${submission.respondent_email ? `${submission.respondent_email} · ` : ""}${formatDateTime(submission.created_at)}`}
        action={<Link href={`/forms/${formId}/responses`} className="text-sm font-medium text-brand">Voltar</Link>}
      />
      <ul className="space-y-3">
        {submission.answers.map((answer) => {
          const question = questions.find((item) => item.id === answer.question_id);
          return (
            <li key={answer.question_id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-muted">{question?.title ?? "Pergunta removida"}</p>
              <p className="mt-1 whitespace-pre-wrap">{displayAnswer(question, answer.value)}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
