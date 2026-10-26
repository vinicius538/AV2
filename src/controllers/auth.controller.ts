import type { FastifyReply, FastifyRequest } from "fastify";
import { usuarioService } from "../services/usuario.service";

export async function login(
  request: FastifyRequest<{ Body: { usuario: string; senha: string } }>,
  reply: FastifyReply,
) {
  const usuario = await usuarioService.autenticar(request.body.usuario, request.body.senha);
  if (!usuario) {
    return reply.code(401).send({ mensagem: "Usuário ou senha inválidos." });
  }

  const accessToken = await reply.jwtSign({ sub: usuario.id });
  return reply.send({ accessToken, tokenType: "Bearer", expiresIn: "30m", usuario });
}
