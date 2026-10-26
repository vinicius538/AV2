import type { FastifyInstance } from "fastify";
import { autorizarPapeis } from "../auth/autenticacao";
import {
  atualizarOrganizacao,
  buscarOrganizacao,
  criarOrganizacao,
  excluirOrganizacao,
  listarOrganizacoes,
} from "../controllers/organizacao.controller";

type CriarOrganizacaoBody = {
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual?: string;
  enderecoCompleto: string;
  telefone: string;
  email: string;
};
type IdParams = { id: string };
type AtualizarOrganizacaoBody = Partial<CriarOrganizacaoBody> & {
  versao: number;
  inscricaoEstadual?: string | null;
  ativo?: boolean;
};

const propriedadesOrganizacao = {
  razaoSocial: { type: "string", minLength: 1, maxLength: 200 },
  cnpj: { type: "string", minLength: 14, maxLength: 18, pattern: "^[A-Za-z0-9./-]+$" },
  inscricaoEstadual: { anyOf: [{ type: "string", maxLength: 30 }, { type: "null" }] },
  enderecoCompleto: { type: "string", minLength: 1, maxLength: 255 },
  telefone: { type: "string", minLength: 1, maxLength: 30 },
  email: { type: "string", format: "email", maxLength: 150 },
  ativo: { type: "boolean" },
};

export async function organizacaoRoutes(app: FastifyInstance) {
  // CREATE
  app.post<{ Body: CriarOrganizacaoBody }>(
    "/organizacoes",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR", "OPERADOR_CADASTRO"),
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["razaoSocial", "cnpj", "enderecoCompleto", "telefone", "email"],
          properties: {
            razaoSocial: propriedadesOrganizacao.razaoSocial,
            cnpj: propriedadesOrganizacao.cnpj,
            inscricaoEstadual: { type: "string", maxLength: 30 },
            enderecoCompleto: propriedadesOrganizacao.enderecoCompleto,
            telefone: propriedadesOrganizacao.telefone,
            email: propriedadesOrganizacao.email,
          },
        },
      },
    },
    criarOrganizacao,
  );

  // READ: lista e consulta por ID
  app.get("/organizacoes", { onRequest: autorizarPapeis("ADMINISTRADOR", "OPERADOR_CADASTRO", "AUDITOR") }, listarOrganizacoes);
  app.get<{ Params: { id: string } }>("/organizacoes/:id", { onRequest: autorizarPapeis("ADMINISTRADOR", "OPERADOR_CADASTRO", "AUDITOR") }, buscarOrganizacao);

  // UPDATE completo: todos os campos e a versao atual são obrigatórios.
  app.put<{ Params: IdParams; Body: AtualizarOrganizacaoBody }>(
    "/organizacoes/:id",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR"),
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: [
            "versao",
            "razaoSocial",
            "cnpj",
            "inscricaoEstadual",
            "enderecoCompleto",
            "telefone",
            "email",
            "ativo",
          ],
          properties: {
            versao: { type: "integer", minimum: 0 },
            ...propriedadesOrganizacao,
          },
        },
      },
    },
    atualizarOrganizacao,
  );

  // UPDATE parcial, se precisar alterar somente alguns campos.
  app.patch<{ Params: IdParams; Body: AtualizarOrganizacaoBody }>(
    "/organizacoes/:id",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR"),
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 2,
          required: ["versao"],
          properties: {
            versao: { type: "integer", minimum: 0 },
            ...propriedadesOrganizacao,
          },
        },
      },
    },
    atualizarOrganizacao,
  );

  // DELETE exige a versao atual: DELETE /organizacoes/:id?versao=0
  app.delete<{ Params: { id: string }; Querystring: { versao: number } }>(
    "/organizacoes/:id",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR"),
      schema: {
        querystring: {
          type: "object",
          required: ["versao"],
          properties: { versao: { type: "integer", minimum: 0 } },
        },
      },
    },
    excluirOrganizacao,
  );
}

