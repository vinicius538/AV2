import type { FastifyInstance } from "fastify";
import { atualizarConfiguracao, buscarConfiguracao } from "../controllers/configuracao.controller";
import { autorizarPapeis } from "../auth/autenticacao";

type Body = { versao: number; aliquotaImposto?: number; coeficienteDepreciacao?: number };

export async function configuracaoRoutes(app: FastifyInstance) {
  app.get("/configuracoes", { onRequest: autorizarPapeis("ADMINISTRADOR") }, buscarConfiguracao);
  app.patch<{ Body: Body }>(
    "/configuracoes",
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
            aliquotaImposto: { type: "number", minimum: 0, maximum: 100 },
            coeficienteDepreciacao: { type: "number", minimum: 0, maximum: 1 },
          },
        },
      },
    },
    atualizarConfiguracao,
  );
}
