import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectAnswers, displayAnswer } from "./answers";
import type { Question } from "../types/domain";

const questions: Question[] = [
  { id: "q-short", title: "Dia", type: "short", required: true, order: 0 },
  {
    id: "q-box",
    title: "Temas",
    type: "checkbox",
    required: false,
    order: 1,
    options: [
      { id: "opt-a", value: "Clima", order: 0 },
      { id: "opt-b", value: "Rotina", order: 1 },
    ],
  },
];

describe("collectAnswers", () => {
  it("exige pergunta obrigatória e omite opcional vazia", () => {
    const result = collectAnswers(questions, { "q-short": "  ", "q-box": [] });
    assert.ok("errors" in result);
    if ("errors" in result) {
      assert.equal(result.errors["q-short"]?.[0], "Esta pergunta é obrigatória.");
    }
  });

  it("monta texto e lista de opções", () => {
    const result = collectAnswers(questions, { "q-short": "Bom", "q-box": ["opt-a"] });
    assert.ok("answers" in result);
    if ("answers" in result) {
      assert.deepEqual(result.answers, [
        { question_id: "q-short", value: "Bom" },
        { question_id: "q-box", value: ["opt-a"] },
      ]);
    }
  });
});

describe("displayAnswer", () => {
  it("troca o identificador da opção pelo texto", () => {
    assert.equal(displayAnswer(questions[1], ["opt-b"]), "Rotina");
    assert.equal(displayAnswer(undefined, "segredo"), "Pergunta removida");
  });
});
