export type UserStatus = "active" | "inactive" | "suspended";
export type FormStatus = "draft" | "published" | "archived";
export type QuestionType = "short" | "long" | "radio" | "checkbox" | "select" | "classification";
export type MembershipRole = "owner" | "member";
export type RoleScope = "master" | "tenant";

export interface RoleRef {
  id: string;
  name: string;
  display_name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: UserStatus;
  email_verified_at: string | null;
  last_login_at: string | null;
  roles: RoleRef[];
  permissions?: string[];
  cpf?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  scope: RoleScope;
  is_system: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface OptionItem {
  id: string;
  value: string;
  order: number;
}

export interface Question {
  id: string;
  title: string;
  type: QuestionType;
  required: boolean;
  order: number;
  options?: OptionItem[];
}

export interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  questions?: Question[];
}

export interface FormSummary {
  id: string;
  title: string;
  description: string | null;
  status: FormStatus;
  created_by: string;
  my_role: MembershipRole | null;
  created_at: string;
  updated_at: string;
  sections?: Section[];
}

export interface Member {
  id: string;
  form_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: MembershipRole;
  created_at: string;
}

export interface Answer {
  question_id: string;
  value: string | string[];
}

export interface Submission {
  id: string;
  form_id: string;
  respondent_id: string | null;
  respondent_name: string;
  respondent_email: string;
  answers: Answer[];
  created_at: string;
}
