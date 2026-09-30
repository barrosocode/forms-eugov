import { FormCreate } from "@/components/forms/form-create";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo formulário" };

export default function NewFormPage() {
  return <FormCreate />;
}
