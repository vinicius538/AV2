import type { FastifyReply, FastifyRequest } from "fastify";
import { contratoRepository } from "../repositories/contrato.repository";
import { contratoService } from "../services/contrato.service";
import { responderErroDeVersao } from "./versao-error.controller";
import { exigirUsuarioAutenticado } from "../auth/autenticacao";

type Params = { id: string };
type CriarParams = { organizacaoId: string };
type VersaoQuery = { versao: number };
type CriarBody = {
  dataAssinatura: string;
  dataVencimento: string;
  clausulas: object;
  valorMensal: number;
  renovacaoAutomatica?: boolean;
};
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

export async function listarContratos(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await contratoService.listar());
}

export async function criarContrato(
  request: FastifyRequest<{ Params: CriarParams; Body: CriarBody }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  try {
    const contrato = await contratoService.criar(request.params.organizacaoId, {
      ...request.body,
      dataAssinatura: new Date(request.body.dataAssinatura),
      dataVencimento: new Date(request.body.dataVencimento),
    }, ator.id);
    return reply.code(201).send(contrato);
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}

export async function atualizarContrato(
  request: FastifyRequest<{ Params: Params; Body: Body }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  const { versao, dataAssinatura, dataVencimento, ...dados } = request.body;
  try {
    const contrato = await contratoService.atualizar(request.params.id, versao, {
      ...dados,
      ...(dataAssinatura ? { dataAssinatura: new Date(dataAssinatura) } : {}),
      ...(dataVencimento ? { dataVencimento: new Date(dataVencimento) } : {}),
    }, ator.id);
    return reply.send(contrato);
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}

export async function excluirContrato(
  request: FastifyRequest<{ Params: Params; Querystring: VersaoQuery }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  try {
    await contratoService.excluir(request.params.id, request.query.versao, ator.id);
    return reply.code(204).send();
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}



