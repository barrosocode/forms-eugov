"use client";

import { useEnvelope } from "@/components/hooks/use-envelope";
import { apiRequest, isSuccess } from "@/lib/api";
import { collectAnswers, flattenQuestions, sortedQuestions, sortedSections } from "@/lib/answers";
import { focusFirstFieldWithError } from "@/lib/focus-error";
import { cn } from "@/lib/text";
import type { Question } from "@/types/domain";
import { useRef, useState } from "react";

const controlClass =
  "min-h-11 w-full rounded-md border border-[#0a2342]/25 bg-transparent px-3 py-2 text-sm text-[#0a2342] shadow-sm transition-colors placeholder:text-[#27476e]/70 focus-visible:border-[#0fa8a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0fa8a0] disabled:cursor-not-allowed disabled:opacity-60";

export function FillForm({ formId }: { formId: string }) {
  const { envelope, loading } = useEnvelope(`/forms/${formId}`, { redirectOnUnauthorized: false });
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(0);
  const skipSubmit = useRef(false);
  const form = envelope?.form;
  const sections = form ? sortedSections(form) : [];
  const currentStep = sections.length === 0 ? 0 : Math.min(step, sections.length - 1);
  const currentSection = sections[currentStep];
  const isLastStep = sections.length === 0 || currentStep === sections.length - 1;

  function setValue(questionId: string, value: string | string[]) {
    setValues((current) => ({ ...current, [questionId]: value }));
  }

  function showStepErrors(nextErrors: Record<string, string[]>, notice: string) {
    setErrors(nextErrors);
    setMessage(notice);
    const errorIds = new Set(Object.keys(nextErrors));
    const index = sections.findIndex((section) => sortedQuestions(section).some((question) => errorIds.has(question.id)));
    if (index >= 0 && index !== currentStep) {
      setStep(index);
      window.setTimeout(() => focusFirstFieldWithError(nextErrors), 0);
      return;
    }
    focusFirstFieldWithError(nextErrors);
  }

  function goBack() {
    if (currentStep === 0 || pending) return;
    setErrors({});
    setMessage(null);
    setStep(currentStep - 1);
  }

  function goNext() {
    if (!currentSection || isLastStep) return;
    const collected = collectAnswers(sortedQuestions(currentSection), values);
    if ("errors" in collected) {
      showStepErrors(collected.errors, "Revise as perguntas destacadas.");
      return;
    }
    setErrors({});
    setMessage(null);
    skipSubmit.current = true;
    setStep(currentStep + 1);
    window.setTimeout(() => {
      skipSubmit.current = false;
    }, 0);
  }

  async function sendResponse() {
    if (skipSubmit.current || !form || !isLastStep || pending) return;
    const questions = flattenQuestions(form);
    const collected = collectAnswers(questions, values);
    if ("errors" in collected) {
      showStepErrors(collected.errors, "Revise as perguntas destacadas.");
      return;
    }
    setPending(true);
    const result = await apiRequest(`/forms/${formId}/responses`, {
      method: "POST",
      body: { answers: collected.answers },
      redirectOnUnauthorized: false,
    });
    setPending(false);
    if (!isSuccess(result)) {
      showStepErrors(result.errors ?? {}, result.message);
      return;
    }
    setDone(true);
    setMessage(result.message);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendResponse();
  }

  if (loading) {
    return <p className="text-sm text-[#27476e]">Carregando formulário...</p>;
  }

  if (!form || (envelope && envelope.status >= 400)) {
    return (
      <div className="relative border border-[#0a2342]/40 bg-[#fbf7ec] p-8 shadow-[0_24px_60px_-30px_rgba(10,35,66,0.35)]">
        <div className="pointer-events-none absolute inset-2.5 border border-[#0a2342]/15" />
        <p className="relative text-sm text-[#0a2342]">{envelope?.message ?? "Este formulário não está disponível."}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="relative border border-[#0a2342]/40 bg-[#fbf7ec] p-8 shadow-[0_24px_60px_-30px_rgba(10,35,66,0.35)] sm:p-12">
        <div className="pointer-events-none absolute inset-2.5 border border-[#0a2342]/15" />
        <div className="relative space-y-3">
          <p className="text-[0.68rem] font-bold tracking-[0.32em] text-[#0b837d] uppercase">EuGoV / Formulário</p>
          <h1 className="text-3xl font-semibold tracking-tight [font-family:var(--font-public-display),sans-serif] sm:text-4xl">{form.title}</h1>
          <p className="max-w-xl text-[#27476e]">{message ?? "Resposta enviada. Obrigado."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="w-full space-y-4">
        <p className="text-[0.68rem] font-bold tracking-[0.32em] text-[#0b837d] uppercase">EuGoV / Formulário</p>
        <h1 className="text-4xl font-semibold tracking-tight [font-family:var(--font-public-display),sans-serif] sm:text-5xl">{form.title}</h1>
        {form.description ? <p className="text-lg leading-relaxed text-[#27476e]">{form.description}</p> : null}
      </div>
      <div className="relative w-full border border-[#0a2342]/40 bg-[#fbf7ec] p-6 shadow-[0_24px_60px_-30px_rgba(10,35,66,0.35)] sm:p-10">
        <div className="pointer-events-none absolute inset-2.5 border border-[#0a2342]/15" />
        <form onSubmit={onSubmit} className="relative space-y-6" noValidate>
          <p className="text-[0.68rem] font-bold tracking-[0.32em] text-[#0b837d] uppercase">
            EuGoV / Resposta / {String(currentStep + 1).padStart(2, "0")}
          </p>
          {form.status !== "published" ? (
            <p className="rounded-md border border-[#0a2342]/20 bg-[#f4eddf] px-3 py-2 text-sm text-[#27476e]" role="status">
              Este formulário está {form.status === "draft" ? "em rascunho" : "arquivado"} e não aceita respostas.
            </p>
          ) : null}
          {message ? (
            <p className="rounded-md border border-[#d92d20]/30 bg-[#d92d20]/5 px-3 py-2 text-sm text-[#d92d20]" role="alert">
              {message}
            </p>
          ) : null}
          {currentSection ? (
            <section className="space-y-5">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight [font-family:var(--font-public-display),sans-serif]">{currentSection.title}</h2>
                {currentSection.description ? <p className="mt-1 text-sm text-[#27476e]">{currentSection.description}</p> : null}
              </div>
              {sortedQuestions(currentSection).map((question) => (
                <QuestionField
                  key={question.id}
                  question={question}
                  value={values[question.id]}
                  error={errors[question.id]?.[0]}
                  disabled={form.status !== "published" || pending}
                  onChange={(value) => setValue(question.id, value)}
                />
              ))}
            </section>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 0 || pending}
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#0a2342]/25 bg-transparent px-8 text-sm font-medium text-[#0a2342] transition-colors hover:bg-[#f4eddf] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  void sendResponse();
                  return;
                }
                goNext();
              }}
              disabled={pending || form.status !== "published"}
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#0a2342] px-8 text-sm font-medium text-[#fbf7ec] shadow transition-colors hover:bg-[#0a2342]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Enviando..." : isLastStep ? "Enviar resposta" : "Próximo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionField({
  question,
  value,
  error,
  disabled,
  onChange,
}: {
  question: Question;
  value: string | string[] | undefined;
  error?: string;
  disabled: boolean;
  onChange: (value: string | string[]) => void;
}) {
  const options = [...(question.options ?? [])].sort((a, b) => a.order - b.order);
  const text = typeof value === "string" ? value : "";
  return (
    <fieldset className="space-y-2">
      <legend className="text-[0.62rem] font-extrabold tracking-[0.24em] text-[#27476e] uppercase">
        {question.title}
        {question.required ? <span className="text-[#d92d20]"> *</span> : null}
      </legend>
      {question.type === "short" ? (
        <input data-field={question.id} value={text} disabled={disabled} maxLength={200} onChange={(event) => onChange(event.target.value)} className={cn(controlClass, error && "border-[#d92d20]")} autoComplete="off" />
      ) : null}
      {question.type === "long" ? (
        <textarea data-field={question.id} value={text} disabled={disabled} maxLength={5000} rows={5} onChange={(event) => onChange(event.target.value)} className={cn(controlClass, "min-h-[7.5rem]", error && "border-[#d92d20]")} autoComplete="off" />
      ) : null}
      {question.type === "select" ? (
        <select data-field={question.id} value={text} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={cn(controlClass, error && "border-[#d92d20]")}>
          <option value="">Selecione</option>
          {options.map((option) => <option key={option.id} value={option.id}>{option.value}</option>)}
        </select>
      ) : null}
      {question.type === "radio" || question.type === "classification" ? (
        <div className={cn("flex flex-col gap-2", question.type === "classification" && "sm:flex-row sm:flex-wrap")}>
          {options.map((option, optionIndex) => (
            <label key={option.id} className={cn("flex min-h-11 items-center gap-2 rounded-md border border-[#0a2342]/25 px-3 py-2 text-sm", text === option.id && "border-[#0fa8a0] bg-[#0fa8a0]/10")}>
              <input data-field={optionIndex === 0 ? question.id : undefined} type="radio" name={question.id} value={option.id} checked={text === option.id} disabled={disabled} onChange={() => onChange(option.id)} className="accent-[#0fa8a0]" />
              {option.value}
            </label>
          ))}
        </div>
      ) : null}
      {question.type === "checkbox" ? (
        <div className="space-y-2">
          {options.map((option, optionIndex) => {
            const selected = Array.isArray(value) ? value : [];
            const checked = selected.includes(option.id);
            return (
              <label key={option.id} className={cn("flex min-h-11 items-center gap-2 rounded-md border border-[#0a2342]/25 px-3 py-2 text-sm", checked && "border-[#0fa8a0] bg-[#0fa8a0]/10")}>
                <input
                  data-field={optionIndex === 0 ? question.id : undefined}
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onChange(checked ? selected.filter((item) => item !== option.id) : [...selected, option.id])}
                  className="accent-[#0fa8a0]"
                />
                {option.value}
              </label>
            );
          })}
        </div>
      ) : null}
      {error ? <p className="text-sm text-[#d92d20]" role="alert">{error}</p> : null}
    </fieldset>
  );
}
