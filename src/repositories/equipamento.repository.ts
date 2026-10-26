import { prisma } from "../lib/db";
import type { Prisma } from "../generated/prisma/client";

export type AtualizarEquipamentoDados = {
  codigoBarrasInterno?: string;
  tipo?: "COMPUTADOR" | "NOTEBOOK" | "MONITOR" | "OUTRO";
  marca?: string;
  modelo?: string;
  anoFabricacao?: number;
  estadoFisico?: "NOVO" | "BOM" | "REGULAR" | "RUIM" | "INSERVIVEL";
  statusRastreamento?: "RECEBIDO" | "EM_TRIAGEM" | "DISPONIVEL" | "EM_DESMONTE" | "DESCARTADO";
  pesoQuilogramas?: number;
  precoMercado?: number;
  triagemCompleta?: boolean;
  etiqueta?: string;
};

export const equipamentoRepository = {
  listar() {
    return prisma.equipamento.findMany({ orderBy: [{ codigoBarrasInterno: "asc" }, { id: "asc" }] });
  },
  loteAtivoTx(tx: Prisma.TransactionClient, loteId: string) {
    return tx.lote.findUnique({
      where: { id: loteId },
      select: { id: true, organizacao: { select: { ativo: true } } },
    });
  },
  buscarPorCodigoTx(tx: Prisma.TransactionClient, codigoBarrasInterno: string) {
    return tx.equipamento.findUnique({ where: { codigoBarrasInterno }, select: { id: true } });
  },
  criarTx(tx: Prisma.TransactionClient, loteId: string, dados: {
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
  }) {
    return tx.equipamento.create({ data: { ...dados, loteId } });
  },
  buscarPorId(id: string) {
    return prisma.equipamento.findUnique({ where: { id } });
  },
  buscarPorIdTx(tx: Prisma.TransactionClient, id: string) {
    return tx.equipamento.findUnique({ where: { id } });
  },
  async atualizarSeVersaoAtualTx(
    tx: Prisma.TransactionClient,
    id: string,
    versao: number,
    dados: AtualizarEquipamentoDados,
  ) {
    const resultado = await tx.equipamento.updateMany({
      where: { id, versao },
      data: { ...dados, versao: { increment: 1 } },
    });
    return resultado.count > 0;
  },
  async excluirSeVersaoAtualTx(tx: Prisma.TransactionClient, id: string, versao: number) {
    const resultado = await tx.equipamento.deleteMany({ where: { id, versao } });
    return resultado.count > 0;
  },
};
