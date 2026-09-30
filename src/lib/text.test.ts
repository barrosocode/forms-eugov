import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maskCpf, maskPhone, safeNextPath, textFilter } from "./text";

describe("máscaras", () => {
  it("formata telefone e cpf sem guardar letras", () => {
    assert.equal(maskPhone("11987654321"), "(11) 98765-4321");
    assert.equal(maskCpf("52998224725"), "529.982.247-25");
  });
});

describe("textFilter", () => {
  it("só envia o filtro a partir do segundo caractere", () => {
    assert.equal(textFilter("a"), undefined);
    assert.equal(textFilter("  "), undefined);
    assert.equal(textFilter("clima"), "clima");
  });
});

describe("safeNextPath", () => {
  it("rejeita caminhos externos", () => {
    assert.equal(safeNextPath("https://evil.example"), "/dashboard");
    assert.equal(safeNextPath("//evil.example"), "/dashboard");
    assert.equal(safeNextPath("/f/abc"), "/f/abc");
  });
});
