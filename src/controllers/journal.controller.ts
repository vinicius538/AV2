import type { FastifyReply, FastifyRequest } from "fastify";
import { journalService } from "../services/journal.service";
import { exigirUsuarioAutenticado } from "../auth/autenticacao";
import { responderErroDeVersao } from "./versao-error.controller";

type JournalQuery = {
  entidade?: string;
  operacao?: string;
  usuarioResponsavel?: string;
  limite?: number;
};

export async function listarJournal(
  request: FastifyRequest<{ Querystring: JournalQuery }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  try {
    const registros = await journalService.listar(ator.id, request.query);
    return reply.send(registros);
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}
