import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canEditForm, hasPermission } from "./permissions";

describe("hasPermission", () => {
  it("aceita o curinga de administrador", () => {
    assert.equal(hasPermission(["*"], "forms:delete"), true);
  });

  it("aceita a permissão exata", () => {
    assert.equal(hasPermission(["forms:list"], "forms:list"), true);
    assert.equal(hasPermission(["forms:list"], "forms:delete"), false);
  });

  it("nega lista vazia", () => {
    assert.equal(hasPermission(undefined, "forms:list"), false);
    assert.equal(hasPermission([], "forms:list"), false);
  });
});

describe("canEditForm", () => {
  it("permite o responsável e o administrador", () => {
    assert.equal(canEditForm("owner", []), true);
    assert.equal(canEditForm(null, ["*"]), true);
    assert.equal(canEditForm("member", ["forms:update"]), false);
  });
});
