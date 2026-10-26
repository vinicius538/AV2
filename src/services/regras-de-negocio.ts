export class RegraDeNegocioError extends Error {
  constructor(message: string, readonly codigo: string) {
    super(message);
    this.name = "RegraDeNegocioError";
  }
}

export function normalizarEValidarCnpj(entrada: string): string {
  const cnpj = entrada.toUpperCase().replace(/[.\/-]/g, "");
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj) || /^([A-Z0-9])\1{11}\d{2}$/.test(cnpj)) {
    throw new RegraDeNegocioError("CNPJ inválido: informe 12 caracteres alfanuméricos e 2 dígitos verificadores.", "CNPJ_INVALIDO");
  }

  const calcularDigito = (base: string): string => {
    let soma = 0;
    let peso = 2;
    for (let indice = base.length - 1; indice >= 0; indice -= 1) {
      soma += (base.charCodeAt(indice) - 48) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  };

  const primeiro = calcularDigito(cnpj.slice(0, 12));
  const segundo = calcularDigito(`${cnpj.slice(0, 12)}${primeiro}`);
  if (cnpj.slice(-2) !== `${primeiro}${segundo}`) {
    throw new RegraDeNegocioError("CNPJ inválido: os dígitos verificadores não conferem.", "CNPJ_INVALIDO");
  }
  return cnpj;
}

export function validarDataEntradaLote(dataEntrada: Date): void {
  const agora = Date.now();
  const limiteInferior = agora - 90 * 24 * 60 * 60 * 1000;
  const timestamp = dataEntrada.getTime();
  if (!Number.isFinite(timestamp) || timestamp > agora || timestamp < limiteInferior) {
    throw new RegraDeNegocioError(
      "A data de entrada do lote não pode estar no futuro nem ser anterior a 90 dias.",
      "DATA_ENTRADA_FORA_DO_PERIODO",
    );
  }
}

const nivelEstadoFisico: Record<"NOVO" | "BOM" | "REGULAR" | "RUIM" | "INSERVIVEL", number> = {
  NOVO: 4,
  BOM: 3,
  REGULAR: 2,
  RUIM: 1,
  INSERVIVEL: 0,
};

export function exigeJustificativaDeEstado(
  anterior: keyof typeof nivelEstadoFisico,
  novo: keyof typeof nivelEstadoFisico,
  justificativa?: string,
): boolean {
  const queda = nivelEstadoFisico[anterior] - nivelEstadoFisico[novo];
  if (queda >= 2 && !justificativa?.trim()) {
    throw new RegraDeNegocioError(
      "Informe uma justificativa ao reduzir o estado físico em duas ou mais categorias.",
      "JUSTIFICATIVA_ESTADO_OBRIGATORIA",
    );
  }
  return queda >= 2;
}

export function exigirTriagemParaDesmonte(
  status: "RECEBIDO" | "EM_TRIAGEM" | "DISPONIVEL" | "EM_DESMONTE" | "DESCARTADO",
  triagemCompleta: boolean,
): void {
  if (status === "EM_DESMONTE" && !triagemCompleta) {
    throw new RegraDeNegocioError(
      "O equipamento só pode ir para desmonte depois que a triagem estiver concluída.",
      "TRIAGEM_INCOMPLETA",
    );
  }
}

export function validarPeriodoContrato(dataAssinatura: Date, dataVencimento: Date): void {
  if (!Number.isFinite(dataAssinatura.getTime()) || !Number.isFinite(dataVencimento.getTime())) {
    throw new RegraDeNegocioError("As datas do contrato são inválidas.", "DATAS_CONTRATO_INVALIDAS");
  }
  if (dataVencimento < dataAssinatura) {
    throw new RegraDeNegocioError(
      "A data de vencimento do contrato não pode ser anterior à data de assinatura.",
      "PERIODO_CONTRATO_INVALIDO",
    );
  }
}
