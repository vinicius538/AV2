import type { FastifyInstance } from "fastify";
import {
  atualizarEquipamento,
  buscarEquipamento,
  criarEquipamento,
  excluirEquipamento,
  listarEquipamentos,
} from "../controllers/equipamento.controller";
import { autorizarPapeis } from "../auth/autenticacao";

export async function equipamentoVersionRoutes(app: FastifyInstance) {
  app.post<{ Params: { loteId: string }; Body: {
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
  } }>(
    "/lotes/:loteId/equipamentos",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO"),
      schema: {
        params: {
          type: "object",
          required: ["loteId"],
          properties: { loteId: { type: "string", minLength: 1, maxLength: 36 } },
        },
        body: {
          type: "object",
          additionalProperties: false,
          required: [
            "codigoBarrasInterno", "tipo", "marca", "modelo", "anoFabricacao",
            "estadoFisico", "pesoQuilogramas", "precoMercado", "statusRastreamento",
          ],
          properties: {
            codigoBarrasInterno: { type: "string", minLength: 1, maxLength: 100 },
            tipo: { type: "string", enum: ["COMPUTADOR", "NOTEBOOK", "MONITOR", "OUTRO"] },
            marca: { type: "string", minLength: 1, maxLength: 100 },
            modelo: { type: "string", minLength: 1, maxLength: 100 },
            anoFabricacao: { type: "integer", minimum: 1900 },
            estadoFisico: { type: "string", enum: ["NOVO", "BOM", "REGULAR", "RUIM", "INSERVIVEL"] },
            pesoQuilogramas: { type: "number", minimum: 0 },
            precoMercado: { type: "number", minimum: 0 },
            statusRastreamento: { type: "string", enum: ["RECEBIDO", "EM_TRIAGEM", "DISPONIVEL", "EM_DESMONTE", "DESCARTADO"] },
            triagemCompleta: { type: "boolean" },
            etiqueta: { type: "string", maxLength: 100 },
          },
        },
      },
    },
    criarEquipamento,
  );
  app.get("/equipamentos", { onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO", "AUDITOR") }, listarEquipamentos);
  app.get<{ Params: { id: string } }>("/equipamentos/:id", { onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO", "AUDITOR") }, buscarEquipamento);

  const campos = {
    codigoBarrasInterno: { type: "string", minLength: 1, maxLength: 100 },
    tipo: { type: "string", enum: ["COMPUTADOR", "NOTEBOOK", "MONITOR", "OUTRO"] },
    marca: { type: "string", minLength: 1, maxLength: 100 },
    modelo: { type: "string", minLength: 1, maxLength: 100 },
    anoFabricacao: { type: "integer", minimum: 1900 },
    estadoFisico: { type: "string", enum: ["NOVO", "BOM", "REGULAR", "RUIM", "INSERVIVEL"] },
    pesoQuilogramas: { type: "number", minimum: 0 },
    precoMercado: { type: "number", minimum: 0 },
    statusRastreamento: { type: "string", enum: ["RECEBIDO", "EM_TRIAGEM", "DISPONIVEL", "EM_DESMONTE", "DESCARTADO"] },
    triagemCompleta: { type: "boolean" },
    etiqueta: { type: "string", maxLength: 100 },
    justificativa: { type: "string", minLength: 1, maxLength: 2000 },
  };

  app.patch<{ Params: { id: string }; Body: {
    versao: number;
    codigoBarrasInterno?: string;
    tipo?: "COMPUTADOR" | "NOTEBOOK" | "MONITOR" | "OUTRO";
    marca?: string;
    modelo?: string;
    anoFabricacao?: number;
    estadoFisico?: "NOVO" | "BOM" | "REGULAR" | "RUIM" | "INSERVIVEL";
    pesoQuilogramas?: number;
    precoMercado?: number;
    statusRastreamento?: "RECEBIDO" | "EM_TRIAGEM" | "DISPONIVEL" | "EM_DESMONTE" | "DESCARTADO";
    triagemCompleta?: boolean;
    etiqueta?: string;
    justificativa?: string;
  } }>(
    "/equipamentos/:id",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO"),
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 2,
          required: ["versao"],
          properties: { versao: { type: "integer", minimum: 0 }, ...campos },
        },
      },
    },
    atualizarEquipamento,
  );

  app.put<{ Params: { id: string }; Body: {
    versao: number;
    codigoBarrasInterno: string;
    tipo: "COMPUTADOR" | "NOTEBOOK" | "MONITOR" | "OUTRO";
    marca: string;
    modelo: string;
    anoFabricacao: number;
    estadoFisico: "NOVO" | "BOM" | "REGULAR" | "RUIM" | "INSERVIVEL";
    pesoQuilogramas: number;
    precoMercado: number;
    statusRastreamento: "RECEBIDO" | "EM_TRIAGEM" | "DISPONIVEL" | "EM_DESMONTE" | "DESCARTADO";
    triagemCompleta: boolean;
    etiqueta: string;
    justificativa?: string;
  } }>(
    "/equipamentos/:id",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO"),
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["versao", "codigoBarrasInterno", "tipo", "marca", "modelo", "anoFabricacao", "estadoFisico", "pesoQuilogramas", "precoMercado", "statusRastreamento", "triagemCompleta", "etiqueta"],
          properties: { versao: { type: "integer", minimum: 0 }, ...campos },
        },
      },
    },
    atualizarEquipamento,
  );

  app.delete<{ Params: { id: string }; Querystring: { versao: number } }>(
    "/equipamentos/:id",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO"),
      schema: {
        querystring: {
          type: "object",
          required: ["versao"],
          properties: { versao: { type: "integer", minimum: 0 } },
        },
      },
    },
    excluirEquipamento,
  );
}

