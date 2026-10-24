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

export type AtualizarOrganizacaoDados = Partial<CriarOrganizacaoDados> & { ativo?: boolean };

export const organizacaoRepository = {
  buscarPorCnpj(cnpj: string) {
    return prisma.organizacao.findUnique({ where: { cnpj } });
  },

  buscarPorId(id: string) {
    return prisma.organizacao.findUnique({ where: { id } });
  },

  criar(dados: CriarOrganizacaoDados) {
    return prisma.organizacao.create({ data: dados });
  },

  async atualizarSeVersaoAtual(id: string, versao: number, dados: AtualizarOrganizacaoDados) {
    const resultado = await prisma.organizacao.updateMany({
      where: { id, versao },
      data: { ...dados, versao: { increment: 1 } },
    });
    return resultado.count > 0;
  },
};
