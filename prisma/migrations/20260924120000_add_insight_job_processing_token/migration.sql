ALTER TABLE "insight_jobs"
ADD COLUMN "processing_token" UUID;

CREATE INDEX "insight_jobs_processing_token_idx"
ON "insight_jobs"("processing_token");
