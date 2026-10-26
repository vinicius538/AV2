import type { FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "../generated/prisma/client";
import { organizacaoService, CnpjJaCadastradoError } from "../services/organizacao.service";
import { organizacaoVersionadaService } from "../services/organizacao-versionada.service";
import { organizacaoRepository } from "../repositories/organizacao.repository";
import { responderErroDeVersao } from "./versao-error.controller";
import { exigirUsuarioAutenticado } from "../auth/autenticacao";

type CriarOrganizacaoBody = {
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual?: string;
  enderecoCompleto: string;
  telefone: string;
  email: string;
};
type AtualizarOrganizacaoBody = Omit<Partial<CriarOrganizacaoBody>, "inscricaoEstadual"> & {
  inscricaoEstadual?: string | null;
  versao: number;
  ativo?: boolean;
};
type IdParams = { id: string };
type VersaoQuery = { versao: number };

export async function listarOrganizacoes(_request: FastifyRequest, reply: FastifyReply) {
  const organizacoes = await organizacaoService.listar();
  return reply.send(organizacoes);
}

export async function criarOrganizacao(
  request: FastifyRequest<{ Body: CriarOrganizacaoBody }>,
  reply: FastifyReply,
) {
  try {
    const ator = exigirUsuarioAutenticado(request, reply);
    if (!ator) return;
    const organizacao = await organizacaoService.criar(request.body, ator.id);
    return reply.code(201).send(organizacao);
  } catch (error) {
    if (error instanceof CnpjJaCadastradoError) {
      return reply.code(409).send({ mensagem: error.message });
    }
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
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
    const ator = exigirUsuarioAutenticado(request, reply);
    if (!ator) return;
    const organizacao = await organizacaoVersionadaService.atualizar(request.params.id, versao, dados, ator.id);
    return reply.send(organizacao);
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}

export async function excluirOrganizacao(
  request: FastifyRequest<{ Params: IdParams; Querystring: VersaoQuery }>,
  reply: FastifyReply,
) {
  try {
    const ator = exigirUsuarioAutenticado(request, reply);
    if (!ator) return;
    await organizacaoVersionadaService.excluir(request.params.id, request.query.versao, ator.id);
    return reply.code(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return reply.code(409).send({
        mensagem: "A organização não pode ser excluída porque possui contratos ou lotes vinculados.",
      });
    }
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}

