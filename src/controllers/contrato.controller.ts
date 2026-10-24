import type { FastifyReply, FastifyRequest } from "fastify";
import { contratoRepository } from "../repositories/contrato.repository";
import { contratoService } from "../services/contrato.service";
import { responderErroDeVersao } from "./versao-error.controller";

type Params = { id: string };
type Body = {
  versao: number;
  dataAssinatura?: string;
  dataVencimento?: string;
  clausulas?: object;
  valorMensal?: number;
  renovacaoAutomatica?: boolean;
};

export async function buscarContrato(request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) {
  const contrato = await contratoRepository.buscarPorId(request.params.id);
  if (!contrato) return reply.code(404).send({ mensagem: "Contrato não encontrado." });
  return reply.send(contrato);
}

export async function atualizarContrato(
  request: FastifyRequest<{ Params: Params; Body: Body }>,
  reply: FastifyReply,
) {
  const { versao, dataAssinatura, dataVencimento, ...dados } = request.body;
  try {
    const contrato = await contratoService.atualizar(request.params.id, versao, {
      ...dados,
      ...(dataAssinatura ? { dataAssinatura: new Date(dataAssinatura) } : {}),
      ...(dataVencimento ? { dataVencimento: new Date(dataVencimento) } : {}),
    });
    return reply.send(contrato);
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}
