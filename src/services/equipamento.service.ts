import {
  equipamentoRepository,
  type AtualizarEquipamentoDados,
} from "../repositories/equipamento.repository";
import { executarComJournal } from "./journal.service";
import { ConflitoVersaoError, RegistroNaoEncontradoError } from "./versao.errors";
import {
  exigirTriagemParaDesmonte,
  exigeJustificativaDeEstado,
  RegraDeNegocioError,
} from "./regras-de-negocio";

export class CodigoBarrasDuplicadoError extends Error {
  constructor() {
    super("Já existe um equipamento com esse código de barras interno.");
    this.name = "CodigoBarrasDuplicadoError";
  }
}

export const equipamentoService = {
  listar() {
    return equipamentoRepository.listar();
  },

  async criar(
    loteId: string,
    dados: {
      codigoBarrasInterno: string;
      tipo: "COMPUTADOR" | "NOTEBOOK" | "MONITOR" | "OUTRO";
      marca: string;
      modelo: string;
      anoFabricacao: number;
      estadoFisico: "NOVO" | "BOM" | "REGULAR" | "RUIM" | "INSERVIVEL";
      pesoQuilogramas: number;
      precoMercado: number;
      statusRastreamento: "RECEBIDO" | "EM_TRIAGEM" | "DISPONIVEL" | "EM_DESMONTE" | "DESCARTADO";
      triagemCompleta?: boolean;
      etiqueta?: string;
    },
    usuarioResponsavel: string,
  ) {
    exigirTriagemParaDesmonte(dados.statusRastreamento, dados.triagemCompleta ?? false);
    if (dados.pesoQuilogramas < 0 || dados.precoMercado < 0) {
      throw new RegraDeNegocioError("Peso e preço não podem ser negativos.", "VALOR_EQUIPAMENTO_INVALIDO");
    }
    return executarComJournal(async (tx) => {
      const lote = await equipamentoRepository.loteAtivoTx(tx, loteId);
      if (!lote) throw new RegistroNaoEncontradoError();
      if (!lote.organizacao.ativo) {
        throw new RegraDeNegocioError("Não é possível incluir equipamento em lote de organização inativa.", "ORGANIZACAO_INATIVA");
      }
      if (await equipamentoRepository.buscarPorCodigoTx(tx, dados.codigoBarrasInterno)) {
        throw new CodigoBarrasDuplicadoError();
      }
      const equipamento = await equipamentoRepository.criarTx(tx, loteId, dados);
      return {
        resultado: equipamento,
        evento: {
          usuarioResponsavel,
          operacao: "CRIAR",
          entidade: `equipamentos/${equipamento.id}`,
          dadosDepois: equipamento,
        },
      };
    });
  },

  atualizar(id: string, versao: number, dados: AtualizarEquipamentoDados & { justificativa?: string }, usuarioResponsavel: string) {
    return executarComJournal(async (tx) => {
      const antes = await equipamentoRepository.buscarPorIdTx(tx, id);
      if (!antes) throw new RegistroNaoEncontradoError();
      const { justificativa, ...dadosEquipamento } = dados;
      const novoEstado = dadosEquipamento.estadoFisico ?? antes.estadoFisico;
      const quedaRequerJustificativa =
        novoEstado !== antes.estadoFisico && exigeJustificativaDeEstado(antes.estadoFisico, novoEstado, justificativa);
      const triagemCompletaDepois = dadosEquipamento.triagemCompleta ?? antes.triagemCompleta;
      exigirTriagemParaDesmonte(
        dadosEquipamento.statusRastreamento ?? antes.statusRastreamento,
        antes.triagemCompleta && triagemCompletaDepois,
      );
      if (dadosEquipamento.pesoQuilogramas !== undefined && dadosEquipamento.pesoQuilogramas < 0) {
        throw new RegraDeNegocioError("O peso do equipamento não pode ser negativo.", "PESO_EQUIPAMENTO_INVALIDO");
      }
      if (dadosEquipamento.precoMercado !== undefined && dadosEquipamento.precoMercado < 0) {
        throw new RegraDeNegocioError("O preço de mercado não pode ser negativo.", "PRECO_EQUIPAMENTO_INVALIDO");
      }
      if (dadosEquipamento.codigoBarrasInterno) {
        const equipamentoMesmoCodigo = await equipamentoRepository.buscarPorCodigoTx(tx, dadosEquipamento.codigoBarrasInterno);
        if (equipamentoMesmoCodigo && equipamentoMesmoCodigo.id !== id) throw new CodigoBarrasDuplicadoError();
      }
      const atualizado = await equipamentoRepository.atualizarSeVersaoAtualTx(tx, id, versao, dadosEquipamento);
      if (!atualizado) throw new ConflitoVersaoError();
      const depois = await equipamentoRepository.buscarPorIdTx(tx, id);
      if (!depois) throw new RegistroNaoEncontradoError();
      return {
        resultado: depois,
        evento: {
          usuarioResponsavel,
          operacao: "ATUALIZAR",
          entidade: `equipamentos/${id}`,
          dadosAntes: antes,
          dadosDepois: quedaRequerJustificativa ? { ...depois, justificativaEstadoFisico: justificativa?.trim() } : depois,
        },
      };
    });
  },

  excluir(id: string, versao: number, usuarioResponsavel: string) {
    return executarComJournal(async (tx) => {
      const antes = await equipamentoRepository.buscarPorIdTx(tx, id);
      if (!antes) throw new RegistroNaoEncontradoError();
      const excluido = await equipamentoRepository.excluirSeVersaoAtualTx(tx, id, versao);
      if (!excluido) throw new ConflitoVersaoError();
      return {
        resultado: undefined,
        evento: {
          usuarioResponsavel,
          operacao: "EXCLUIR",
          entidade: `equipamentos/${id}`,
          dadosAntes: antes,
          dadosDepois: null,
        },
      };
    });
  },
};
