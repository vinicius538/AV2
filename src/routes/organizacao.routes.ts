import type { FastifyInstance } from "fastify";
import {
  atualizarOrganizacao,
  buscarOrganizacao,
  criarOrganizacao,
} from "../controllers/organizacao.controller";

export async function organizacaoRoutes(app: FastifyInstance) {
  app.post(
    "/organizacoes",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["razaoSocial", "cnpj", "enderecoCompleto", "telefone", "email"],
          properties: {
            razaoSocial: { type: "string", minLength: 1, maxLength: 200 },
            cnpj: { type: "string", minLength: 1, maxLength: 18 },
            inscricaoEstadual: { type: "string", maxLength: 30 },
            enderecoCompleto: { type: "string", minLength: 1, maxLength: 255 },
            telefone: { type: "string", minLength: 1, maxLength: 30 },
            email: { type: "string", minLength: 1, maxLength: 150 },
          },
        },
      },
    },
    criarOrganizacao,
  );

  app.get<{ Params: { id: string } }>("/organizacoes/:id", buscarOrganizacao);

  app.patch(
    "/organizacoes/:id",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 2,
          required: ["versao"],
          properties: {
            versao: { type: "integer", minimum: 0 },
            razaoSocial: { type: "string", minLength: 1, maxLength: 200 },
            cnpj: { type: "string", minLength: 1, maxLength: 18 },
            inscricaoEstadual: { type: "string", maxLength: 30 },
            enderecoCompleto: { type: "string", minLength: 1, maxLength: 255 },
            telefone: { type: "string", minLength: 1, maxLength: 30 },
            email: { type: "string", minLength: 1, maxLength: 150 },
            ativo: { type: "boolean" },
          },
        },
      },
    },
    atualizarOrganizacao,
  );
}
