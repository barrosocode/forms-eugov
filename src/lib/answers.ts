import type { Answer, FormSummary, Question, QuestionType, Section } from "@/types/domain";

const CHOICE_TYPES: ReadonlySet<QuestionType> = new Set(["radio", "checkbox", "select", "classification"]);

export function isChoiceType(type: QuestionType): boolean {
  return CHOICE_TYPES.has(type);
}

export function sortedSections(form: FormSummary): Section[] {
  return [...(form.sections ?? [])].sort((a, b) => a.order - b.order);
}

export function sortedQuestions(section: Section): Question[] {
  return [...(section.questions ?? [])].sort((a, b) => a.order - b.order);
}

export function flattenQuestions(form: FormSummary): Question[] {
  return sortedSections(form).flatMap((section) => sortedQuestions(section));
}

export function optionLabel(question: Question, optionId: string): string {
  return question.options?.find((option) => option.id === optionId)?.value ?? "Opção removida";
}

export function displayAnswer(question: Question | undefined, value: string | string[]): string {
  if (!question) return "Pergunta removida";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map((item) => optionLabel(question, item)).join(", ");
  }
  if (!value) return "—";
  if (isChoiceType(question.type)) return optionLabel(question, value);
  return value;
}

export function collectAnswers(
  questions: readonly Question[],
  values: Record<string, string | string[]>,
): { answers: Answer[] } | { errors: Record<string, string[]> } {
  const answers: Answer[] = [];
  const errors: Record<string, string[]> = {};

  for (const question of questions) {
    const raw = values[question.id];
    if (question.type === "checkbox") {
      const selected = Array.isArray(raw) ? raw.filter(Boolean) : [];
      if (question.required && selected.length === 0) {
        errors[question.id] = ["Esta pergunta é obrigatória."];
      } else if (selected.length > 0) {
        answers.push({ question_id: question.id, value: selected });
      }
      continue;
    }

    const text = typeof raw === "string" ? raw.trim() : "";
    if (question.required && text.length === 0) {
      errors[question.id] = ["Esta pergunta é obrigatória."];
      continue;
    }
    if (text.length === 0) continue;
    if (question.type === "short" && text.length > 200) {
      errors[question.id] = ["Use no máximo 200 caracteres."];
      continue;
    }
    if (question.type === "long" && text.length > 5000) {
      errors[question.id] = ["Use no máximo 5000 caracteres."];
      continue;
    }
    answers.push({ question_id: question.id, value: text });
  }

  if (Object.keys(errors).length > 0) return { errors };
  return { answers };
}
