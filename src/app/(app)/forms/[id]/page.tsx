import { FormBuilder } from "@/components/forms/form-builder";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Formulário" };

export default async function FormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FormBuilder formId={id} />;
}
