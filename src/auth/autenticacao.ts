import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import { usuarioService } from "../services/usuario.service";

async function verificarToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ mensagem: "Token ausente, inválido ou expirado." });
  }

  const usuario = await usuarioService.validarSessao(request.user.sub);
  if (!usuario) {
    return reply.code(401).send({ mensagem: "A sessão expirou por inatividade ou a conta está inativa." });
  }
  request.authenticatedUser = usuario;
  const tokenRenovado = await reply.jwtSign({ sub: usuario.id });
  reply.header("x-renewed-token", tokenRenovado);
}

export const autenticar: preHandlerHookHandler = async (request, reply) => {
  await verificarToken(request, reply);
};

export function autorizarPapeis(
  ...papeis: Array<"ADMINISTRADOR" | "OPERADOR_CADASTRO" | "GESTOR_ALMOXARIFADO" | "AUDITOR">
): preHandlerHookHandler {
  return async (request, reply) => {
    await verificarToken(request, reply);
    if (reply.sent) return;

    if (!request.authenticatedUser || !papeis.includes(request.authenticatedUser.papel)) {
      return reply.code(403).send({ mensagem: "Seu papel não permite esta operação." });
    }
  };
}

export const autenticarOpcional: preHandlerHookHandler = async (request, reply) => {
  const authorization = request.headers.authorization;
  if (!authorization) return;
  await verificarToken(request, reply);
};

export function exigirUsuarioAutenticado(request: FastifyRequest, reply: FastifyReply) {
  if (!request.authenticatedUser) {
    reply.code(401).send({ mensagem: "Autenticação necessária." });
    return null;
  }
  return request.authenticatedUser;
}
