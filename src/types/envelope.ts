import type { FormReport, FormSummary, Member, OptionItem, Question, Role, Section, Submission, User } from "@/types/domain";

export interface Pagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface Envelope {
  status: number;
  message: string;
  errors: Record<string, string[]>;
  pagination?: Pagination | null;
  error_code: string | null;
  resource?: null;
  auth?: {
    token_type?: string;
    expires_in?: number;
    authenticated?: boolean;
    logged_out?: boolean;
    access_token?: string;
  };
  user?: User;
  users?: User[];
  role?: Role;
  roles?: Role[];
  form?: FormSummary;
  forms?: FormSummary[];
  section?: Section;
  sections?: Section[];
  question?: Question;
  questions?: Question[];
  option?: OptionItem;
  options?: OptionItem[];
  member?: Member;
  members?: Member[];
  response?: Submission;
  responses?: Submission[];
  report?: FormReport;
}

export function failureEnvelope(status: number, message: string, errorCode: string): Envelope {
  return {
    status,
    message,
    errors: {},
    resource: null,
    pagination: null,
    error_code: errorCode,
  };
}
