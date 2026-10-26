import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { usuarioRepository } from "../repositories/usuario.repository";
import { executarComJournal } from "./journal.service";
import { ConflitoVersaoError, RegistroNaoEncontradoError } from "./versao.errors";

function derivarHash(senha: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    scrypt(senha, salt, 64, (erro, chave) => {
      if (erro) return reject(erro);
      resolve(chave.toString("hex"));
    });
  });
}

async function criarCredenciais(senha: string) {
  const salt = randomBytes(16).toString("hex");
  return { salt, hashSenha: await derivarHash(senha, salt) };
}

export class UsuarioDuplicadoError extends Error {
  constructor() {
    super("Já existe um usuário com esse nome.");
    this.name = "UsuarioDuplicadoError";
  }
}

export const usuarioService = {
  listar() {
    return usuarioRepository.listar();
  },

  buscarPorId(id: string) {
    return usuarioRepository.buscarPorId(id);
  },

  contarAtivos() {
    return usuarioRepository.contarAtivos();
  },

  async identidade(id: string) {
    const usuario = await usuarioRepository.buscarPorId(id);
    if (!usuario || !usuario.ativo) return null;
    return { id: usuario.id, usuario: usuario.usuario, papel: usuario.papel };
  },

  async validarSessao(id: string) {
    const agora = new Date();
    const sessao = await usuarioRepository.buscarSessaoPorId(id);
    if (!sessao || !sessao.ativo || agora.getTime() - sessao.ultimoAcesso.getTime() > 30 * 60 * 1000) {
      return null;
    }
    const atualizada = await usuarioRepository.atualizarUltimoAcessoSeAtivo(id, agora);
    if (!atualizada) return null;
    return { id: sessao.id, usuario: sessao.usuario, papel: sessao.papel };
  },

  async autenticar(usuario: string, senha: string) {
    const credenciais = await usuarioRepository.buscarCredenciaisPorNome(usuario);
    if (!credenciais || !credenciais.ativo) return null;

    const hashCalculado = Buffer.from(await derivarHash(senha, credenciais.salt), "hex");
    const hashArmazenado = Buffer.from(credenciais.hashSenha, "hex");
    if (hashCalculado.length !== hashArmazenado.length || !timingSafeEqual(hashCalculado, hashArmazenado)) {
      return null;
    }

    await usuarioRepository.registrarAcesso(credenciais.id);
    return { id: credenciais.id, usuario: credenciais.usuario, papel: credenciais.papel };
  },

  async criar(dados: {
    usuario: string;
    senha: string;
    papel: "ADMINISTRADOR" | "OPERADOR_CADASTRO" | "GESTOR_ALMOXARIFADO" | "AUDITOR";
  }, usuarioResponsavel?: string) {
    const { senha, ...campos } = dados;
    const credenciais = await criarCredenciais(senha);
    return executarComJournal(async (tx) => {
      const duplicado = await usuarioRepository.buscarPorNomeTx(tx, dados.usuario);
      if (duplicado) throw new UsuarioDuplicadoError();
      const criado = await usuarioRepository.criarTx(tx, { ...campos, ...credenciais });
      return {
        resultado: criado,
        evento: {
          usuarioResponsavel: usuarioResponsavel ?? criado.id,
          operacao: "CRIAR",
          entidade: `usuarios/${criado.id}`,
          dadosDepois: criado,
        },
      };
    });
  },

  async atualizar(
    id: string,
    versao: number,
    dados: {
      usuario?: string;
      papel?: "ADMINISTRADOR" | "OPERADOR_CADASTRO" | "GESTOR_ALMOXARIFADO" | "AUDITOR";
      senha?: string;
    },
    usuarioResponsavel: string,
  ) {
    const { senha, ...campos } = dados;
    const credenciais = senha ? await criarCredenciais(senha) : {};
    return executarComJournal(async (tx) => {
      const antes = await usuarioRepository.buscarPorIdTx(tx, id);
      if (!antes || !antes.ativo) throw new RegistroNaoEncontradoError();

      if (dados.usuario) {
        const duplicado = await usuarioRepository.buscarPorNomeTx(tx, dados.usuario);
        if (duplicado && duplicado.id !== id) throw new UsuarioDuplicadoError();
      }

      const atualizado = await usuarioRepository.atualizarSeVersaoAtualTx(tx, id, versao, {
        ...campos,
        ...credenciais,
      });
      if (!atualizado) throw new ConflitoVersaoError();
      const depois = await usuarioRepository.buscarPorIdTx(tx, id);
      if (!depois) throw new RegistroNaoEncontradoError();

      return {
        resultado: depois,
        evento: {
          usuarioResponsavel,
          operacao: "ATUALIZAR",
          entidade: `usuarios/${id}`,
          dadosAntes: antes,
          dadosDepois: depois,
        },
      };
    });
  },

  async excluir(id: string, versao: number, usuarioResponsavel: string) {
    return executarComJournal(async (tx) => {
      const antes = await usuarioRepository.buscarPorIdTx(tx, id);
      if (!antes || !antes.ativo) throw new RegistroNaoEncontradoError();
      const inativado = await usuarioRepository.inativarSeVersaoAtualTx(tx, id, versao);
      if (!inativado) throw new ConflitoVersaoError();
      const depois = await usuarioRepository.buscarPorIdTx(tx, id);

      return {
        resultado: undefined,
        evento: {
          usuarioResponsavel,
          operacao: "INATIVAR",
          entidade: `usuarios/${id}`,
          dadosAntes: antes,
          dadosDepois: depois,
        },
      };
    });
  },
};
