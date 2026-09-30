"use client";

import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/modal";
import { apiRequest, isSuccess } from "@/lib/api";
import { QUESTION_TYPE_LABEL } from "@/lib/labels";
import { isChoiceType, sortedQuestions } from "@/lib/answers";
import type { Question, QuestionType, Section } from "@/types/domain";
import type { Envelope } from "@/types/envelope";
import { useState } from "react";

const TYPES: QuestionType[] = ["short", "long", "radio", "checkbox", "select", "classification"];

export function SectionEditor({
  section,
  index,
  total,
  locked,
  onReload,
  notify,
}: {
  section: Section;
  index: number;
  total: number;
  locked: boolean;
  onReload: () => Promise<void>;
  notify: (envelope: Envelope) => void;
}) {
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description ?? "");
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("short");
  const [required, setRequired] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const questions = sortedQuestions(section);

  async function saveSection() {
    const result = await apiRequest(`/sections/${section.id}`, {
      method: "PATCH",
      body: { title: title.trim(), description: description.trim() || null },
    });
    notify(result);
    if (isSuccess(result)) await onReload();
  }

  async function move(direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= total) return;
    const result = await apiRequest(`/sections/${section.id}`, { method: "PATCH", body: { order: target } });
    notify(result);
    if (isSuccess(result)) await onReload();
  }

  async function removeSection() {
    setPending(true);
    const result = await apiRequest(`/sections/${section.id}`, { method: "DELETE" });
    setPending(false);
    setConfirmDelete(false);
    notify(result);
    if (isSuccess(result)) await onReload();
  }

  async function addQuestion() {
    if (questionTitle.trim().length < 1) {
      notify({ status: 422, message: "Informe o título da pergunta.", errors: {}, error_code: "VALIDATION_ERROR" });
      return;
    }
    setPending(true);
    const result = await apiRequest(`/sections/${section.id}/questions`, {
      method: "POST",
      body: { title: questionTitle.trim(), type: questionType, required },
    });
    setPending(false);
    notify(result);
    if (isSuccess(result)) {
      setQuestionTitle("");
      await onReload();
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm font-medium text-brand">Seção {index + 1}</p>
        {locked ? null : (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void move(-1)} disabled={index === 0}>Subir</Button>
            <Button variant="secondary" onClick={() => void move(1)} disabled={index === total - 1}>Descer</Button>
            <Button variant="ghost" className="text-danger" onClick={() => setConfirmDelete(true)}>Excluir seção</Button>
          </div>
        )}
      </div>
      <input aria-label={`Título da seção ${index + 1}`} value={title} disabled={locked} onChange={(event) => setTitle(event.target.value)} className={inputClass(false)} />
      <textarea aria-label={`Descrição da seção ${index + 1}`} value={description} disabled={locked} onChange={(event) => setDescription(event.target.value)} className={inputClass(false)} rows={2} />
      {locked ? null : <Button variant="secondary" onClick={() => void saveSection()}>Salvar seção</Button>}
      <div className="space-y-3">
        {questions.map((question, questionIndex) => (
          <QuestionEditor
            key={question.id}
            question={question}
            index={questionIndex}
            total={questions.length}
            locked={locked}
            onReload={onReload}
            notify={notify}
          />
        ))}
      </div>
      {locked ? null : (
        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_180px_auto]">
          <input aria-label="Título da nova pergunta" value={questionTitle} onChange={(event) => setQuestionTitle(event.target.value)} placeholder="Nova pergunta" className={inputClass(false)} />
          <select aria-label="Tipo da nova pergunta" value={questionType} onChange={(event) => setQuestionType(event.target.value as QuestionType)} className={inputClass(false)}>
            {TYPES.map((type) => <option key={type} value={type}>{QUESTION_TYPE_LABEL[type]}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
            Obrigatória
          </label>
          <Button className="sm:col-span-3 sm:w-fit" disabled={pending} onClick={() => void addQuestion()}>Adicionar pergunta</Button>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Excluir seção"
        description="As perguntas desta seção também serão removidas."
        pending={pending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void removeSection()}
      />
    </section>
  );
}

function QuestionEditor({
  question,
  index,
  total,
  locked,
  onReload,
  notify,
}: {
  question: Question;
  index: number;
  total: number;
  locked: boolean;
  onReload: () => Promise<void>;
  notify: (envelope: Envelope) => void;
}) {
  const [title, setTitle] = useState(question.title);
  const [required, setRequired] = useState(question.required);
  const [optionValue, setOptionValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const options = [...(question.options ?? [])].sort((a, b) => a.order - b.order);

  async function save() {
    const result = await apiRequest(`/questions/${question.id}`, {
      method: "PATCH",
      body: { title: title.trim(), required },
    });
    notify(result);
    if (isSuccess(result)) await onReload();
  }

  async function move(direction: -1 | 1) {
    const result = await apiRequest(`/questions/${question.id}`, { method: "PATCH", body: { order: index + direction } });
    notify(result);
    if (isSuccess(result)) await onReload();
  }

  async function remove() {
    setPending(true);
    const result = await apiRequest(`/questions/${question.id}`, { method: "DELETE" });
    setPending(false);
    setConfirmDelete(false);
    notify(result);
    if (isSuccess(result)) await onReload();
  }

  async function addOption() {
    if (optionValue.trim().length < 1) return;
    const result = await apiRequest(`/questions/${question.id}/options`, { method: "POST", body: { value: optionValue.trim() } });
    notify(result);
    if (isSuccess(result)) {
      setOptionValue("");
      await onReload();
    }
  }

  async function removeOption(optionId: string) {
    const result = await apiRequest(`/options/${optionId}`, { method: "DELETE" });
    notify(result);
    if (isSuccess(result)) await onReload();
  }

  return (
    <article className="space-y-3 rounded-xl border border-border bg-background p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{QUESTION_TYPE_LABEL[question.type]} · Pergunta {index + 1}</p>
        {locked ? null : (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => void move(-1)} disabled={index === 0}>Subir</Button>
            <Button variant="ghost" onClick={() => void move(1)} disabled={index === total - 1}>Descer</Button>
            <Button variant="ghost" className="text-danger" onClick={() => setConfirmDelete(true)}>Excluir</Button>
          </div>
        )}
      </div>
      <input aria-label={`Título da pergunta ${index + 1}`} value={title} disabled={locked} onChange={(event) => setTitle(event.target.value)} className={inputClass(false)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={required} disabled={locked} onChange={(event) => setRequired(event.target.checked)} />
        Obrigatória
      </label>
      {locked ? null : <Button variant="secondary" onClick={() => void save()}>Salvar pergunta</Button>}
      {isChoiceType(question.type) ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">Opções. Perguntas de escolha publicadas precisam de pelo menos duas.</p>
          <ul className="space-y-2">
            {options.map((option, optionIndex) => (
              <li key={option.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <span>{optionIndex + 1}. {option.value}</span>
                {locked ? null : (
                  <button type="button" className="text-danger" onClick={() => void removeOption(option.id)}>Remover</button>
                )}
              </li>
            ))}
          </ul>
          {locked ? null : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input aria-label="Nova opção" value={optionValue} onChange={(event) => setOptionValue(event.target.value)} placeholder="Texto da opção" className={inputClass(false)} />
              <Button variant="secondary" onClick={() => void addOption()}>Adicionar opção</Button>
            </div>
          )}
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmDelete}
        title="Excluir pergunta"
        description="A pergunta e as opções dela serão removidas."
        pending={pending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </article>
  );
}
