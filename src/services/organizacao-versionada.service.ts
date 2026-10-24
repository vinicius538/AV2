import {
  organizacaoRepository,
  type AtualizarOrganizacaoDados,
  type CriarOrganizacaoDados,
} from "../repositories/organizacao.repository";
import { atualizarComVersao } from "./atualizar-com-versao.service";
import { CnpjJaCadastradoError } from "./organizacao.service";

export const organizacaoVersionadaService = {
  async atualizar(id: string, versao: number, dados: AtualizarOrganizacaoDados) {
    if (dados.cnpj) {
      const comMesmoCnpj = await organizacaoRepository.buscarPorCnpj(dados.cnpj);
      if (comMesmoCnpj && comMesmoCnpj.id !== id) throw new CnpjJaCadastradoError();
    }

    return atualizarComVersao({
      buscar: () => organizacaoRepository.buscarPorId(id),
      atualizar: () => organizacaoRepository.atualizarSeVersaoAtual(id, versao, dados),
      recarregar: () => organizacaoRepository.buscarPorId(id),
    });
  },
};
