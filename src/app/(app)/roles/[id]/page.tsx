import { RoleForm } from "@/components/roles/role-manager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar papel" };

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoleForm roleId={id} />;
}
