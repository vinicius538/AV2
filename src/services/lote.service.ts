import { loteRepository, type AtualizarLoteDados } from "../repositories/lote.repository";
import { executarComJournal } from "./journal.service";
import { ConflitoVersaoError, RegistroNaoEncontradoError } from "./versao.errors";
import { RegraDeNegocioError, validarDataEntradaLote } from "./regras-de-negocio";

export const loteService = {
  listar() {
    return loteRepository.listar();
  },

  async criar(
    organizacaoId: string,
    dados: {
      dataEntrada: Date;
      notaFiscal: string;
      transportadora: string;
      statusProcessamento?: "RECEBIDO" | "EM_TRIAGEM" | "TRIAGEM_CONCLUIDA";
      observacoes?: string;
    },
    usuarioResponsavel: string,
  ) {
    validarDataEntradaLote(dados.dataEntrada);
    return executarComJournal(async (tx) => {
      const organizacao = await loteRepository.organizacaoAtivaTx(tx, organizacaoId);
      if (!organizacao) throw new RegistroNaoEncontradoError();
      if (!organizacao.ativo) {
        throw new RegraDeNegocioError("Não é possível receber lote de uma organização inativa.", "ORGANIZACAO_INATIVA");
      }
      const lote = await loteRepository.criarTx(tx, organizacaoId, dados);
      return {
        resultado: lote,
        evento: {
          usuarioResponsavel,
          operacao: "CRIAR",
          entidade: `lotes/${lote.id}`,
          dadosDepois: lote,
        },
      };
    });
  },

  atualizar(id: string, versao: number, dados: AtualizarLoteDados, usuarioResponsavel: string) {
    return executarComJournal(async (tx) => {
      const antes = await loteRepository.buscarPorIdTx(tx, id);
      if (!antes) throw new RegistroNaoEncontradoError();
      if (dados.dataEntrada) validarDataEntradaLote(dados.dataEntrada);
      const atualizado = await loteRepository.atualizarSeVersaoAtualTx(tx, id, versao, dados);
      if (!atualizado) throw new ConflitoVersaoError();
      const depois = await loteRepository.buscarPorIdTx(tx, id);
      if (!depois) throw new RegistroNaoEncontradoError();
      return {
        resultado: depois,
        evento: {
          usuarioResponsavel,
          operacao: "ATUALIZAR",
          entidade: `lotes/${id}`,
          dadosAntes: antes,
          dadosDepois: depois,
        },
      };
    });
  },

  excluir(id: string, versao: number, usuarioResponsavel: string) {
    return executarComJournal(async (tx) => {
      const antes = await loteRepository.buscarPorIdTx(tx, id);
      if (!antes) throw new RegistroNaoEncontradoError();
      const excluido = await loteRepository.excluirSeVersaoAtualTx(tx, id, versao);
      if (!excluido) throw new ConflitoVersaoError();
      return {
        resultado: undefined,
        evento: {
          usuarioResponsavel,
          operacao: "EXCLUIR",
          entidade: `lotes/${id}`,
          dadosAntes: antes,
          dadosDepois: null,
        },
      };
    });
  },
};
