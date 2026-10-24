import { loteRepository, type AtualizarLoteDados } from "../repositories/lote.repository";
import { atualizarComVersao } from "./atualizar-com-versao.service";

export const loteService = {
  atualizar(id: string, versao: number, dados: AtualizarLoteDados) {
    return atualizarComVersao({
      buscar: () => loteRepository.buscarPorId(id),
      atualizar: () => loteRepository.atualizarSeVersaoAtual(id, versao, dados),
      recarregar: () => loteRepository.buscarPorId(id),
    });
  },
};
