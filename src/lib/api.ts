import { asEnvelope } from "@/lib/envelope";
import { failureEnvelope, type Envelope } from "@/types/envelope";

interface RequestOptions {
  method?: string;
  body?: unknown;
  redirectOnUnauthorized?: boolean;
}

export async function apiRequest(path: string, options: RequestOptions = {}): Promise<Envelope> {
  const headers = new Headers();
  let body: string | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`/api/backend${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    return failureEnvelope(503, "Não foi possível falar com o servidor.", "HTTP_503");
  }

  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  const envelope = asEnvelope(parsed, response.status);

  if (
    response.status === 401 &&
    options.redirectOnUnauthorized !== false &&
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/signin")
  ) {
    const next = `${window.location.pathname}${window.location.search}`;
    window.dispatchEvent(new CustomEvent("auth:unauthorized", { detail: next }));
  }

  return envelope;
}

export function isSuccess(envelope: Envelope): boolean {
  return envelope.status >= 200 && envelope.status < 300;
}
