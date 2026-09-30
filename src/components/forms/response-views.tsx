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
import { cn, formatDateTime, toQuery } from "@/lib/text";
import type { Question, Submission } from "@/types/domain";
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
        action={
          <div className="flex gap-4">
            {canModerate ? <Link href={`/forms/${formId}/report`} className="text-sm font-medium text-brand">Relatório</Link> : null}
            <Link href={`/forms/${formId}`} className="text-sm font-medium text-brand">Voltar ao formulário</Link>
          </div>
        }
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

function hasTextAnswer(value: string | string[]): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function canFavoriteQuestion(question: Question | undefined, value: string | string[]): boolean {
  if (!question) return false;
  if (question.type !== "short" && question.type !== "long") return false;
  return hasTextAnswer(value);
}

function FavoriteStar({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("h-5 w-5", active ? "fill-amber-400 text-amber-400" : "fill-none text-muted")}>
      <path
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        d="M12 3.2 14.4 8.1l5.4.8-3.9 3.8.9 5.4L12 15.6 7.2 18.1l.9-5.4-3.9-3.8 5.4-.8L12 3.2z"
      />
    </svg>
  );
}

export function ResponseDetail({ formId, responseId }: { formId: string; responseId: string }) {
  const { session } = useAuth();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const formState = useEnvelope(`/forms/${formId}`);
  const responseState = useEnvelope(`/forms/${formId}/responses/${responseId}`);
  const questions = formState.envelope?.form ? flattenQuestions(formState.envelope.form) : [];
  const submission = responseState.envelope?.response;
  const canModerate = canEditForm(formState.envelope?.form?.my_role, session?.user?.permissions);

  async function toggleFavorite(questionId: string, currently: boolean) {
    setPendingId(questionId);
    setFeedback(null);
    const result = currently
      ? await apiRequest(`/forms/${formId}/responses/${responseId}/favorites/${questionId}`, { method: "DELETE" })
      : await apiRequest(`/forms/${formId}/responses/${responseId}/favorites`, {
          method: "POST",
          body: { question_id: questionId },
        });
    setPendingId(null);
    if (isSuccess(result)) {
      setOverrides((current) => ({ ...current, [questionId]: !currently }));
      return;
    }
    setFeedback(result.message);
  }

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
      {feedback ? <Alert tone="error">{feedback}</Alert> : null}
      <ul className="space-y-3">
        {submission.answers.map((answer) => {
          const question = questions.find((item) => item.id === answer.question_id);
          const favorited = overrides[answer.question_id] ?? Boolean(answer.favorited);
          const showStar = canModerate && canFavoriteQuestion(question, answer.value);
          return (
            <li key={answer.question_id} className="relative rounded-2xl border border-border bg-card p-4">
              {showStar ? (
                <button
                  type="button"
                  className="absolute top-3 right-3 rounded-md p-1 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={favorited ? "Remover dos favoritos" : "Favoritar resposta"}
                  aria-pressed={favorited}
                  disabled={pendingId === answer.question_id}
                  onClick={() => void toggleFavorite(answer.question_id, favorited)}
                >
                  <FavoriteStar active={favorited} />
                </button>
              ) : null}
              <p className={cn("text-sm text-muted", showStar && "pr-8")}>{question?.title ?? "Pergunta removida"}</p>
              <p className="mt-1 whitespace-pre-wrap">{displayAnswer(question, answer.value)}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
