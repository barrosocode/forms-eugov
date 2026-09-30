import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { firstInvalidField } from "./focus-error";

describe("firstInvalidField", () => {
  it("segue a ordem visual da tela", () => {
    const name = firstInvalidField(["title", "email", "password"], {
      password: ["Curta"],
      email: ["Inválido"],
    });
    assert.equal(name, "email");
  });
});
