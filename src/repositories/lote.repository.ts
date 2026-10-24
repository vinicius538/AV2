import { prisma } from "../lib/db";

export type AtualizarLoteDados = {
  dataEntrada?: Date;
  notaFiscal?: string;
  transportadora?: string;
  statusProcessamento?: "RECEBIDO" | "EM_TRIAGEM" | "TRIAGEM_CONCLUIDA";
  observacoes?: string | null;
};

export const loteRepository = {
  buscarPorId(id: string) {
    return prisma.lote.findUnique({ where: { id } });
  },
  async atualizarSeVersaoAtual(id: string, versao: number, dados: AtualizarLoteDados) {
    const resultado = await prisma.lote.updateMany({
      where: { id, versao },
      data: { ...dados, versao: { increment: 1 } },
    });
    return resultado.count > 0;
  },
};
