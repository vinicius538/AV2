import { prisma } from "../lib/db";
import type { Prisma } from "../generated/prisma/client";

export type CriarOrganizacaoDados = {
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual?: string;
  enderecoCompleto: string;
  telefone: string;
  email: string;
};
export type AtualizarOrganizacaoDados = Omit<Partial<CriarOrganizacaoDados>, "inscricaoEstadual"> & {
  inscricaoEstadual?: string | null;
  ativo?: boolean;
};

export const organizacaoRepository = {
  listar() {
    return prisma.organizacao.findMany({ orderBy: { razaoSocial: "asc" } });
  },
  buscarPorCnpj(cnpj: string) {
    return prisma.organizacao.findUnique({ where: { cnpj } });
  },
  buscarPorId(id: string) {
    return prisma.organizacao.findUnique({ where: { id } });
  },
  buscarPorCnpjTx(tx: Prisma.TransactionClient, cnpj: string) {
    return tx.organizacao.findUnique({ where: { cnpj } });
  },
  buscarPorIdTx(tx: Prisma.TransactionClient, id: string) {
    return tx.organizacao.findUnique({ where: { id } });
  },
  criarTx(tx: Prisma.TransactionClient, dados: CriarOrganizacaoDados) {
    return tx.organizacao.create({ data: dados });
  },
  async atualizarSeVersaoAtualTx(
    tx: Prisma.TransactionClient,
    id: string,
    versao: number,
    dados: AtualizarOrganizacaoDados,
  ) {
    const resultado = await tx.organizacao.updateMany({
      where: { id, versao },
      data: { ...dados, versao: { increment: 1 } },
    });
    return resultado.count > 0;
  },
  async excluirSeVersaoAtualTx(tx: Prisma.TransactionClient, id: string, versao: number) {
    const resultado = await tx.organizacao.deleteMany({ where: { id, versao } });
    return resultado.count > 0;
  },
};
