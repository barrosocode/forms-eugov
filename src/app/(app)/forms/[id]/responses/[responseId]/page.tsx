import { ResponseDetail } from "@/components/forms/response-views";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resposta" };

export default async function ResponsePage({ params }: { params: Promise<{ id: string; responseId: string }> }) {
  const { id, responseId } = await params;
  return <ResponseDetail formId={id} responseId={responseId} />;
}
