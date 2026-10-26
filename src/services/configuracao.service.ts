import { configuracaoRepository, type DadosConfiguracao } from "../repositories/configuracao.repository";
import { executarComJournal } from "./journal.service";
import { ConflitoVersaoError } from "./versao.errors";
import { RegraDeNegocioError } from "./regras-de-negocio";

export const configuracaoService = {
  async buscar() {
    const existente = await configuracaoRepository.buscarGlobal();
    if (existente) return existente;
    return {
      id: "GLOBAL",
      aliquotaImposto: 0,
      coeficienteDepreciacao: 0,
      versao: 0,
      atualizadoEm: null,
    };
  },

  atualizar(versao: number, dados: DadosConfiguracao, usuarioResponsavel: string) {
    if (dados.aliquotaImposto !== undefined && (!Number.isFinite(dados.aliquotaImposto) || dados.aliquotaImposto < 0 || dados.aliquotaImposto > 100)) {
      throw new RegraDeNegocioError("A alíquota de imposto deve estar entre 0 e 100%.", "ALIQUOTA_INVALIDA");
    }
    if (dados.coeficienteDepreciacao !== undefined && (!Number.isFinite(dados.coeficienteDepreciacao) || dados.coeficienteDepreciacao < 0 || dados.coeficienteDepreciacao > 1)) {
      throw new RegraDeNegocioError("O coeficiente de depreciação deve estar entre 0 e 1.", "COEFICIENTE_DEPRECIACAO_INVALIDO");
    }

    return executarComJournal(async (tx) => {
      const antes = await configuracaoRepository.buscarGlobalTx(tx) ?? await configuracaoRepository.criarGlobalTx(tx);
      if (antes.versao !== versao) throw new ConflitoVersaoError();
      const atualizado = await configuracaoRepository.atualizarTx(tx, versao, dados);
      if (!atualizado) throw new ConflitoVersaoError();
      const depois = await configuracaoRepository.buscarGlobalTx(tx);
      if (!depois) throw new Error("A configuração global desapareceu durante a atualização.");
      return {
        resultado: depois,
        evento: {
          usuarioResponsavel,
          operacao: "ATUALIZAR",
          entidade: "configuracoes/GLOBAL",
          dadosAntes: antes,
          dadosDepois: depois,
        },
      };
    });
  },
};
