import { UserForm } from "@/components/users/user-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo usuário" };

export default function NewUserPage() {
  return <UserForm />;
}
