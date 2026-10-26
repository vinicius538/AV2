import assert from "node:assert/strict";
import test from "node:test";
import {
  exigirTriagemParaDesmonte,
  exigeJustificativaDeEstado,
  normalizarEValidarCnpj,
  RegraDeNegocioError,
  validarDataEntradaLote,
  validarPeriodoContrato,
} from "./regras-de-negocio";

test("normaliza e valida CNPJ numérico formatado", () => {
  assert.equal(normalizarEValidarCnpj("04.252.011/0001-10"), "04252011000110");
});

test("normaliza e valida CNPJ alfanumérico", () => {
  assert.equal(normalizarEValidarCnpj("00.000.000/E08G-12"), "00000000E08G12");
});

test("rejeita CNPJ com dígitos verificadores inválidos", () => {
  assert.throws(
    () => normalizarEValidarCnpj("04.252.011/0001-11"),
    (erro: unknown) => erro instanceof RegraDeNegocioError && erro.codigo === "CNPJ_INVALIDO",
  );
});

test("rejeita CNPJ repetido ou em formato inválido", () => {
  assert.throws(() => normalizarEValidarCnpj("11.111.111/1111-11"), RegraDeNegocioError);
  assert.throws(() => normalizarEValidarCnpj("04.252.011/0001-1A"), RegraDeNegocioError);
});

test("aceita lote dentro da janela de 90 dias", () => {
  validarDataEntradaLote(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
});

test("rejeita lote com data futura ou anterior a 90 dias", () => {
  assert.throws(() => validarDataEntradaLote(new Date(Date.now() + 60_000)), RegraDeNegocioError);
  assert.throws(() => validarDataEntradaLote(new Date(Date.now() - 91 * 24 * 60 * 60 * 1000)), RegraDeNegocioError);
  assert.throws(() => validarDataEntradaLote(new Date(Number.NaN)), RegraDeNegocioError);
});

test("exige triagem concluída antes do desmonte", () => {
  assert.throws(
    () => exigirTriagemParaDesmonte("EM_DESMONTE", false),
    (erro: unknown) => erro instanceof RegraDeNegocioError && erro.codigo === "TRIAGEM_INCOMPLETA",
  );
  assert.doesNotThrow(() => exigirTriagemParaDesmonte("EM_DESMONTE", true));
  assert.doesNotThrow(() => exigirTriagemParaDesmonte("EM_TRIAGEM", false));
});

test("exige justificativa para queda de duas ou mais categorias físicas", () => {
  assert.throws(
    () => exigeJustificativaDeEstado("NOVO", "REGULAR"),
    (erro: unknown) => erro instanceof RegraDeNegocioError && erro.codigo === "JUSTIFICATIVA_ESTADO_OBRIGATORIA",
  );
  assert.equal(exigeJustificativaDeEstado("NOVO", "REGULAR", "Dano identificado na triagem"), true);
  assert.equal(exigeJustificativaDeEstado("NOVO", "BOM"), false);
});

test("rejeita justificativa vazia ou em branco quando ela é obrigatória", () => {
  assert.throws(() => exigeJustificativaDeEstado("BOM", "INSERVIVEL", "   "), RegraDeNegocioError);
});

test("valida datas de assinatura e vencimento de contrato", () => {
  const assinatura = new Date("2026-01-01T12:00:00.000Z");
  const vencimento = new Date("2027-01-01T12:00:00.000Z");
  assert.doesNotThrow(() => validarPeriodoContrato(assinatura, vencimento));
  assert.doesNotThrow(() => validarPeriodoContrato(assinatura, assinatura));
  assert.throws(
    () => validarPeriodoContrato(vencimento, assinatura),
    (erro: unknown) => erro instanceof RegraDeNegocioError && erro.codigo === "PERIODO_CONTRATO_INVALIDO",
  );
  assert.throws(() => validarPeriodoContrato(new Date(Number.NaN), vencimento), RegraDeNegocioError);
});
