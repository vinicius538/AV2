import type { FastifyReply, FastifyRequest } from "fastify";
import { exigirUsuarioAutenticado } from "../auth/autenticacao";
import { movimentacaoService } from "../services/movimentacao.service";
import { responderErroDeVersao } from "./versao-error.controller";

type Params = { equipamentoId: string };
type Body = { origem: string; destino: string; observacao?: string };

export async function listarMovimentacoes(
  request: FastifyRequest<{ Params: Params }>,
  reply: FastifyReply,
) {
  try {
    const movimentacoes = await movimentacaoService.listarPorEquipamento(request.params.equipamentoId);
    return reply.send(movimentacoes);
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}

export async function criarMovimentacao(
  request: FastifyRequest<{ Params: Params; Body: Body }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  try {
    const movimentacao = await movimentacaoService.criar(
      request.params.equipamentoId,
      request.body,
      ator.usuario,
      ator.id,
    );
    return reply.code(201).send(movimentacao);
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}
