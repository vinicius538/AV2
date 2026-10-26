import {
  organizacaoRepository,
  type AtualizarOrganizacaoDados,
} from "../repositories/organizacao.repository";
import { executarComJournal } from "./journal.service";
import { RegistroNaoEncontradoError, ConflitoVersaoError } from "./versao.errors";
import { CnpjJaCadastradoError } from "./organizacao.service";
import { normalizarEValidarCnpj } from "./regras-de-negocio";

export const organizacaoVersionadaService = {
  async atualizar(id: string, versao: number, dados: AtualizarOrganizacaoDados, usuarioResponsavel: string) {
    const dadosNormalizados = dados.cnpj ? { ...dados, cnpj: normalizarEValidarCnpj(dados.cnpj) } : dados;
    return executarComJournal(async (tx) => {
      const antes = await organizacaoRepository.buscarPorIdTx(tx, id);
      if (!antes) throw new RegistroNaoEncontradoError();

      if (dadosNormalizados.cnpj) {
        const comMesmoCnpj = await organizacaoRepository.buscarPorCnpjTx(tx, dadosNormalizados.cnpj);
        if (comMesmoCnpj && comMesmoCnpj.id !== id) throw new CnpjJaCadastradoError();
      }

      const atualizado = await organizacaoRepository.atualizarSeVersaoAtualTx(tx, id, versao, dadosNormalizados);
      if (!atualizado) throw new ConflitoVersaoError();
      const depois = await organizacaoRepository.buscarPorIdTx(tx, id);
      if (!depois) throw new RegistroNaoEncontradoError();

      return {
        resultado: depois,
        evento: {
          usuarioResponsavel,
          operacao: "ATUALIZAR",
          entidade: `organizacoes/${id}`,
          dadosAntes: antes,
          dadosDepois: depois,
        },
      };
    });
  },

  async excluir(id: string, versao: number, usuarioResponsavel: string) {
    return executarComJournal(async (tx) => {
      const antes = await organizacaoRepository.buscarPorIdTx(tx, id);
      if (!antes) throw new RegistroNaoEncontradoError();
      const excluida = await organizacaoRepository.excluirSeVersaoAtualTx(tx, id, versao);
      if (!excluida) throw new ConflitoVersaoError();

      return {
        resultado: undefined,
        evento: {
          usuarioResponsavel,
          operacao: "EXCLUIR",
          entidade: `organizacoes/${id}`,
          dadosAntes: antes,
          dadosDepois: null,
        },
      };
    });
  },
};
