import { prisma } from "../lib/db";
import type { Prisma } from "../generated/prisma/client";

export type AtualizarContratoDados = {
  dataAssinatura?: Date;
  dataVencimento?: Date;
  clausulas?: object;
  valorMensal?: number;
  renovacaoAutomatica?: boolean;
};

export const contratoRepository = {
  listar() {
    return prisma.contrato.findMany({ orderBy: [{ dataAssinatura: "desc" }, { id: "asc" }] });
  },
  buscarPorId(id: string) {
    return prisma.contrato.findUnique({ where: { id } });
  },
  buscarPorIdTx(tx: Prisma.TransactionClient, id: string) {
    return tx.contrato.findUnique({ where: { id } });
  },
  organizacaoAtivaTx(tx: Prisma.TransactionClient, id: string) {
    return tx.organizacao.findUnique({ where: { id }, select: { id: true, ativo: true } });
  },
  criarTx(tx: Prisma.TransactionClient, organizacaoId: string, dados: {
    dataAssinatura: Date;
    dataVencimento: Date;
    clausulas: object;
    valorMensal: number;
    renovacaoAutomatica?: boolean;
  }) {
    return tx.contrato.create({
      data: {
        ...dados,
        clausulas: dados.clausulas as Prisma.InputJsonValue,
        organizacaoId,
      },
    });
  },
  async atualizarSeVersaoAtualTx(
    tx: Prisma.TransactionClient,
    id: string,
    versao: number,
    dados: AtualizarContratoDados,
  ) {
    const resultado = await tx.contrato.updateMany({
      where: { id, versao },
      data: { ...dados, versao: { increment: 1 } },
    });
    return resultado.count > 0;
  },
  async excluirSeVersaoAtualTx(tx: Prisma.TransactionClient, id: string, versao: number) {
    const resultado = await tx.contrato.deleteMany({ where: { id, versao } });
    return resultado.count > 0;
  },
};
