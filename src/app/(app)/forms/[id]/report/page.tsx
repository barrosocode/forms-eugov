import { FormReport } from "@/components/forms/form-report";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Relatório" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FormReport formId={id} />;
}
