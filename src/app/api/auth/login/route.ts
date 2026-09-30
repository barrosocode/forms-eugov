import { failureEnvelope } from "@/types/envelope";
import { loginUpstream } from "@/server/upstream";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(failureEnvelope(422, "Erro de validação.", "VALIDATION_ERROR"), { status: 422 });
  }
  if (!payload || typeof payload !== "object") {
    return Response.json(failureEnvelope(422, "Erro de validação.", "VALIDATION_ERROR"), { status: 422 });
  }
  const envelope = await loginUpstream(payload);
  return Response.json(envelope, { status: envelope.status || 500 });
}
