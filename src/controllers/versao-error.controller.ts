import type { FastifyReply } from "fastify";
import { RegistroNaoEncontradoError, ConflitoVersaoError } from "../services/versao.errors";
import { CnpjJaCadastradoError } from "../services/organizacao.service";

export function responderErroDeVersao(error: unknown, reply: FastifyReply) {
  if (error instanceof RegistroNaoEncontradoError) {
    return reply.code(404).send({ mensagem: error.message });
  }
  if (error instanceof ConflitoVersaoError) {
    return reply.code(409).send({ mensagem: error.message, codigo: "CONFLITO_VERSAO" });
  }
  if (error instanceof CnpjJaCadastradoError) {
    return reply.code(409).send({ mensagem: error.message });
  }
  return null;
}
