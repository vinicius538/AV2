import { prisma } from "../lib/db";
import type { Prisma } from "../generated/prisma/client";

export type AtualizarLoteDados = {
  dataEntrada?: Date;
  notaFiscal?: string;
  transportadora?: string;
  statusProcessamento?: "RECEBIDO" | "EM_TRIAGEM" | "TRIAGEM_CONCLUIDA";
  observacoes?: string | null;
};

export const loteRepository = {
  listar() {
    return prisma.lote.findMany({ orderBy: [{ dataEntrada: "desc" }, { id: "asc" }] });
  },
  organizacaoAtivaTx(tx: Prisma.TransactionClient, organizacaoId: string) {
    return tx.organizacao.findUnique({ where: { id: organizacaoId }, select: { id: true, ativo: true } });
  },
  criarTx(tx: Prisma.TransactionClient, organizacaoId: string, dados: {
    dataEntrada: Date;
    notaFiscal: string;
    transportadora: string;
    statusProcessamento?: "RECEBIDO" | "EM_TRIAGEM" | "TRIAGEM_CONCLUIDA";
    observacoes?: string;
  }) {
    return tx.lote.create({ data: { ...dados, organizacaoId } });
  },
  buscarPorId(id: string) {
    return prisma.lote.findUnique({ where: { id } });
  },
  buscarPorIdTx(tx: Prisma.TransactionClient, id: string) {
    return tx.lote.findUnique({ where: { id } });
  },
  async atualizarSeVersaoAtualTx(
    tx: Prisma.TransactionClient,
    id: string,
    versao: number,
    dados: AtualizarLoteDados,
  ) {
    const resultado = await tx.lote.updateMany({
      where: { id, versao },
      data: { ...dados, versao: { increment: 1 } },
    });
    return resultado.count > 0;
  },
  async excluirSeVersaoAtualTx(tx: Prisma.TransactionClient, id: string, versao: number) {
    const resultado = await tx.lote.deleteMany({ where: { id, versao } });
    return resultado.count > 0;
  },
};
