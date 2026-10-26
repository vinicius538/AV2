import type { FastifyReply } from "fastify";
import { RegistroNaoEncontradoError, ConflitoVersaoError } from "../services/versao.errors";
import { CnpjJaCadastradoError } from "../services/organizacao.service";
import { JournalPermissaoError, JournalResponsavelInvalidoError } from "../services/journal.service";
import { RegraDeNegocioError } from "../services/regras-de-negocio";
import { Prisma } from "../generated/prisma/client";

export function responderErroDeVersao(error: unknown, reply: FastifyReply) {
  if (error instanceof RegistroNaoEncontradoError) {
    return reply.code(404).send({ mensagem: error.message });
  }
  if (error instanceof ConflitoVersaoError) {
    return reply.code(409).send({ mensagem: error.message, codigo: "CONFLITO_VERSAO" });
  }
  if (error instanceof JournalResponsavelInvalidoError) {
    return reply.code(401).send({ mensagem: error.message });
  }
  if (error instanceof JournalPermissaoError) {
    return reply.code(403).send({ mensagem: error.message });
  }
  if (error instanceof CnpjJaCadastradoError) {
    return reply.code(409).send({ mensagem: error.message });
  }
  if (error instanceof RegraDeNegocioError) {
    return reply.code(422).send({ mensagem: error.message, codigo: error.codigo });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return reply.code(409).send({ mensagem: "Já existe um registro com esses dados únicos.", codigo: "REGISTRO_DUPLICADO" });
  }
  return null;
}


