-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMINISTRADOR', 'OPERADOR');

-- CreateEnum
CREATE TYPE "EstadoFisico" AS ENUM ('NOVO', 'BOM', 'REGULAR', 'RUIM', 'INSERVIVEL');

-- CreateEnum
CREATE TYPE "StatusRastreamento" AS ENUM ('RECEBIDO', 'EM_TRIAGEM', 'DISPONIVEL', 'EM_DESMONTE', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "StatusLote" AS ENUM ('RECEBIDO', 'EM_TRIAGEM', 'TRIAGEM_CONCLUIDA');

-- CreateEnum
CREATE TYPE "TipoEquipamento" AS ENUM ('COMPUTADOR', 'NOTEBOOK', 'MONITOR', 'OUTRO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" VARCHAR(36) NOT NULL,
    "usuario" VARCHAR(100) NOT NULL,
    "hash_senha" VARCHAR(255) NOT NULL,
    "salt" VARCHAR(255) NOT NULL,
    "ultimo_acesso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "papel" "PapelUsuario" NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizacoes" (
    "id" VARCHAR(36) NOT NULL,
    "razao_social" VARCHAR(200) NOT NULL,
    "cnpj" VARCHAR(18) NOT NULL,
    "inscricao_estadual" VARCHAR(30),
    "endereco_completo" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "organizacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" VARCHAR(36) NOT NULL,
    "data_assinatura" TIMESTAMP(3) NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "clausulas" JSONB NOT NULL,
    "valor_mensal" DECIMAL(12,2) NOT NULL,
    "renovacao_automatica" BOOLEAN NOT NULL DEFAULT false,
    "organizacao_id" VARCHAR(36) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" VARCHAR(36) NOT NULL,
    "data_entrada" TIMESTAMP(3) NOT NULL,
    "nota_fiscal" VARCHAR(100) NOT NULL,
    "transportadora" VARCHAR(150) NOT NULL,
    "status_processamento" "StatusLote" NOT NULL DEFAULT 'RECEBIDO',
    "observacoes" TEXT,
    "organizacao_id" VARCHAR(36) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" VARCHAR(36) NOT NULL,
    "codigo_barras_interno" VARCHAR(100) NOT NULL,
    "tipo" "TipoEquipamento" NOT NULL,
    "marca" VARCHAR(100) NOT NULL,
    "modelo" VARCHAR(100) NOT NULL,
    "ano_fabricacao" INTEGER NOT NULL,
    "estado_fisico" "EstadoFisico" NOT NULL,
    "peso_quilogramas" DECIMAL(10,3) NOT NULL,
    "preco_mercado" DECIMAL(12,2) NOT NULL,
    "status_rastreamento" "StatusRastreamento" NOT NULL,
    "triagem_completa" BOOLEAN NOT NULL DEFAULT false,
    "etiqueta" VARCHAR(100) NOT NULL DEFAULT '',
    "lote_id" VARCHAR(36) NOT NULL,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes" (
    "id" VARCHAR(36) NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origem" VARCHAR(150) NOT NULL,
    "destino" VARCHAR(150) NOT NULL,
    "responsavel" VARCHAR(150) NOT NULL,
    "observacao" TEXT,
    "equipamento_id" VARCHAR(36) NOT NULL,

    CONSTRAINT "movimentacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_transacoes" (
    "id" VARCHAR(36) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operacao" VARCHAR(50) NOT NULL,
    "entidade" VARCHAR(100) NOT NULL,
    "dados_antes" JSONB,
    "dados_depois" JSONB,
    "usuario_responsavel" VARCHAR(36) NOT NULL,

    CONSTRAINT "journal_transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "organizacoes_cnpj_key" ON "organizacoes"("cnpj");

-- CreateIndex
CREATE INDEX "contratos_organizacao_id_idx" ON "contratos"("organizacao_id");

-- CreateIndex
CREATE INDEX "lotes_organizacao_id_idx" ON "lotes"("organizacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_codigo_barras_interno_key" ON "equipamentos"("codigo_barras_interno");

-- CreateIndex
CREATE INDEX "equipamentos_lote_id_idx" ON "equipamentos"("lote_id");

-- CreateIndex
CREATE INDEX "movimentacoes_equipamento_id_data_hora_idx" ON "movimentacoes"("equipamento_id", "data_hora");

-- CreateIndex
CREATE INDEX "journal_transacoes_entidade_timestamp_idx" ON "journal_transacoes"("entidade", "timestamp");

-- CreateIndex
CREATE INDEX "journal_transacoes_usuario_responsavel_idx" ON "journal_transacoes"("usuario_responsavel");

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_transacoes" ADD CONSTRAINT "journal_transacoes_usuario_responsavel_fkey" FOREIGN KEY ("usuario_responsavel") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
