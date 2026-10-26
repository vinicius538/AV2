import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/db";

export const movimentacaoRepository = {
  equipamentoExiste(equipamentoId: string) {
    return prisma.equipamento.findUnique({ where: { id: equipamentoId }, select: { id: true } });
  },
  equipamentoExisteTx(tx: Prisma.TransactionClient, equipamentoId: string) {
    return tx.equipamento.findUnique({ where: { id: equipamentoId }, select: { id: true } });
  },
  criarTx(tx: Prisma.TransactionClient, equipamentoId: string, dados: {
    origem: string;
    destino: string;
    responsavel: string;
    observacao?: string;
  }) {
    return tx.movimentacao.create({ data: { ...dados, equipamentoId } });
  },
  listarPorEquipamento(equipamentoId: string) {
    return prisma.movimentacao.findMany({
      where: { equipamentoId },
      orderBy: { dataHora: "desc" },
    });
  },
};
