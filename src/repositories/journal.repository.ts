import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/db";

export type EventoJournal = {
  usuarioResponsavel: string;
  operacao: string;
  entidade: string;
  dadosAntes?: unknown;
  dadosDepois?: unknown;
};

function comoJson(valor: unknown) {
  if (valor === undefined) return undefined;
  if (valor === null) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(valor)) as Prisma.InputJsonValue;
}

export const journalRepository = {
  registrar(tx: Prisma.TransactionClient, evento: EventoJournal) {
    return tx.journalTransacao.create({
      data: {
        usuarioResponsavel: evento.usuarioResponsavel,
        operacao: evento.operacao,
        entidade: evento.entidade,
        dadosAntes: comoJson(evento.dadosAntes),
        dadosDepois: comoJson(evento.dadosDepois),
      },
    });
  },

  listar(filtros: { entidade?: string; operacao?: string; usuarioResponsavel?: string; limite: number }) {
    return prisma.journalTransacao.findMany({
      where: {
        ...(filtros.entidade ? { entidade: { contains: filtros.entidade } } : {}),
        ...(filtros.operacao ? { operacao: filtros.operacao } : {}),
        ...(filtros.usuarioResponsavel ? { usuarioResponsavel: filtros.usuarioResponsavel } : {}),
      },
      orderBy: { timestamp: "desc" },
      take: filtros.limite,
      include: { usuario: { select: { id: true, usuario: true, papel: true } } },
    });
  },
};
