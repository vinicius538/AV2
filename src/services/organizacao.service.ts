import {
  organizacaoRepository,
  type CriarOrganizacaoDados,
} from "../repositories/organizacao.repository";
import { executarComJournal } from "./journal.service";
import { RegistroNaoEncontradoError } from "./versao.errors";
import { normalizarEValidarCnpj } from "./regras-de-negocio";

export class CnpjJaCadastradoError extends Error {
  constructor() {
    super("Já existe uma organização cadastrada com este CNPJ.");
    this.name = "CnpjJaCadastradoError";
  }
}

export const organizacaoService = {
  listar() {
    return organizacaoRepository.listar();
  },

  async criar(dados: CriarOrganizacaoDados, usuarioResponsavel: string) {
    const dadosNormalizados = { ...dados, cnpj: normalizarEValidarCnpj(dados.cnpj) };
    return executarComJournal(async (tx) => {
      const existente = await organizacaoRepository.buscarPorCnpjTx(tx, dadosNormalizados.cnpj);
      if (existente) throw new CnpjJaCadastradoError();

      const organizacao = await organizacaoRepository.criarTx(tx, dadosNormalizados);
      return {
        resultado: organizacao,
        evento: {
          usuarioResponsavel,
          operacao: "CRIAR",
          entidade: `organizacoes/${organizacao.id}`,
          dadosDepois: organizacao,
        },
      };
    });
  },
};
