-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campanha" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "filtros" JSONB NOT NULL,
    "totalAlvo" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campanha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Envio" (
    "id" TEXT NOT NULL,
    "campanhaId" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "enviadoEm" TIMESTAMP(3),
    "abertoEm" TIMESTAMP(3),
    "erro" TEXT,

    CONSTRAINT "Envio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Campanha_status_idx" ON "Campanha"("status");

-- CreateIndex
CREATE INDEX "Envio_campanhaId_status_idx" ON "Envio"("campanhaId", "status");

-- CreateIndex
CREATE INDEX "Envio_sigla_idx" ON "Envio"("sigla");

-- AddForeignKey
ALTER TABLE "Campanha" ADD CONSTRAINT "Campanha_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Envio" ADD CONSTRAINT "Envio_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "Campanha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
