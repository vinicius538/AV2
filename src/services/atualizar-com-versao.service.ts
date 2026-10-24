import { RegistroNaoEncontradoError, ConflitoVersaoError } from "./versao.errors";

export async function atualizarComVersao<T>(args: {
  buscar: () => Promise<T | null>;
  atualizar: () => Promise<boolean>;
  recarregar: () => Promise<T | null>;
}): Promise<T> {
  const existente = await args.buscar();
  if (!existente) throw new RegistroNaoEncontradoError();

  const atualizado = await args.atualizar();
  if (!atualizado) throw new ConflitoVersaoError();

  const registro = await args.recarregar();
  if (!registro) throw new RegistroNaoEncontradoError();
  return registro;
}
