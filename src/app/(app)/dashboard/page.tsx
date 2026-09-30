import { DashboardHome } from "@/components/dashboard/home";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Início" };

export default function DashboardPage() {
  return <DashboardHome />;
}
