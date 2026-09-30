import { RoleForm } from "@/components/roles/role-manager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo papel" };

export default function NewRolePage() {
  return <RoleForm />;
}
