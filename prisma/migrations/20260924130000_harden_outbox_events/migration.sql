ALTER TABLE "outbox_eventos"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "tentativas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "erro_resumo" TEXT,
ADD COLUMN "proxima_tentativa_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "processing_token" UUID,
ADD COLUMN "lock_expira_em" TIMESTAMP(3);

UPDATE "outbox_eventos"
SET "status" = CASE WHEN "publicado_em" IS NULL THEN 'pending' ELSE 'published' END;

DROP INDEX IF EXISTS "outbox_eventos_publicado_em_criado_em_idx";

CREATE INDEX "outbox_eventos_status_proxima_tentativa_em_criado_em_idx"
ON "outbox_eventos"("status", "proxima_tentativa_em", "criado_em");
