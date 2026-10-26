import type { FastifyInstance } from "fastify";
import {
  atualizarContrato,
  buscarContrato,
  criarContrato,
  excluirContrato,
  listarContratos,
} from "../controllers/contrato.controller";
import { autorizarPapeis } from "../auth/autenticacao";

export async function contratoVersionRoutes(app: FastifyInstance) {
  app.post<{ Params: { organizacaoId: string }; Body: {
    dataAssinatura: string;
    dataVencimento: string;
    clausulas: object;
    valorMensal: number;
    renovacaoAutomatica?: boolean;
  } }>(
    "/organizacoes/:organizacaoId/contratos",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR", "OPERADOR_CADASTRO"),
      schema: {
        params: {
          type: "object",
          required: ["organizacaoId"],
          properties: { organizacaoId: { type: "string", minLength: 1, maxLength: 36 } },
        },
        body: {
          type: "object",
          additionalProperties: false,
          required: ["dataAssinatura", "dataVencimento", "clausulas", "valorMensal"],
          properties: {
            dataAssinatura: { type: "string", format: "date-time" },
            dataVencimento: { type: "string", format: "date-time" },
            clausulas: { type: "object" },
            valorMensal: { type: "number", minimum: 0 },
            renovacaoAutomatica: { type: "boolean" },
          },
        },
      },
    },
    criarContrato,
  );

  app.get("/contratos", { onRequest: autorizarPapeis("ADMINISTRADOR", "OPERADOR_CADASTRO", "AUDITOR") }, listarContratos);
  app.get<{ Params: { id: string } }>("/contratos/:id", { onRequest: autorizarPapeis("ADMINISTRADOR", "OPERADOR_CADASTRO", "AUDITOR") }, buscarContrato);
  app.patch<{ Params: { id: string }; Body: {
    versao: number;
    dataAssinatura?: string;
    dataVencimento?: string;
    clausulas?: object;
    valorMensal?: number;
    renovacaoAutomatica?: boolean;
  } }>(
    "/contratos/:id",
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

  app.put<{ Params: { id: string }; Body: {
    versao: number;
    dataAssinatura: string;
    dataVencimento: string;
    clausulas: object;
    valorMensal: number;
    renovacaoAutomatica: boolean;
  } }>(
    "/contratos/:id",
    {
      onRequest: autorizarPapeis("ADMINISTRADOR"),
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["versao", "dataAssinatura", "dataVencimento", "clausulas", "valorMensal", "renovacaoAutomatica"],
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

  app.delete<{ Params: { id: string }; Querystring: { versao: number } }>(
    "/contratos/:id",
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
    excluirContrato,
  );
}

