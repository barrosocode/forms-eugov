"use client";

import { useEnvelope } from "@/components/hooks/use-envelope";
import { BarChart, PieChart, StarredReport } from "@/components/forms/report-charts";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { formatCount } from "@/lib/report";
import { QUESTION_TYPE_LABEL } from "@/lib/labels";
import type { ReportQuestion } from "@/types/domain";
import Link from "next/link";

function QuestionChart({ question }: { question: ReportQuestion }) {
  if (question.chart === "pie") return <PieChart options={question.options ?? []} />;
  if (question.chart === "bar") return <BarChart options={question.options ?? []} />;
  return <StarredReport percent={question.percent_starred ?? 0} responses={question.starred_responses ?? []} />;
}

export function FormReport({ formId }: { formId: string }) {
  const formState = useEnvelope(`/forms/${formId}`);
  const reportState = useEnvelope(`/forms/${formId}/report`);
  const form = formState.envelope?.form;
  const report = reportState.envelope?.report;
  const failed = reportState.envelope && reportState.envelope.status >= 400;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={form?.title ?? "Relatório"}
        description={report ? `${formatCount(report.total_responses)} no total.` : "Distribuição das respostas por pergunta."}
        action={<Link href={`/forms/${formId}`} className="text-sm font-medium text-brand">Voltar ao formulário</Link>}
      />
      {reportState.loading ? <p className="text-sm text-muted">Carregando relatório...</p> : null}
      {failed ? <Alert tone="error">{reportState.envelope?.message ?? "Relatório indisponível."}</Alert> : null}
      {report?.questions.length === 0 ? <p className="text-sm text-muted">Este formulário ainda não tem perguntas.</p> : null}
      <div className="space-y-4">
        {report?.questions.map((question) => (
          <article key={question.question_id} className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <header>
              <p className="text-xs font-medium tracking-wide text-muted uppercase">{QUESTION_TYPE_LABEL[question.type]}</p>
              <h2 className="mt-1 text-lg font-semibold">{question.title}</h2>
            </header>
            <QuestionChart question={question} />
          </article>
        ))}
      </div>
    </div>
  );
}
