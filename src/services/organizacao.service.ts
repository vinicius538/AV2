import {
  organizacaoRepository,
  type CriarOrganizacaoDados,
} from "../repositories/organizacao.repository";

export class CnpjJaCadastradoError extends Error {
  constructor() {
    super("Já existe uma organização cadastrada com este CNPJ.");
    this.name = "CnpjJaCadastradoError";
  }
}

export const organizacaoService = {
  async criar(dados: CriarOrganizacaoDados) {
    const organizacaoExistente = await organizacaoRepository.buscarPorCnpj(dados.cnpj);

    if (organizacaoExistente) {
      throw new CnpjJaCadastradoError();
    }

    return organizacaoRepository.criar(dados);
  },
};
