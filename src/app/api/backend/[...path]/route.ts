import { authorizedUpstream } from "@/server/upstream";
import { failureEnvelope } from "@/types/envelope";
import type { NextRequest } from "next/server";

const BLOCKED = new Set(["auth/login", "auth/refresh", "auth/logout"]);

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (path.some((segment) => segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\"))) {
    return Response.json(failureEnvelope(400, "Caminho inválido.", "VALIDATION_ERROR"), { status: 400 });
  }
  const joined = path.join("/");
  if (BLOCKED.has(joined)) {
    return Response.json(failureEnvelope(404, "Rota não disponível neste canal.", "HTTP_404"), { status: 404 });
  }

  const method = request.method.toUpperCase();
  const init: RequestInit = { method };
  if (method !== "GET" && method !== "HEAD") {
    const text = await request.text();
    if (text) {
      init.body = text;
      init.headers = { "Content-Type": request.headers.get("content-type") ?? "application/json" };
    }
  }
  const envelope = await authorizedUpstream(`/${joined}${request.nextUrl.search}`, init);
  return Response.json(envelope, { status: envelope.status || 500 });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
