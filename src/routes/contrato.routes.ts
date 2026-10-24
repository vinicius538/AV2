import type { FastifyInstance } from "fastify";
import { atualizarContrato, buscarContrato } from "../controllers/contrato.controller";

// Esboço de criação mantido para implementação posterior.
export async function contratoRoutes(app: FastifyInstance) {
  app.post("/organizacoes/:organizacaoId/contratos", async (request, reply) => {
    const { dataAssinatura, dataVencimento, clausulas, valorMensal, renovacaoAutomatica } =
      request.body as {
        dataAssinatura: Date;
        dataVencimento: Date;
        clausulas: object;
        valorMensal: number;
        renovacaoAutomatica?: boolean;
      };
  });
}

export async function contratoVersionRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>("/contratos/:id", buscarContrato);
  app.patch(
    "/contratos/:id",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 2,
          required: ["versao"],
          properties: {
            versao: { type: "integer", minimum: 0 },
            dataAssinatura: { type: "string", format: "date-time" },
            dataVencimento: { type: "string", format: "date-time" },
            clausulas: { type: "object" },
            valorMensal: { type: "number", minimum: 0 },
            renovacaoAutomatica: { type: "boolean" },
          },
        },
      },
    },
    atualizarContrato,
  );
}
