import type { Envelope } from "@/types/envelope";

export function sanitizeAuthEnvelope(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const record = body as Record<string, unknown>;
  const auth = record.auth;
  if (!auth || typeof auth !== "object" || !("access_token" in auth)) return body;
  const authRecord = auth as Record<string, unknown>;
  return {
    ...record,
    auth: {
      token_type: authRecord.token_type ?? "bearer",
      expires_in: authRecord.expires_in ?? 900,
      authenticated: true,
    },
  };
}

export function readRefreshToken(setCookieLines: readonly string[]): string | null {
  for (const line of setCookieLines) {
    const [pair] = line.split(";");
    if (!pair) continue;
    const index = pair.indexOf("=");
    if (index === -1) continue;
    if (pair.slice(0, index).trim() !== "refresh_token") continue;
    return decodeURIComponent(pair.slice(index + 1).trim());
  }
  return null;
}

export function asEnvelope(body: unknown, status: number): Envelope {
  if (!body || typeof body !== "object") {
    return {
      status: status || 502,
      message: "A API de formulários está indisponível.",
      errors: {},
      resource: null,
      pagination: null,
      error_code: "HTTP_502",
    };
  }
  const record = body as Partial<Envelope>;
  return {
    ...record,
    status: typeof record.status === "number" ? record.status : status,
    message: typeof record.message === "string" ? record.message : "Não foi possível concluir a operação.",
    errors: record.errors && typeof record.errors === "object" ? record.errors : {},
    pagination: record.pagination ?? null,
    error_code: record.error_code ?? null,
  };
}
