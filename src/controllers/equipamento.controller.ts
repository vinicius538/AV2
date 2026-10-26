import type { FastifyReply, FastifyRequest } from "fastify";
import { equipamentoRepository } from "../repositories/equipamento.repository";
import { equipamentoService } from "../services/equipamento.service";
import { responderErroDeVersao } from "./versao-error.controller";
import { exigirUsuarioAutenticado } from "../auth/autenticacao";
import { Prisma } from "../generated/prisma/client";
import { CodigoBarrasDuplicadoError } from "../services/equipamento.service";

type Params = { id: string };
type CriarParams = { loteId: string };
type VersaoQuery = { versao: number };
type CriarBody = {
  codigoBarrasInterno: string;
  tipo: "COMPUTADOR" | "NOTEBOOK" | "MONITOR" | "OUTRO";
  marca: string;
  modelo: string;
  anoFabricacao: number;
  estadoFisico: "NOVO" | "BOM" | "REGULAR" | "RUIM" | "INSERVIVEL";
  statusRastreamento: "RECEBIDO" | "EM_TRIAGEM" | "DISPONIVEL" | "EM_DESMONTE" | "DESCARTADO";
  triagemCompleta?: boolean;
  etiqueta?: string;
  pesoQuilogramas: number;
  precoMercado: number;
};
type Body = {
  versao: number;
  codigoBarrasInterno?: string;
  tipo?: "COMPUTADOR" | "NOTEBOOK" | "MONITOR" | "OUTRO";
  marca?: string;
  modelo?: string;
  anoFabricacao?: number;
  estadoFisico?: "NOVO" | "BOM" | "REGULAR" | "RUIM" | "INSERVIVEL";
  statusRastreamento?: "RECEBIDO" | "EM_TRIAGEM" | "DISPONIVEL" | "EM_DESMONTE" | "DESCARTADO";
  triagemCompleta?: boolean;
  etiqueta?: string;
  pesoQuilogramas?: number;
  precoMercado?: number;
  justificativa?: string;
};

export async function buscarEquipamento(
  request: FastifyRequest<{ Params: Params }>,
  reply: FastifyReply,
) {
  const equipamento = await equipamentoRepository.buscarPorId(request.params.id);
  if (!equipamento) return reply.code(404).send({ mensagem: "Equipamento não encontrado." });
  return reply.send(equipamento);
}

export async function listarEquipamentos(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await equipamentoService.listar());
}

export async function criarEquipamento(
  request: FastifyRequest<{ Params: CriarParams; Body: CriarBody }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  try {
    const equipamento = await equipamentoService.criar(request.params.loteId, request.body, ator.id);
    return reply.code(201).send(equipamento);
  } catch (error) {
    if (error instanceof CodigoBarrasDuplicadoError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      return reply.code(409).send({ mensagem: "Já existe um equipamento com esse código de barras interno." });
    }
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}

export async function atualizarEquipamento(
  request: FastifyRequest<{ Params: Params; Body: Body }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  const { versao, ...dados } = request.body;
  try {
    const equipamento = await equipamentoService.atualizar(request.params.id, versao, dados, ator.id);
    return reply.send(equipamento);
  } catch (error) {
    if (error instanceof CodigoBarrasDuplicadoError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      return reply.code(409).send({ mensagem: "Já existe um equipamento com esse código de barras interno." });
    }
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}

export async function excluirEquipamento(
  request: FastifyRequest<{ Params: Params; Querystring: VersaoQuery }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  try {
    await equipamentoService.excluir(request.params.id, request.query.versao, ator.id);
    return reply.code(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return reply.code(409).send({ mensagem: "O equipamento não pode ser excluído porque possui movimentações no histórico." });
    }
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}

