import { contratoRepository, type AtualizarContratoDados } from "../repositories/contrato.repository";
import { executarComJournal } from "./journal.service";
import { ConflitoVersaoError, RegistroNaoEncontradoError } from "./versao.errors";
import { RegraDeNegocioError, validarPeriodoContrato } from "./regras-de-negocio";

export const contratoService = {
  listar() {
    return contratoRepository.listar();
  },

  async criar(
    organizacaoId: string,
    dados: {
      dataAssinatura: Date;
      dataVencimento: Date;
      clausulas: object;
      valorMensal: number;
      renovacaoAutomatica?: boolean;
    },
    usuarioResponsavel: string,
  ) {
    validarPeriodoContrato(dados.dataAssinatura, dados.dataVencimento);
    if (!Number.isFinite(dados.valorMensal) || dados.valorMensal < 0) {
      throw new RegraDeNegocioError("O valor mensal do contrato deve ser um número não negativo.", "VALOR_CONTRATO_INVALIDO");
    }
    return executarComJournal(async (tx) => {
      const organizacao = await contratoRepository.organizacaoAtivaTx(tx, organizacaoId);
      if (!organizacao) throw new RegistroNaoEncontradoError();
      if (!organizacao.ativo) {
        throw new RegraDeNegocioError("Não é possível contratar com uma organização inativa.", "ORGANIZACAO_INATIVA");
      }
      const contrato = await contratoRepository.criarTx(tx, organizacaoId, dados);
      return {
        resultado: contrato,
        evento: {
          usuarioResponsavel,
          operacao: "CRIAR",
          entidade: `contratos/${contrato.id}`,
          dadosDepois: contrato,
        },
      };
    });
  },

  atualizar(id: string, versao: number, dados: AtualizarContratoDados, usuarioResponsavel: string) {
    return executarComJournal(async (tx) => {
      const antes = await contratoRepository.buscarPorIdTx(tx, id);
      if (!antes) throw new RegistroNaoEncontradoError();
      validarPeriodoContrato(dados.dataAssinatura ?? antes.dataAssinatura, dados.dataVencimento ?? antes.dataVencimento);
      if (dados.valorMensal !== undefined && (!Number.isFinite(dados.valorMensal) || dados.valorMensal < 0)) {
        throw new RegraDeNegocioError("O valor mensal do contrato deve ser um número não negativo.", "VALOR_CONTRATO_INVALIDO");
      }
      const atualizado = await contratoRepository.atualizarSeVersaoAtualTx(tx, id, versao, dados);
      if (!atualizado) throw new ConflitoVersaoError();
      const depois = await contratoRepository.buscarPorIdTx(tx, id);
      if (!depois) throw new RegistroNaoEncontradoError();
      return {
        resultado: depois,
        evento: {
          usuarioResponsavel,
          operacao: "ATUALIZAR",
          entidade: `contratos/${id}`,
          dadosAntes: antes,
          dadosDepois: depois,
        },
      };
    });
  },

  excluir(id: string, versao: number, usuarioResponsavel: string) {
    return executarComJournal(async (tx) => {
      const antes = await contratoRepository.buscarPorIdTx(tx, id);
      if (!antes) throw new RegistroNaoEncontradoError();
      const excluido = await contratoRepository.excluirSeVersaoAtualTx(tx, id, versao);
      if (!excluido) throw new ConflitoVersaoError();
      return {
        resultado: undefined,
        evento: {
          usuarioResponsavel,
          operacao: "EXCLUIR",
          entidade: `contratos/${id}`,
          dadosAntes: antes,
          dadosDepois: null,
        },
      };
    });
  },
};
