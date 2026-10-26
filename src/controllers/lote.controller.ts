import type { FastifyReply, FastifyRequest } from "fastify";
import { loteRepository } from "../repositories/lote.repository";
import { loteService } from "../services/lote.service";
import { responderErroDeVersao } from "./versao-error.controller";
import { exigirUsuarioAutenticado } from "../auth/autenticacao";
import { Prisma } from "../generated/prisma/client";

type Params = { id: string };
type CriarParams = { organizacaoId: string };
type VersaoQuery = { versao: number };
type CriarBody = {
  dataEntrada: string;
  notaFiscal: string;
  transportadora: string;
  statusProcessamento?: "RECEBIDO" | "EM_TRIAGEM" | "TRIAGEM_CONCLUIDA";
  observacoes?: string;
};
type Body = {
  versao: number;
  dataEntrada?: string;
  notaFiscal?: string;
  transportadora?: string;
  statusProcessamento?: "RECEBIDO" | "EM_TRIAGEM" | "TRIAGEM_CONCLUIDA";
  observacoes?: string | null;
};

export async function buscarLote(request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) {
  const lote = await loteRepository.buscarPorId(request.params.id);
  if (!lote) return reply.code(404).send({ mensagem: "Lote não encontrado." });
  return reply.send(lote);
}

export async function listarLotes(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await loteService.listar());
}

export async function criarLote(
  request: FastifyRequest<{ Params: CriarParams; Body: CriarBody }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  try {
    const lote = await loteService.criar(request.params.organizacaoId, {
      ...request.body,
      dataEntrada: new Date(request.body.dataEntrada),
    }, ator.id);
    return reply.code(201).send(lote);
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}

export async function atualizarLote(
  request: FastifyRequest<{ Params: Params; Body: Body }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  const { versao, dataEntrada, ...dados } = request.body;
  try {
    const lote = await loteService.atualizar(request.params.id, versao, {
      ...dados,
      ...(dataEntrada ? { dataEntrada: new Date(dataEntrada) } : {}),
    }, ator.id);
    return reply.send(lote);
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}

export async function excluirLote(
  request: FastifyRequest<{ Params: Params; Querystring: VersaoQuery }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  try {
    await loteService.excluir(request.params.id, request.query.versao, ator.id);
    return reply.code(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return reply.code(409).send({ mensagem: "O lote não pode ser excluído porque possui equipamentos vinculados." });
    }
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}



