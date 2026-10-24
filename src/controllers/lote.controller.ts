import type { FastifyReply, FastifyRequest } from "fastify";
import { loteRepository } from "../repositories/lote.repository";
import { loteService } from "../services/lote.service";
import { responderErroDeVersao } from "./versao-error.controller";

type Params = { id: string };
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

export async function atualizarLote(
  request: FastifyRequest<{ Params: Params; Body: Body }>,
  reply: FastifyReply,
) {
  const { versao, dataEntrada, ...dados } = request.body;
  try {
    const lote = await loteService.atualizar(request.params.id, versao, {
      ...dados,
      ...(dataEntrada ? { dataEntrada: new Date(dataEntrada) } : {}),
    });
    return reply.send(lote);
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}
