-- Renomear duplicatas mantendo a entrada mais antiga; sufixo com parte do id para ser único
UPDATE "Campanha"
SET nome = nome || ' (' || SUBSTRING(id, 1, 6) || ')'
WHERE id NOT IN (
  SELECT MIN(id) FROM "Campanha" GROUP BY nome
);

CREATE UNIQUE INDEX "Campanha_nome_key" ON "Campanha"("nome");
