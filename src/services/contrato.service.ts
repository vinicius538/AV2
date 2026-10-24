import { contratoRepository, type AtualizarContratoDados } from "../repositories/contrato.repository";
import { atualizarComVersao } from "./atualizar-com-versao.service";

export const contratoService = {
  atualizar(id: string, versao: number, dados: AtualizarContratoDados) {
    return atualizarComVersao({
      buscar: () => contratoRepository.buscarPorId(id),
      atualizar: () => contratoRepository.atualizarSeVersaoAtual(id, versao, dados),
      recarregar: () => contratoRepository.buscarPorId(id),
    });
  },
};
