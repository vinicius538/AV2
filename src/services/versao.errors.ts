export class RegistroNaoEncontradoError extends Error {
  constructor() {
    super("Registro não encontrado.");
    this.name = "RegistroNaoEncontradoError";
  }
}

export class ConflitoVersaoError extends Error {
  constructor() {
    super("Este registro foi alterado por outra requisição. Recarregue os dados e tente novamente.");
    this.name = "ConflitoVersaoError";
  }
}
