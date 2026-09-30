import type { MembershipRole } from "@/types/domain";

export function hasPermission(permissions: readonly string[] | undefined, required: string): boolean {
  if (!permissions || permissions.length === 0) return false;
  return permissions.includes("*") || permissions.includes(required);
}

export function canEditForm(
  myRole: MembershipRole | null | undefined,
  permissions: readonly string[] | undefined,
): boolean {
  return myRole === "owner" || hasPermission(permissions, "*");
}

export const PERMISSION_CATALOG: ReadonlyArray<{ id: string; label: string }> = [
  { id: "users:list", label: "Listar usuários" },
  { id: "users:view", label: "Ver usuário" },
  { id: "users:create", label: "Criar usuário" },
  { id: "users:update", label: "Editar usuário" },
  { id: "users:delete", label: "Excluir usuário" },
  { id: "roles:list", label: "Listar papéis" },
  { id: "roles:view", label: "Ver papel" },
  { id: "roles:create", label: "Criar papel" },
  { id: "roles:update", label: "Editar papel" },
  { id: "roles:delete", label: "Excluir papel" },
  { id: "forms:list", label: "Listar formulários" },
  { id: "forms:view", label: "Ver formulário" },
  { id: "forms:create", label: "Criar formulário" },
  { id: "forms:update", label: "Editar formulário" },
  { id: "forms:delete", label: "Excluir formulário" },
  { id: "responses:list", label: "Listar respostas" },
  { id: "responses:create", label: "Enviar resposta" },
];
