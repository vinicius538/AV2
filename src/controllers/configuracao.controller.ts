import type { FastifyReply, FastifyRequest } from "fastify";
import { exigirUsuarioAutenticado } from "../auth/autenticacao";
import { configuracaoService } from "../services/configuracao.service";
import { responderErroDeVersao } from "./versao-error.controller";

type Body = { versao: number; aliquotaImposto?: number; coeficienteDepreciacao?: number };

export async function buscarConfiguracao(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await configuracaoService.buscar());
}

export async function atualizarConfiguracao(request: FastifyRequest<{ Body: Body }>, reply: FastifyReply) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  const { versao, ...dados } = request.body;
  try {
    return reply.send(await configuracaoService.atualizar(versao, dados, ator.id));
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}
