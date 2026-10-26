import type { FastifyInstance } from "fastify";
import {
  atualizarUsuario,
  buscarUsuario,
  criarUsuario,
  excluirUsuario,
  listarUsuarios,
} from "../controllers/usuario.controller";
import { autenticarOpcional, autorizarPapeis } from "../auth/autenticacao";

type PapelUsuario = "ADMINISTRADOR" | "OPERADOR_CADASTRO" | "GESTOR_ALMOXARIFADO" | "AUDITOR";
type UsuarioBody = { usuario: string; senha: string; papel: PapelUsuario };
type UsuarioParams = { id: string };
type AtualizarUsuarioBody = {
  versao: number;
  usuario?: string;
  senha?: string;
  papel?: PapelUsuario;
};

const camposUsuario = {
  usuario: { type: "string", minLength: 1, maxLength: 100 },
  senha: { type: "string", minLength: 8, maxLength: 128 },
  papel: {
    type: "string",
    enum: ["ADMINISTRADOR", "OPERADOR_CADASTRO", "GESTOR_ALMOXARIFADO", "AUDITOR"],
  },
};
const somenteAdmin = autorizarPapeis("ADMINISTRADOR");

export async function usuarioRoutes(app: FastifyInstance) {
  // Primeiro cadastro: permite provisionar o administrador inicial. Depois, só admin cria contas.
  app.post<{ Body: UsuarioBody }>(
    "/usuarios",
    {
      onRequest: autenticarOpcional,
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["usuario", "senha", "papel"],
          properties: camposUsuario,
        },
      },
    },
    criarUsuario,
  );

  app.get("/usuarios", { onRequest: somenteAdmin }, listarUsuarios);
  app.get<{ Params: { id: string } }>("/usuarios/:id", { onRequest: somenteAdmin }, buscarUsuario);

  app.put<{ Params: UsuarioParams; Body: AtualizarUsuarioBody }>(
    "/usuarios/:id",
    {
      onRequest: somenteAdmin,
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["versao", "usuario", "senha", "papel"],
          properties: { versao: { type: "integer", minimum: 0 }, ...camposUsuario },
        },
      },
    },
    atualizarUsuario,
  );

  app.patch<{ Params: UsuarioParams; Body: AtualizarUsuarioBody }>(
    "/usuarios/:id",
    {
      onRequest: somenteAdmin,
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 2,
          required: ["versao"],
          properties: {
            versao: { type: "integer", minimum: 0 },
            usuario: camposUsuario.usuario,
            senha: camposUsuario.senha,
            papel: camposUsuario.papel,
          },
        },
      },
    },
    atualizarUsuario,
  );

  app.delete<{ Params: { id: string }; Querystring: { versao: number } }>(
    "/usuarios/:id",
    {
      onRequest: somenteAdmin,
      schema: {
        querystring: {
          type: "object",
          required: ["versao"],
          properties: { versao: { type: "integer", minimum: 0 } },
        },
      },
    },
    excluirUsuario,
  );
}
