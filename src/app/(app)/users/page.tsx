import { UserList } from "@/components/users/user-list";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Usuários" };

export default function UsersPage() {
  return <UserList />;
}
