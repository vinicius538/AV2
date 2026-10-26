import type { FastifyInstance } from "fastify";
import { criarMovimentacao, listarMovimentacoes } from "../controllers/movimentacao.controller";
import { autorizarPapeis } from "../auth/autenticacao";

export async function movimentacaoRoutes(app: FastifyInstance) {
  app.get<{ Params: { equipamentoId: string } }>(
    "/equipamentos/:equipamentoId/movimentacoes",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO", "AUDITOR"),
      schema: {
        params: {
          type: "object",
          required: ["equipamentoId"],
          properties: { equipamentoId: { type: "string", minLength: 1, maxLength: 36 } },
        },
      },
    },
    listarMovimentacoes,
  );

  app.post<{ Params: { equipamentoId: string }; Body: { origem: string; destino: string; observacao?: string } }>(
    "/equipamentos/:equipamentoId/movimentacoes",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO"),
      schema: {
        params: {
          type: "object",
          required: ["equipamentoId"],
          properties: { equipamentoId: { type: "string", minLength: 1, maxLength: 36 } },
        },
        body: {
          type: "object",
          additionalProperties: false,
          required: ["origem", "destino"],
          properties: {
            origem: { type: "string", minLength: 1, maxLength: 150 },
            destino: { type: "string", minLength: 1, maxLength: 150 },
            observacao: { type: "string" },
          },
        },
      },
    },
    criarMovimentacao,
  );
}
