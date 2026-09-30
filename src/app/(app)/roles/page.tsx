import { RoleList } from "@/components/roles/role-manager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Papéis" };

export default function RolesPage() {
  return <RoleList />;
}
