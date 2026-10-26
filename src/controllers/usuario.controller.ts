import type { FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "../generated/prisma/client";
import { usuarioService, UsuarioDuplicadoError } from "../services/usuario.service";
import { responderErroDeVersao } from "./versao-error.controller";
import { exigirUsuarioAutenticado } from "../auth/autenticacao";

type UsuarioBody = {
  usuario: string;
  senha: string;
  papel: "ADMINISTRADOR" | "OPERADOR_CADASTRO" | "GESTOR_ALMOXARIFADO" | "AUDITOR";
};
type UsuarioParams = { id: string };
type AtualizarUsuarioBody = {
  versao: number;
  usuario?: string;
  senha?: string;
  papel?: "ADMINISTRADOR" | "OPERADOR_CADASTRO" | "GESTOR_ALMOXARIFADO" | "AUDITOR";
};

export async function listarUsuarios(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await usuarioService.listar());
}

export async function buscarUsuario(
  request: FastifyRequest<{ Params: UsuarioParams }>,
  reply: FastifyReply,
) {
  const usuario = await usuarioService.buscarPorId(request.params.id);
  if (!usuario) return reply.code(404).send({ mensagem: "Usuário não encontrado." });
  return reply.send(usuario);
}

export async function criarUsuario(
  request: FastifyRequest<{ Body: UsuarioBody }>,
  reply: FastifyReply,
) {
  try {
    const quantidadeAtiva = await usuarioService.contarAtivos();
    const ator = request.authenticatedUser;

    if (quantidadeAtiva === 0) {
      if (request.body.papel !== "ADMINISTRADOR") {
        return reply.code(400).send({ mensagem: "A primeira conta precisa ser ADMINISTRADOR." });
      }
      return reply.code(201).send(await usuarioService.criar(request.body));
    }

    if (!ator) return reply.code(401).send({ mensagem: "Entre como administrador para criar usuários." });
    if (ator.papel !== "ADMINISTRADOR") {
      return reply.code(403).send({ mensagem: "Somente administradores podem criar usuários." });
    }

    return reply.code(201).send(await usuarioService.criar(request.body, ator.id));
  } catch (error) {
    if (error instanceof UsuarioDuplicadoError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      return reply.code(409).send({ mensagem: "Já existe um usuário com esse nome." });
    }
    throw error;
  }
}

export async function atualizarUsuario(
  request: FastifyRequest<{ Params: UsuarioParams; Body: AtualizarUsuarioBody }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  const { versao, ...dados } = request.body;
  try {
    return reply.send(await usuarioService.atualizar(request.params.id, versao, dados, ator.id));
  } catch (error) {
    if (error instanceof UsuarioDuplicadoError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      return reply.code(409).send({ mensagem: "Já existe um usuário com esse nome." });
    }
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}

export async function excluirUsuario(
  request: FastifyRequest<{ Params: UsuarioParams; Querystring: { versao: number } }>,
  reply: FastifyReply,
) {
  const ator = exigirUsuarioAutenticado(request, reply);
  if (!ator) return;
  try {
    await usuarioService.excluir(request.params.id, request.query.versao, ator.id);
    return reply.code(204).send();
  } catch (error) {
    const respostaErro = responderErroDeVersao(error, reply);
    if (respostaErro) return respostaErro;
    throw error;
  }
}
