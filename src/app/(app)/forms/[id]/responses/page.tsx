import { ResponseList } from "@/components/forms/response-views";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Respostas" };

export default async function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResponseList formId={id} />;
}
