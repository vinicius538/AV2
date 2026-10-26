CREATE TABLE "configuracoes_sistema" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'GLOBAL',
    "aliquota_imposto" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "coeficiente_depreciacao" DECIMAL(8,5) NOT NULL DEFAULT 0,
    "versao" INTEGER NOT NULL DEFAULT 0,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "configuracoes_sistema_pkey" PRIMARY KEY ("id")
);
