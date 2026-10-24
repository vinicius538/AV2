import type { FastifyInstance } from "fastify";
import { atualizarEquipamento, buscarEquipamento } from "../controllers/equipamento.controller";

// Esboço de criação mantido para implementação posterior.
export async function equipamentoRoutes(app: FastifyInstance) {
  app.post("/lotes/:loteId/equipamentos", async (request, reply) => {
    const {
      codigoBarrasInterno,
      tipo,
      marca,
      modelo,
      anoFabricacao,
      estadoFisico,
      pesoQuilogramas,
      precoMercado,
      statusRastreamento,
      triagemCompleta,
      etiqueta,
    } = request.body as {
      codigoBarrasInterno: string;
      tipo: "COMPUTADOR" | "NOTEBOOK" | "MONITOR" | "OUTRO";
      marca: string;
      modelo: string;
      anoFabricacao: number;
      estadoFisico: "NOVO" | "BOM" | "REGULAR" | "RUIM" | "INSERVIVEL";
      pesoQuilogramas: number;
      precoMercado: number;
      statusRastreamento: "RECEBIDO" | "EM_TRIAGEM" | "DISPONIVEL" | "EM_DESMONTE" | "DESCARTADO";
      triagemCompleta?: boolean;
      etiqueta?: string;
    };
  });
}

export async function equipamentoVersionRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>("/equipamentos/:id", buscarEquipamento);
  app.patch(
    "/equipamentos/:id",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 2,
          required: ["versao"],
          properties: {
            versao: { type: "integer", minimum: 0 },
            estadoFisico: { type: "string", enum: ["NOVO", "BOM", "REGULAR", "RUIM", "INSERVIVEL"] },
            statusRastreamento: { type: "string", enum: ["RECEBIDO", "EM_TRIAGEM", "DISPONIVEL", "EM_DESMONTE", "DESCARTADO"] },
            triagemCompleta: { type: "boolean" },
            etiqueta: { type: "string", maxLength: 100 },
            pesoQuilogramas: { type: "number", minimum: 0 },
            precoMercado: { type: "number", minimum: 0 },
          },
        },
      },
    },
    atualizarEquipamento,
  );
}
