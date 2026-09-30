import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readRefreshToken, sanitizeAuthEnvelope } from "./envelope";

describe("sanitizeAuthEnvelope", () => {
  it("remove o access token antes de chegar ao navegador", () => {
    const sanitized = sanitizeAuthEnvelope({
      status: 200,
      message: "Login realizado.",
      errors: {},
      auth: { access_token: "segredo", token_type: "bearer", expires_in: 900 },
      error_code: null,
    }) as { auth: Record<string, unknown> };

    assert.equal("access_token" in sanitized.auth, false);
    assert.equal(sanitized.auth.authenticated, true);
    assert.equal(sanitized.auth.expires_in, 900);
  });
});

describe("readRefreshToken", () => {
  it("lê o cookie de renovação", () => {
    const token = readRefreshToken(["refresh_token=abc%2B123; HttpOnly; Path=/api/v1/auth"]);
    assert.equal(token, "abc+123");
  });
});
