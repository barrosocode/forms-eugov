import type { FormStatus, MembershipRole, QuestionType, UserStatus } from "@/types/domain";

export const FORM_STATUS_LABEL: Record<FormStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  short: "Resposta curta",
  long: "Resposta longa",
  radio: "Múltipla escolha",
  checkbox: "Caixas de seleção",
  select: "Lista suspensa",
  classification: "Classificação",
};

export const MEMBER_ROLE_LABEL: Record<MembershipRole, string> = {
  owner: "Responsável",
  member: "Membro",
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  suspended: "Suspenso",
};
