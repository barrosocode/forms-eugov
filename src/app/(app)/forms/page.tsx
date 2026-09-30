import { FormList } from "@/components/forms/form-list";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Formulários" };

export default function FormsPage() {
  return <FormList />;
}
