import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/db";

export type DadosConfiguracao = {
  aliquotaImposto?: number;
  coeficienteDepreciacao?: number;
};

export const configuracaoRepository = {
  buscarGlobal() {
    return prisma.configuracaoSistema.findUnique({ where: { id: "GLOBAL" } });
  },
  buscarGlobalTx(tx: Prisma.TransactionClient) {
    return tx.configuracaoSistema.findUnique({ where: { id: "GLOBAL" } });
  },
  criarGlobalTx(tx: Prisma.TransactionClient) {
    return tx.configuracaoSistema.create({ data: { id: "GLOBAL" } });
  },
  async atualizarTx(tx: Prisma.TransactionClient, versao: number, dados: DadosConfiguracao) {
    const resultado = await tx.configuracaoSistema.updateMany({
      where: { id: "GLOBAL", versao },
      data: { ...dados, versao: { increment: 1 } },
    });
    return resultado.count > 0;
  },
};
