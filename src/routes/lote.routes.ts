import type { FastifyInstance } from "fastify";
import { atualizarLote, buscarLote, criarLote, excluirLote, listarLotes } from "../controllers/lote.controller";
import { autorizarPapeis } from "../auth/autenticacao";

export async function loteVersionRoutes(app: FastifyInstance) {
  app.post<{ Params: { organizacaoId: string }; Body: {
    dataEntrada: string;
    notaFiscal: string;
    transportadora: string;
    statusProcessamento?: "RECEBIDO" | "EM_TRIAGEM" | "TRIAGEM_CONCLUIDA";
    observacoes?: string;
  } }>(
    "/organizacoes/:organizacaoId/lotes",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO"),
      schema: {
        params: {
          type: "object",
          required: ["organizacaoId"],
          properties: { organizacaoId: { type: "string", minLength: 1, maxLength: 36 } },
        },
        body: {
          type: "object",
          additionalProperties: false,
          required: ["dataEntrada", "notaFiscal", "transportadora"],
          properties: {
            dataEntrada: { type: "string", format: "date-time" },
            notaFiscal: { type: "string", minLength: 1, maxLength: 100 },
            transportadora: { type: "string", minLength: 1, maxLength: 150 },
            statusProcessamento: { type: "string", enum: ["RECEBIDO", "EM_TRIAGEM", "TRIAGEM_CONCLUIDA"] },
            observacoes: { type: "string" },
          },
        },
      },
    },
    criarLote,
  );
  app.get("/lotes", { onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO", "AUDITOR") }, listarLotes);
  app.get<{ Params: { id: string } }>("/lotes/:id", { onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO", "AUDITOR") }, buscarLote);
  app.patch<{ Params: { id: string }; Body: {
    versao: number;
    dataEntrada?: string;
    notaFiscal?: string;
    transportadora?: string;
    statusProcessamento?: "RECEBIDO" | "EM_TRIAGEM" | "TRIAGEM_CONCLUIDA";
    observacoes?: string | null;
  } }>(
    "/lotes/:id",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO"),
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

  app.put<{ Params: { id: string }; Body: {
    versao: number;
    dataEntrada: string;
    notaFiscal: string;
    transportadora: string;
    statusProcessamento: "RECEBIDO" | "EM_TRIAGEM" | "TRIAGEM_CONCLUIDA";
    observacoes: string | null;
  } }>(
    "/lotes/:id",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR", "GESTOR_ALMOXARIFADO"),
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["versao", "dataEntrada", "notaFiscal", "transportadora", "statusProcessamento", "observacoes"],
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

  app.delete<{ Params: { id: string }; Querystring: { versao: number } }>(
    "/lotes/:id",
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
    excluirLote,
  );
}

