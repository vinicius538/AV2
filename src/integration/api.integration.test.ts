import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import type { LightMyRequestResponse } from "fastify";

process.env.JWT_SECRET ??= randomUUID() + randomUUID();

const { criarApp } = await import("../../app");
const { prisma } = await import("../lib/db");

const prefixo = `av2it-${randomUUID().slice(0, 8)}`;
const senhaTeste = `Teste-${randomUUID()}-A1!`;
const usuariosTeste = [
  { usuario: `${prefixo}-cadastro`, senha: "TesteSeguro123!", papel: "OPERADOR_CADASTRO" },
  { usuario: `${prefixo}-almox`, senha: "TesteSeguro123!", papel: "GESTOR_ALMOXARIFADO" },
  { usuario: `${prefixo}-auditor`, senha: "TesteSeguro123!", papel: "AUDITOR" },
] as const;

function calcularDigitoCnpj(base: string, pesos: number[]) {
  const soma = [...base].reduce((total, digito, indice) => total + Number(digito) * pesos[indice], 0);
  const resto = soma % 11;
  return String(resto < 2 ? 0 : 11 - resto);
}

function gerarCnpjTeste() {
  const base = randomUUID().replace(/\D/g, "").padEnd(12, "0").slice(0, 12);
  const primeiro = calcularDigitoCnpj(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const baseComPrimeiro = `${base}${primeiro}`;
  const segundo = calcularDigitoCnpj(baseComPrimeiro, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const cnpj = `${base}${primeiro}${segundo}`;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

const cnpjTeste = gerarCnpjTeste();
const organizacaoBody = {
  razaoSocial: `GreenCode Integração ${prefixo}`,
  cnpj: cnpjTeste,
  enderecoCompleto: "Rua de Testes, 100 - São Paulo/SP",
  telefone: "11999990000",
  email: "integracao@greencode.test",
};

const app = criarApp({ logger: false });
let inicializado = false;
let conectado = false;
let organizacaoTesteId = "";
const entidadesJournalTeste = new Set<string>();

async function limparDadosDeTeste() {
  const usuarios = await prisma.usuario.findMany({
    where: { usuario: { startsWith: prefixo } },
    select: { id: true },
  });
  const usuarioIds = usuarios.map(({ id }) => id);
  const organizacao = organizacaoTesteId
    ? await prisma.organizacao.findUnique({ where: { id: organizacaoTesteId }, select: { id: true } })
    : null;
  const lotes = organizacao
    ? await prisma.lote.findMany({ where: { organizacaoId: organizacao.id }, select: { id: true } })
    : [];
  const loteIds = lotes.map(({ id }) => id);
  const equipamentos = loteIds.length
    ? await prisma.equipamento.findMany({ where: { loteId: { in: loteIds } }, select: { id: true } })
    : [];
  const equipamentoIds = equipamentos.map(({ id }) => id);

  if (equipamentoIds.length) {
    await prisma.movimentacao.deleteMany({ where: { equipamentoId: { in: equipamentoIds } } });
  }
  const filtrosJournal = [
    ...(usuarioIds.length ? [{ usuarioResponsavel: { in: usuarioIds } }] : []),
    ...(entidadesJournalTeste.size ? [{ entidade: { in: [...entidadesJournalTeste] } }] : []),
  ];
  if (filtrosJournal.length) {
    await prisma.journalTransacao.deleteMany({ where: { OR: filtrosJournal } });
  }
  if (equipamentoIds.length) {
    await prisma.equipamento.deleteMany({ where: { id: { in: equipamentoIds } } });
  }
  if (organizacao) {
    await prisma.contrato.deleteMany({ where: { organizacaoId: organizacao.id } });
  }
  if (loteIds.length) {
    await prisma.lote.deleteMany({ where: { id: { in: loteIds } } });
  }
  if (organizacao) {
    await prisma.organizacao.delete({ where: { id: organizacao.id } });
  }
  if (usuarioIds.length) {
    await prisma.usuario.deleteMany({ where: { id: { in: usuarioIds } } });
  }
}

async function request(method: string, url: string, token?: string, payload?: unknown): Promise<LightMyRequestResponse> {
  return await app.inject({
    method,
    url,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(payload === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(payload === undefined ? {} : { payload: JSON.stringify(payload) }),
  }) as unknown as LightMyRequestResponse;
}

async function login(usuario: string, senha: string) {
  const response = await request("POST", "/auth/login", undefined, { usuario, senha });
  assert.equal(response.statusCode, 200, `login de ${usuario}: ${response.body}`);
  return response.json<{ accessToken: string; usuario: { papel: string } }>();
}

test("jornada HTTP completa, CRUDs e permissões por papel", async (t) => {
  await prisma.$connect();
  conectado = true;
  const usuariosAtivos = await prisma.usuario.count({ where: { ativo: true } });
  await app.ready();
  inicializado = true;

  await t.test("exige autenticação nas rotas protegidas", async () => {
    const resposta = await request("GET", "/organizacoes");
    assert.equal(resposta.statusCode, 401);
  });

  let adminToken = "";
  await t.test("autentica o administrador disponível e prepara os papéis de teste", async () => {
    if (usuariosAtivos === 0) {
      const primeiroAdmin = { usuario: `${prefixo}-admin`, senha: senhaTeste, papel: "ADMINISTRADOR" };
      const bootstrap = await request("POST", "/usuarios", undefined, primeiroAdmin);
      assert.equal(bootstrap.statusCode, 201, bootstrap.body);
      adminToken = (await login(primeiroAdmin.usuario, primeiroAdmin.senha)).accessToken;
      entidadesJournalTeste.add(`usuarios/${bootstrap.json<{ id: string }>().id}`);
    } else {
      const adminUsuario = process.env.AV2_TEST_ADMIN_USER ?? process.env.SEED_ADMIN_USER;
      const adminSenha = process.env.AV2_TEST_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;
      assert.ok(adminUsuario && adminSenha,
        "Com usuários ativos no banco, defina AV2_TEST_ADMIN_USER e AV2_TEST_ADMIN_PASSWORD (ou SEED_ADMIN_USER/SEED_ADMIN_PASSWORD) para a suíte autenticar sem alterar contas existentes.");
      const autenticado = await login(adminUsuario, adminSenha);
      assert.equal(autenticado.usuario.papel, "ADMINISTRADOR", "As credenciais de teste precisam pertencer a um administrador.");
      adminToken = autenticado.accessToken;
      const semAutenticacao = await request("POST", "/usuarios", undefined, {
        usuario: `${prefixo}-nao-autorizado`, senha: senhaTeste, papel: "OPERADOR_CADASTRO",
      });
      assert.equal(semAutenticacao.statusCode, 401);
    }

    for (const usuario of usuariosTeste) {
      const resposta = await request("POST", "/usuarios", adminToken, usuario);
      assert.equal(resposta.statusCode, 201, resposta.body);
      entidadesJournalTeste.add(`usuarios/${resposta.json<{ id: string }>().id}`);
    }
  });

  const tokens = new Map<string, string>();
  await t.test("faz login para cada papel", async () => {
    tokens.set("ADMINISTRADOR", adminToken);
    for (const usuario of usuariosTeste) {
      tokens.set(usuario.papel, (await login(usuario.usuario, usuario.senha)).accessToken);
    }
    const loginInvalido = await request("POST", "/auth/login", undefined, {
      usuario: usuariosTeste[0].usuario,
      senha: "senha-errada",
    });
    assert.equal(loginInvalido.statusCode, 401);
  });

  const token = (papel: string) => {
    const result = tokens.get(papel);
    assert.ok(result, `token ausente para ${papel}`);
    return result;
  };

  let organizacaoId = "";
  await t.test("permite consulta aos papéis previstos e restringe criação de organização", async () => {
    for (const papel of ["ADMINISTRADOR", "OPERADOR_CADASTRO", "AUDITOR"]) {
      const leitura = await request("GET", "/organizacoes", token(papel));
      assert.equal(leitura.statusCode, 200, `${papel}: ${leitura.body}`);
    }
    const gestorBloqueado = await request("POST", "/organizacoes", token("GESTOR_ALMOXARIFADO"), organizacaoBody);
    assert.equal(gestorBloqueado.statusCode, 403);
    const auditorBloqueado = await request("POST", "/organizacoes", token("AUDITOR"), organizacaoBody);
    assert.equal(auditorBloqueado.statusCode, 403);

    const criada = await request("POST", "/organizacoes", token("OPERADOR_CADASTRO"), organizacaoBody);
    assert.equal(criada.statusCode, 201, criada.body);
    organizacaoId = criada.json<{ id: string }>().id;
    organizacaoTesteId = organizacaoId;
    entidadesJournalTeste.add(`organizacoes/${organizacaoId}`);

    const atualizarSemPermissao = await request("PATCH", `/organizacoes/${organizacaoId}`, token("OPERADOR_CADASTRO"), {
      versao: 0,
      telefone: "11999990001",
    });
    assert.equal(atualizarSemPermissao.statusCode, 403);

    const atualizarComoAdmin = await request("PATCH", `/organizacoes/${organizacaoId}`, token("ADMINISTRADOR"), {
      versao: 0,
      telefone: "11999990002",
    });
    assert.equal(atualizarComoAdmin.statusCode, 200, atualizarComoAdmin.body);
  });

  let contratoId = "";
  await t.test("cadastra, consulta, atualiza e exclui contrato; valida permissão", async () => {
    const body = {
      dataAssinatura: "2026-01-01T12:00:00.000Z",
      dataVencimento: "2027-01-01T12:00:00.000Z",
      clausulas: { coleta: "mensal" },
      valorMensal: 1250,
      renovacaoAutomatica: false,
    };
    const bloqueado = await request("POST", `/organizacoes/${organizacaoId}/contratos`, token("GESTOR_ALMOXARIFADO"), body);
    assert.equal(bloqueado.statusCode, 403);
    const criado = await request("POST", `/organizacoes/${organizacaoId}/contratos`, token("OPERADOR_CADASTRO"), body);
    assert.equal(criado.statusCode, 201, criado.body);
    contratoId = criado.json<{ id: string }>().id;
    entidadesJournalTeste.add(`contratos/${contratoId}`);

    const leitura = await request("GET", `/contratos/${contratoId}`, token("AUDITOR"));
    assert.equal(leitura.statusCode, 200, leitura.body);
    const negado = await request("PATCH", `/contratos/${contratoId}`, token("OPERADOR_CADASTRO"), { versao: 0, valorMensal: 1300 });
    assert.equal(negado.statusCode, 403);

    const atualizado = await request("PATCH", `/contratos/${contratoId}`, token("ADMINISTRADOR"), { versao: 0, valorMensal: 1300 });
    assert.equal(atualizado.statusCode, 200, atualizado.body);
    const conflito = await request("PATCH", `/contratos/${contratoId}`, token("ADMINISTRADOR"), { versao: 0, valorMensal: 1400 });
    assert.equal(conflito.statusCode, 409);
    assert.equal(conflito.json<{ codigo: string }>().codigo, "CONFLITO_VERSAO");

    const removido = await request("DELETE", `/contratos/${contratoId}?versao=1`, token("ADMINISTRADOR"));
    assert.equal(removido.statusCode, 204);
    contratoId = "";
  });

  let loteId = "";
  await t.test("cria, consulta e atualiza lote; restringe as operações por papel", async () => {
    const body = {
      dataEntrada: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      notaFiscal: "NF-INTEGRACAO-001",
      transportadora: "Transportadora Teste",
    };
    const bloqueado = await request("POST", `/organizacoes/${organizacaoId}/lotes`, token("OPERADOR_CADASTRO"), body);
    assert.equal(bloqueado.statusCode, 403);
    const criado = await request("POST", `/organizacoes/${organizacaoId}/lotes`, token("GESTOR_ALMOXARIFADO"), body);
    assert.equal(criado.statusCode, 201, criado.body);
    loteId = criado.json<{ id: string }>().id;
    entidadesJournalTeste.add(`lotes/${loteId}`);

    const leitura = await request("GET", `/lotes/${loteId}`, token("AUDITOR"));
    assert.equal(leitura.statusCode, 200, leitura.body);
    const atualizado = await request("PATCH", `/lotes/${loteId}`, token("GESTOR_ALMOXARIFADO"), {
      versao: 0,
      notaFiscal: "NF-INTEGRACAO-002",
    });
    assert.equal(atualizado.statusCode, 200, atualizado.body);
  });

  let equipamentoId = "";
  await t.test("cria, atualiza e rastreia equipamento em movimentações", async () => {
    const body = {
      codigoBarrasInterno: `${prefixo}-EQ-001`,
      tipo: "NOTEBOOK",
      marca: "Marca Teste",
      modelo: "Modelo Integração",
      anoFabricacao: 2022,
      estadoFisico: "BOM",
      pesoQuilogramas: 2.1,
      precoMercado: 2500,
      statusRastreamento: "DISPONIVEL",
      triagemCompleta: true,
      etiqueta: "ETQ-TESTE-001",
    };
    const bloqueado = await request("POST", `/lotes/${loteId}/equipamentos`, token("AUDITOR"), body);
    assert.equal(bloqueado.statusCode, 403);
    const criado = await request("POST", `/lotes/${loteId}/equipamentos`, token("GESTOR_ALMOXARIFADO"), body);
    assert.equal(criado.statusCode, 201, criado.body);
    equipamentoId = criado.json<{ id: string }>().id;
    entidadesJournalTeste.add(`equipamentos/${equipamentoId}`);

    const leitura = await request("GET", `/equipamentos/${equipamentoId}`, token("AUDITOR"));
    assert.equal(leitura.statusCode, 200, leitura.body);
    const atualizado = await request("PATCH", `/equipamentos/${equipamentoId}`, token("GESTOR_ALMOXARIFADO"), {
      versao: 0,
      precoMercado: 2400,
    });
    assert.equal(atualizado.statusCode, 200, atualizado.body);

    for (const [origem, destino] of [["Recebimento", "Triagem"], ["Triagem", "Estoque"]]) {
      const movimento = await request("POST", `/equipamentos/${equipamentoId}/movimentacoes`, token("GESTOR_ALMOXARIFADO"), {
        origem,
        destino,
        observacao: "Movimentação de teste de integração",
      });
      assert.equal(movimento.statusCode, 201, movimento.body);
    }
    const historico = await request("GET", `/equipamentos/${equipamentoId}/movimentacoes`, token("AUDITOR"));
    assert.equal(historico.statusCode, 200, historico.body);
    assert.equal(historico.json<unknown[]>().length, 2);

    const journal = await request("GET", "/journal?limite=100", token("AUDITOR"));
    assert.equal(journal.statusCode, 200, journal.body);
    assert.ok(journal.json<unknown[]>().length > 0);
    const journalNegado = await request("GET", "/journal", token("GESTOR_ALMOXARIFADO"));
    assert.equal(journalNegado.statusCode, 403);
  });

  await t.test("mantém integridade ao impedir exclusão com vínculos e permite excluir registros livres", async () => {
    const equipamentoProtegido = await request("DELETE", `/equipamentos/${equipamentoId}?versao=1`, token("GESTOR_ALMOXARIFADO"));
    assert.equal(equipamentoProtegido.statusCode, 409);

    const loteProtegido = await request("DELETE", `/lotes/${loteId}?versao=1`, token("GESTOR_ALMOXARIFADO"));
    assert.equal(loteProtegido.statusCode, 409);

    const loteLivreResposta = await request("POST", `/organizacoes/${organizacaoId}/lotes`, token("GESTOR_ALMOXARIFADO"), {
      dataEntrada: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      notaFiscal: "NF-INTEGRACAO-LIVRE",
      transportadora: "Transportadora Teste",
    });
    assert.equal(loteLivreResposta.statusCode, 201, loteLivreResposta.body);
    const loteLivre = loteLivreResposta.json<{ id: string }>();
    entidadesJournalTeste.add(`lotes/${loteLivre.id}`);
    const loteRemovido = await request("DELETE", `/lotes/${loteLivre.id}?versao=0`, token("GESTOR_ALMOXARIFADO"));
    assert.equal(loteRemovido.statusCode, 204);

    const equipamentoLivreResposta = await request("POST", `/lotes/${loteId}/equipamentos`, token("GESTOR_ALMOXARIFADO"), {
      codigoBarrasInterno: `${prefixo}-EQ-LIVRE`,
      tipo: "MONITOR",
      marca: "Marca Teste",
      modelo: "Monitor Livre",
      anoFabricacao: 2021,
      estadoFisico: "REGULAR",
      pesoQuilogramas: 3,
      precoMercado: 500,
      statusRastreamento: "RECEBIDO",
    });
    assert.equal(equipamentoLivreResposta.statusCode, 201, equipamentoLivreResposta.body);
    const equipamentoLivre = equipamentoLivreResposta.json<{ id: string }>();
    entidadesJournalTeste.add(`equipamentos/${equipamentoLivre.id}`);
    const equipamentoRemovido = await request(
      "DELETE",
      `/equipamentos/${equipamentoLivre.id}?versao=0`,
      token("GESTOR_ALMOXARIFADO"),
    );
    assert.equal(equipamentoRemovido.statusCode, 204);

    const organizacaoProtegida = await request(
      "DELETE",
      `/organizacoes/${organizacaoId}?versao=1`,
      token("ADMINISTRADOR"),
    );
    assert.equal(organizacaoProtegida.statusCode, 409);
  });
});

after(async () => {
  if (conectado) {
    try {
      if (inicializado) await limparDadosDeTeste();
    } finally {
      if (inicializado) await app.close();
      await prisma.$disconnect();
    }
  }
});
