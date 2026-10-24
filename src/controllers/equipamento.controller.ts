import type { FastifyReply, FastifyRequest } from "fastify";
import { equipamentoRepository } from "../repositories/equipamento.repository";
import { equipamentoService } from "../services/equipamento.service";
import { responderErroDeVersao } from "./versao-error.controller";

type Params = { id: string };
type Body = {
  versao: number;
  estadoFisico?: "NOVO" | "BOM" | "REGULAR" | "RUIM" | "INSERVIVEL";
  statusRastreamento?: "RECEBIDO" | "EM_TRIAGEM" | "DISPONIVEL" | "EM_DESMONTE" | "DESCARTADO";
  triagemCompleta?: boolean;
  etiqueta?: string;
  pesoQuilogramas?: number;
  precoMercado?: number;
};

export async function buscarEquipamento(
  request: FastifyRequest<{ Params: Params }>,
  reply: FastifyReply,
) {
  const equipamento = await equipamentoRepository.buscarPorId(request.params.id);
  if (!equipamento) return reply.code(404).send({ mensagem: "Equipamento não encontrado." });
  return reply.send(equipamento);
}

export async function atualizarEquipamento(
  request: FastifyRequest<{ Params: Params; Body: Body }>,
  reply: FastifyReply,
) {
  const { versao, ...dados } = request.body;
  try {
    const equipamento = await equipamentoService.atualizar(request.params.id, versao, dados);
    return reply.send(equipamento);
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}
