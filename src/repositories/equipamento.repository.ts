import { prisma } from "../lib/db";

export type AtualizarEquipamentoDados = {
  estadoFisico?: "NOVO" | "BOM" | "REGULAR" | "RUIM" | "INSERVIVEL";
  statusRastreamento?: "RECEBIDO" | "EM_TRIAGEM" | "DISPONIVEL" | "EM_DESMONTE" | "DESCARTADO";
  triagemCompleta?: boolean;
  etiqueta?: string;
  pesoQuilogramas?: number;
  precoMercado?: number;
};

export const equipamentoRepository = {
  buscarPorId(id: string) {
    return prisma.equipamento.findUnique({ where: { id } });
  },
  async atualizarSeVersaoAtual(id: string, versao: number, dados: AtualizarEquipamentoDados) {
    const resultado = await prisma.equipamento.updateMany({
      where: { id, versao },
      data: { ...dados, versao: { increment: 1 } },
    });
    return resultado.count > 0;
  },
};
