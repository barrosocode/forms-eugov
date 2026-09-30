import { UserForm } from "@/components/users/user-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar usuário" };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserForm userId={id} />;
}
