import { movimentacaoRepository } from "../repositories/movimentacao.repository";
import { executarComJournal } from "./journal.service";
import { RegistroNaoEncontradoError } from "./versao.errors";

export const movimentacaoService = {
  async listarPorEquipamento(equipamentoId: string) {
    if (!await movimentacaoRepository.equipamentoExiste(equipamentoId)) {
      throw new RegistroNaoEncontradoError();
    }
    return movimentacaoRepository.listarPorEquipamento(equipamentoId);
  },

  criar(
    equipamentoId: string,
    dados: { origem: string; destino: string; observacao?: string },
    responsavel: string,
    usuarioResponsavelId: string,
  ) {
    return executarComJournal(async (tx) => {
      const equipamento = await movimentacaoRepository.equipamentoExisteTx(tx, equipamentoId);
      if (!equipamento) throw new RegistroNaoEncontradoError();
      const movimentacao = await movimentacaoRepository.criarTx(tx, equipamentoId, {
        ...dados,
        responsavel,
      });
      return {
        resultado: movimentacao,
        evento: {
          usuarioResponsavel: usuarioResponsavelId,
          operacao: "CRIAR",
          entidade: `movimentacoes/${movimentacao.id}`,
          dadosDepois: movimentacao,
        },
      };
    });
  },
};
