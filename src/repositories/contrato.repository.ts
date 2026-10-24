import { prisma } from "../lib/db";

export type AtualizarContratoDados = {
  dataAssinatura?: Date;
  dataVencimento?: Date;
  clausulas?: object;
  valorMensal?: number;
  renovacaoAutomatica?: boolean;
};

export const contratoRepository = {
  buscarPorId(id: string) {
    return prisma.contrato.findUnique({ where: { id } });
  },
  async atualizarSeVersaoAtual(id: string, versao: number, dados: AtualizarContratoDados) {
    const resultado = await prisma.contrato.updateMany({
      where: { id, versao },
      data: { ...dados, versao: { increment: 1 } },
    });
    return resultado.count > 0;
  },
};
