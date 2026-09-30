import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { barWidth, chartColor, formatCount, formatPercent, optionTotal, pieSlices } from "./report";
import type { ReportOption } from "@/types/domain";

function option(partial: Partial<ReportOption> & Pick<ReportOption, "option_id" | "abs">): ReportOption {
  return {
    value: partial.value ?? partial.option_id,
    percent: partial.percent ?? 0,
    option_id: partial.option_id,
    abs: partial.abs,
  };
}

describe("formatPercent", () => {
  it("usa vírgula decimal e omite zeros à direita", () => {
    assert.equal(formatPercent(50), "50%");
    assert.equal(formatPercent(15.5), "15,5%");
    assert.equal(formatPercent(15), "15%");
  });
});

describe("formatCount", () => {
  it("singular só para uma resposta", () => {
    assert.equal(formatCount(0), "0 respostas");
    assert.equal(formatCount(1), "1 resposta");
    assert.equal(formatCount(8), "8 respostas");
  });
});

describe("chartColor", () => {
  it("repete a paleta quando as opções passam do tamanho", () => {
    assert.equal(chartColor(0), "#465fff");
    assert.equal(chartColor(10), "#465fff");
    assert.notEqual(chartColor(0), chartColor(1));
  });
});

describe("barWidth", () => {
  it("limita a barra entre 0 e 100", () => {
    assert.equal(barWidth(80), 80);
    assert.equal(barWidth(0), 0);
    assert.equal(barWidth(120), 100);
    assert.equal(barWidth(-4), 0);
    assert.equal(barWidth(Number.NaN), 0);
  });
});

describe("pieSlices", () => {
  it("não desenha fatias quando ninguém escolheu opção", () => {
    const options = [option({ option_id: "a", abs: 0 }), option({ option_id: "b", abs: 0 })];
    assert.equal(optionTotal(options), 0);
    assert.deepEqual(pieSlices(options), []);
  });

  it("divide duas opções iguais em semicírculos e ignora abs zero", () => {
    const slices = pieSlices([
      option({ option_id: "vazia", abs: 0, percent: 0 }),
      option({ option_id: "a", abs: 5, percent: 50, value: "Baixa" }),
      option({ option_id: "b", abs: 5, percent: 50, value: "Alta" }),
    ]);
    assert.equal(slices.length, 2);
    assert.equal(slices[0]?.color, chartColor(1));
    assert.equal(slices[0]?.showLabel, true);
    assert.match(slices[0]?.path ?? "", /A 78 78 0 0 1/);
    assert.equal(slices[1]?.optionId, "b");
  });

  it("fecha um círculo quando uma opção concentra todas as marcações", () => {
    const slices = pieSlices([option({ option_id: "unica", abs: 4, percent: 100, value: "Única" })]);
    assert.equal(slices.length, 1);
    assert.match(slices[0]?.path ?? "", /^M 22 100 A 78 78 0 1 1/);
    assert.equal(slices[0]?.showLabel, true);
  });
});
