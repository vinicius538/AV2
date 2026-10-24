import {
  equipamentoRepository,
  type AtualizarEquipamentoDados,
} from "../repositories/equipamento.repository";
import { atualizarComVersao } from "./atualizar-com-versao.service";

export const equipamentoService = {
  atualizar(id: string, versao: number, dados: AtualizarEquipamentoDados) {
    return atualizarComVersao({
      buscar: () => equipamentoRepository.buscarPorId(id),
      atualizar: () => equipamentoRepository.atualizarSeVersaoAtual(id, versao, dados),
      recarregar: () => equipamentoRepository.buscarPorId(id),
    });
  },
};
