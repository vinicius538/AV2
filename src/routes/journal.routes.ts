import type { FastifyInstance } from "fastify";
import { listarJournal } from "../controllers/journal.controller";
import { autorizarPapeis } from "../auth/autenticacao";

export async function journalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", autorizarPapeis("ADMINISTRADOR", "AUDITOR"));
  app.get(
    "/journal",
    {
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            entidade: { type: "string", maxLength: 100 },
            operacao: { type: "string", maxLength: 50 },
            usuarioResponsavel: { type: "string", maxLength: 36 },
            limite: { type: "integer", minimum: 1, maximum: 100 },
          },
        },
      },
    },
    listarJournal,
  );
}

