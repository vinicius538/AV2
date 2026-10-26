import { prisma } from "../lib/db";
import type { Prisma } from "../generated/prisma/client";

const usuarioPublico = {
  id: true,
  usuario: true,
  ultimoAcesso: true,
  papel: true,
  versao: true,
  ativo: true,
} as const;

export type CriarUsuarioDados = {
  usuario: string;
  papel: "ADMINISTRADOR" | "OPERADOR_CADASTRO" | "GESTOR_ALMOXARIFADO" | "AUDITOR";
  hashSenha: string;
  salt: string;
};
export type AtualizarUsuarioDados = {
  usuario?: string;
  papel?: "ADMINISTRADOR" | "OPERADOR_CADASTRO" | "GESTOR_ALMOXARIFADO" | "AUDITOR";
  hashSenha?: string;
  salt?: string;
};

export const usuarioRepository = {
  buscarCredenciaisPorNome(usuario: string) {
    return prisma.usuario.findUnique({
      where: { usuario },
      select: { id: true, usuario: true, hashSenha: true, salt: true, papel: true, ativo: true },
    });
  },
  buscarSessaoPorId(id: string) {
    return prisma.usuario.findUnique({
      where: { id },
      select: { id: true, usuario: true, papel: true, ativo: true, ultimoAcesso: true },
    });
  },
  async atualizarUltimoAcessoSeAtivo(id: string, data: Date) {
    const resultado = await prisma.usuario.updateMany({ where: { id, ativo: true }, data: { ultimoAcesso: data } });
    return resultado.count > 0;
  },
  contarAtivos() {
    return prisma.usuario.count({ where: { ativo: true } });
  },
  registrarAcesso(id: string) {
    return prisma.usuario.update({ where: { id }, data: { ultimoAcesso: new Date() } });
  },
  listar() {
    return prisma.usuario.findMany({ select: usuarioPublico, orderBy: { usuario: "asc" } });
  },
  buscarPorId(id: string) {
    return prisma.usuario.findUnique({ where: { id }, select: usuarioPublico });
  },
  buscarPorNome(usuario: string) {
    return prisma.usuario.findUnique({ where: { usuario }, select: { id: true } });
  },
  buscarPorIdTx(tx: Prisma.TransactionClient, id: string) {
    return tx.usuario.findUnique({ where: { id }, select: usuarioPublico });
  },
  buscarPorNomeTx(tx: Prisma.TransactionClient, usuario: string) {
    return tx.usuario.findUnique({ where: { usuario }, select: { id: true } });
  },
  criarTx(tx: Prisma.TransactionClient, dados: CriarUsuarioDados) {
    return tx.usuario.create({ data: dados, select: usuarioPublico });
  },
  async atualizarSeVersaoAtualTx(
    tx: Prisma.TransactionClient,
    id: string,
    versao: number,
    dados: AtualizarUsuarioDados,
  ) {
    const resultado = await tx.usuario.updateMany({
      where: { id, versao, ativo: true },
      data: { ...dados, versao: { increment: 1 } },
    });
    return resultado.count > 0;
  },
  async inativarSeVersaoAtualTx(tx: Prisma.TransactionClient, id: string, versao: number) {
    const resultado = await tx.usuario.updateMany({
      where: { id, versao, ativo: true },
      data: { ativo: false, versao: { increment: 1 } },
    });
    return resultado.count > 0;
  },
};

