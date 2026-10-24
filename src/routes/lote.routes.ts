import type { FastifyInstance } from "fastify";
import { atualizarLote, buscarLote } from "../controllers/lote.controller";

// Esboço de criação mantido para implementação posterior.
export async function loteRoutes(app: FastifyInstance) {
  app.post("/organizacoes/:organizacaoId/lotes", async (request, reply) => {
    const { dataEntrada, notaFiscal, transportadora, statusProcessamento, observacoes } =
      request.body as {
        dataEntrada: Date;
        notaFiscal: string;
        transportadora: string;
        statusProcessamento?: "RECEBIDO" | "EM_TRIAGEM" | "TRIAGEM_CONCLUIDA";
        observacoes?: string;
      };
  });
}

export async function loteVersionRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>("/lotes/:id", buscarLote);
  app.patch(
    "/lotes/:id",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 2,
          required: ["versao"],
          properties: {
            versao: { type: "integer", minimum: 0 },
            dataEntrada: { type: "string", format: "date-time" },
            notaFiscal: { type: "string", minLength: 1, maxLength: 100 },
            transportadora: { type: "string", minLength: 1, maxLength: 150 },
            statusProcessamento: { type: "string", enum: ["RECEBIDO", "EM_TRIAGEM", "TRIAGEM_CONCLUIDA"] },
            observacoes: { anyOf: [{ type: "string" }, { type: "null" }] },
          },
        },
      },
    },
    atualizarLote,
  );
}
