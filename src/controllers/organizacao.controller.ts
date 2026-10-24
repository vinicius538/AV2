import type { FastifyReply, FastifyRequest } from "fastify";
import { organizacaoService, CnpjJaCadastradoError } from "../services/organizacao.service";
import { organizacaoVersionadaService } from "../services/organizacao-versionada.service";
import { organizacaoRepository } from "../repositories/organizacao.repository";
import { responderErroDeVersao } from "./versao-error.controller";

type CriarOrganizacaoBody = {
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual?: string;
  enderecoCompleto: string;
  telefone: string;
  email: string;
};
type AtualizarOrganizacaoBody = Partial<CriarOrganizacaoBody> & {
  versao: number;
  ativo?: boolean;
};
type IdParams = { id: string };

export async function criarOrganizacao(
  request: FastifyRequest<{ Body: CriarOrganizacaoBody }>,
  reply: FastifyReply,
) {
  try {
    const organizacao = await organizacaoService.criar(request.body);
    return reply.code(201).send(organizacao);
  } catch (error) {
    if (error instanceof CnpjJaCadastradoError) {
      return reply.code(409).send({ mensagem: error.message });
    }
    throw error;
  }
}

export async function buscarOrganizacao(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply,
) {
  const organizacao = await organizacaoRepository.buscarPorId(request.params.id);
  if (!organizacao) return reply.code(404).send({ mensagem: "Organização não encontrada." });
  return reply.send(organizacao);
}

export async function atualizarOrganizacao(
  request: FastifyRequest<{ Params: IdParams; Body: AtualizarOrganizacaoBody }>,
  reply: FastifyReply,
) {
  const { versao, ...dados } = request.body;
  try {
    const organizacao = await organizacaoVersionadaService.atualizar(request.params.id, versao, dados);
    return reply.send(organizacao);
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}


