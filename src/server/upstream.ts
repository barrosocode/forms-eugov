import { asEnvelope, readRefreshToken, sanitizeAuthEnvelope } from "@/lib/envelope";
import { failureEnvelope, type Envelope } from "@/types/envelope";
import { cookies } from "next/headers";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const ACCESS_MAX_AGE = 60 * 15;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

function apiOrigin(): string {
  return process.env.API_URL ?? "http://localhost:8000";
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

export async function writeSession(accessToken: string, refreshToken: string | null, expiresIn?: number): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, accessToken, cookieOptions(expiresIn && expiresIn > 0 ? expiresIn : ACCESS_MAX_AGE));
  if (refreshToken) jar.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

async function callUpstream(path: string, init: RequestInit, accessToken?: string | null): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(`${apiOrigin()}/api/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

async function renew(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | null> {
  const response = await callUpstream("/auth/refresh", {
    method: "POST",
    headers: { Cookie: `refresh_token=${refreshToken}` },
  }, refreshToken);
  if (!response.ok) return null;
  let body: Envelope;
  try {
    body = asEnvelope(await response.json(), response.status);
  } catch {
    return null;
  }
  const accessToken = body.auth?.access_token;
  if (!accessToken) return null;
  const rotated = readRefreshToken(response.headers.getSetCookie?.() ?? []) ?? refreshToken;
  return { accessToken, refreshToken: rotated, expiresIn: Number(body.auth?.expires_in) || ACCESS_MAX_AGE };
}

export async function authorizedUpstream(path: string, init: RequestInit = {}): Promise<Envelope> {
  const jar = await cookies();
  let accessToken = jar.get(ACCESS_COOKIE)?.value ?? null;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value ?? null;

  try {
    if (!accessToken && refreshToken) {
      const renewed = await renew(refreshToken);
      if (renewed) {
        accessToken = renewed.accessToken;
        await writeSession(renewed.accessToken, renewed.refreshToken, renewed.expiresIn);
      }
    }

    let response = await callUpstream(path, init, accessToken);
    if (response.status === 401 && refreshToken) {
      const renewed = await renew(refreshToken);
      if (renewed) {
        await writeSession(renewed.accessToken, renewed.refreshToken, renewed.expiresIn);
        response = await callUpstream(path, init, renewed.accessToken);
      } else {
        await clearSession();
      }
    }

    const text = await response.text();
    if (!text) return failureEnvelope(response.status || 502, "A API de formulários está indisponível.", "HTTP_502");
    return asEnvelope(JSON.parse(text) as unknown, response.status);
  } catch {
    return failureEnvelope(503, "A API de formulários está indisponível.", "HTTP_503");
  }
}

export async function loginUpstream(payload: unknown): Promise<Envelope> {
  try {
    const response = await callUpstream("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    const body = text ? asEnvelope(JSON.parse(text) as unknown, response.status) : failureEnvelope(502, "A API de formulários está indisponível.", "HTTP_502");
    if (response.ok && body.auth?.access_token) {
      const refreshToken = readRefreshToken(response.headers.getSetCookie?.() ?? []);
      await writeSession(body.auth.access_token, refreshToken, Number(body.auth.expires_in) || ACCESS_MAX_AGE);
    }
    return asEnvelope(sanitizeAuthEnvelope(body), response.status);
  } catch {
    return failureEnvelope(503, "A API de formulários está indisponível.", "HTTP_503");
  }
}
