import { prisma } from "../lib/db";
import { journalRepository, type EventoJournal } from "../repositories/journal.repository";
import type { Prisma } from "../generated/prisma/client";

export class JournalResponsavelInvalidoError extends Error {
  constructor() {
    super("O usuário responsável não existe ou está inativo.");
    this.name = "JournalResponsavelInvalidoError";
  }
}

export class JournalPermissaoError extends Error {
  constructor() {
    super("Somente um administrador ou auditor ativo pode consultar o journal.");
    this.name = "JournalPermissaoError";
  }
}

export async function executarComJournal<T>(
  operacao: (tx: Prisma.TransactionClient) => Promise<{ resultado: T; evento: EventoJournal }>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const { resultado, evento } = await operacao(tx);
    const responsavel = await tx.usuario.findUnique({
      where: { id: evento.usuarioResponsavel },
      select: { ativo: true },
    });
    if (!responsavel?.ativo) throw new JournalResponsavelInvalidoError();
    await journalRepository.registrar(tx, evento);
    return resultado;
  });
}

export const journalService = {
  async listar(
    solicitanteId: string,
    filtros: { entidade?: string; operacao?: string; usuarioResponsavel?: string; limite?: number },
  ) {
    const solicitante = await prisma.usuario.findUnique({
      where: { id: solicitanteId },
      select: { papel: true, ativo: true },
    });
    if (!solicitante || !solicitante.ativo || !["ADMINISTRADOR", "AUDITOR"].includes(solicitante.papel)) {
      throw new JournalPermissaoError();
    }

    return journalRepository.listar({
      ...filtros,
      limite: Math.min(Math.max(filtros.limite ?? 50, 1), 100),
    });
  },
};
