ALTER TABLE "Campanha" ADD COLUMN "tipoDestinatario" TEXT NOT NULL DEFAULT 'escolas';
ALTER TABLE "Envio" ADD COLUMN "vars" JSONB;
