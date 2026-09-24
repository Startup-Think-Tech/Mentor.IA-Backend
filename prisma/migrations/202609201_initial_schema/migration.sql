-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AlunoPapel" AS ENUM ('aluno', 'admin');

-- CreateEnum
CREATE TYPE "DiagnosticoStatus" AS ENUM ('em_andamento', 'finalizado', 'cancelado');

-- CreateEnum
CREATE TYPE "TipoOrigemDesempenho" AS ENUM ('diagnostico', 'sessao_estudo', 'revisao', 'manual');

-- CreateEnum
CREATE TYPE "NivelPrioridade" AS ENUM ('baixa', 'media', 'alta', 'critica');

-- CreateEnum
CREATE TYPE "CronogramaStatus" AS ENUM ('ativo', 'substituido', 'cancelado', 'arquivado');

-- CreateEnum
CREATE TYPE "SessaoEstudoTipo" AS ENUM ('estudo', 'revisao', 'simulado');

-- CreateEnum
CREATE TYPE "SessaoEstudoStatus" AS ENUM ('pendente', 'concluida', 'perdida', 'cancelada');

-- CreateEnum
CREATE TYPE "RevisaoStatus" AS ENUM ('pendente', 'concluida', 'atrasada', 'cancelada');

-- CreateEnum
CREATE TYPE "ResultadoRevisaoTipo" AS ENUM ('errou', 'dificil', 'bom', 'facil');

-- CreateEnum
CREATE TYPE "InsightJobStatus" AS ENUM ('pendente', 'processando', 'aguardando_retentativa', 'concluido', 'falhou');

-- CreateTable
CREATE TABLE "alunos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "papel" "AlunoPapel" NOT NULL DEFAULT 'aluno',
    "excluido_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteudos" (
    "id" UUID NOT NULL,
    "disciplina_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conteudos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidades_aluno" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "minutos_disponiveis" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disponibilidades_aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "status" "DiagnosticoStatus" NOT NULL DEFAULT 'em_andamento',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizado_em" TIMESTAMP(3),

    CONSTRAINT "diagnosticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos_questoes" (
    "id" UUID NOT NULL,
    "diagnostico_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "language" VARCHAR(16) NOT NULL DEFAULT 'default',
    "ordem" INTEGER NOT NULL,
    "disciplina_id" UUID,
    "conteudo_id" UUID,

    CONSTRAINT "diagnosticos_questoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respostas_diagnostico" (
    "id" UUID NOT NULL,
    "diagnostico_questao_id" UUID NOT NULL,
    "alternativa_marcada" VARCHAR(8) NOT NULL,
    "acerto_informado" BOOLEAN,
    "correcao_verificada" BOOLEAN NOT NULL DEFAULT false,
    "respondido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "respostas_diagnostico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_desempenho" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "diagnostico_id" UUID,
    "disciplina_id" UUID NOT NULL,
    "conteudo_id" UUID NOT NULL,
    "tipo_origem" "TipoOrigemDesempenho" NOT NULL,
    "total_questoes" INTEGER NOT NULL,
    "acertos" INTEGER NOT NULL,
    "percentual" DECIMAL(5,2) NOT NULL,
    "correcao_verificada" BOOLEAN NOT NULL DEFAULT false,
    "registrado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_desempenho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gaps" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "disciplina_id" UUID NOT NULL,
    "conteudo_id" UUID NOT NULL,
    "desempenho" DECIMAL(5,2) NOT NULL,
    "pontuacao_gap" DECIMAL(8,2) NOT NULL,
    "pontuacao_urgencia" DECIMAL(8,2) NOT NULL,
    "pontuacao_prioridade" DECIMAL(8,2) NOT NULL,
    "nivel_prioridade" "NivelPrioridade" NOT NULL,
    "calculado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cronogramas" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "status" "CronogramaStatus" NOT NULL DEFAULT 'ativo',
    "valido_a_partir" TIMESTAMP(3) NOT NULL,
    "valido_ate" TIMESTAMP(3),
    "gerado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cronogramas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes_estudo" (
    "id" UUID NOT NULL,
    "cronograma_id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "disciplina_id" UUID NOT NULL,
    "conteudo_id" UUID NOT NULL,
    "revisao_id" UUID,
    "tipo" "SessaoEstudoTipo" NOT NULL,
    "status" "SessaoEstudoStatus" NOT NULL DEFAULT 'pendente',
    "agendado_para" TIMESTAMP(3) NOT NULL,
    "duracao_minutos" INTEGER NOT NULL,
    "concluido_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessoes_estudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisoes" (
    "id" UUID NOT NULL,
    "cronograma_id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "disciplina_id" UUID NOT NULL,
    "conteudo_id" UUID NOT NULL,
    "intervalo_atual" INTEGER NOT NULL,
    "proxima_revisao_em" TIMESTAMP(3) NOT NULL,
    "status" "RevisaoStatus" NOT NULL DEFAULT 'pendente',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revisoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_revisao" (
    "id" UUID NOT NULL,
    "revisao_id" UUID NOT NULL,
    "resultado" "ResultadoRevisaoTipo" NOT NULL,
    "registrado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resultados_revisao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_jobs" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "status" "InsightJobStatus" NOT NULL DEFAULT 'pendente',
    "idempotency_key" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "proxima_tentativa_em" TIMESTAMP(3),
    "lease_expira_em" TIMESTAMP(3),
    "erro_codigo" TEXT,
    "erro_resumo" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "concluido_em" TIMESTAMP(3),

    CONSTRAINT "insight_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights_disciplinas" (
    "id" UUID NOT NULL,
    "insight_id" UUID NOT NULL,
    "disciplina_id" UUID NOT NULL,

    CONSTRAINT "insights_disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_eventos" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicado_em" TIMESTAMP(3),

    CONSTRAINT "outbox_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recuperacoes_senha" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recuperacoes_senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_admin" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "acao" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "recurso_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alunos_email_key" ON "alunos"("email");

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_nome_key" ON "disciplinas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_codigo_key" ON "disciplinas"("codigo");

-- CreateIndex
CREATE INDEX "conteudos_disciplina_id_idx" ON "conteudos"("disciplina_id");

-- CreateIndex
CREATE UNIQUE INDEX "conteudos_disciplina_id_nome_key" ON "conteudos"("disciplina_id", "nome");

-- CreateIndex
CREATE INDEX "disponibilidades_aluno_aluno_id_idx" ON "disponibilidades_aluno"("aluno_id");

-- CreateIndex
CREATE UNIQUE INDEX "disponibilidades_aluno_aluno_id_dia_semana_key" ON "disponibilidades_aluno"("aluno_id", "dia_semana");

-- CreateIndex
CREATE INDEX "diagnosticos_aluno_id_status_idx" ON "diagnosticos"("aluno_id", "status");

-- CreateIndex
CREATE INDEX "diagnosticos_questoes_diagnostico_id_idx" ON "diagnosticos_questoes"("diagnostico_id");

-- CreateIndex
CREATE INDEX "diagnosticos_questoes_disciplina_id_conteudo_id_idx" ON "diagnosticos_questoes"("disciplina_id", "conteudo_id");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosticos_questoes_diagnostico_id_year_index_language_key" ON "diagnosticos_questoes"("diagnostico_id", "year", "index", "language");

-- CreateIndex
CREATE UNIQUE INDEX "respostas_diagnostico_diagnostico_questao_id_key" ON "respostas_diagnostico"("diagnostico_questao_id");

-- CreateIndex
CREATE INDEX "registros_desempenho_aluno_id_registrado_em_idx" ON "registros_desempenho"("aluno_id", "registrado_em");

-- CreateIndex
CREATE INDEX "registros_desempenho_diagnostico_id_idx" ON "registros_desempenho"("diagnostico_id");

-- CreateIndex
CREATE INDEX "registros_desempenho_disciplina_id_conteudo_id_idx" ON "registros_desempenho"("disciplina_id", "conteudo_id");

-- CreateIndex
CREATE INDEX "gaps_aluno_id_nivel_prioridade_idx" ON "gaps"("aluno_id", "nivel_prioridade");

-- CreateIndex
CREATE INDEX "gaps_disciplina_id_conteudo_id_idx" ON "gaps"("disciplina_id", "conteudo_id");

-- CreateIndex
CREATE INDEX "cronogramas_aluno_id_status_idx" ON "cronogramas"("aluno_id", "status");

-- CreateIndex
CREATE INDEX "sessoes_estudo_aluno_id_agendado_para_idx" ON "sessoes_estudo"("aluno_id", "agendado_para");

-- CreateIndex
CREATE INDEX "sessoes_estudo_cronograma_id_idx" ON "sessoes_estudo"("cronograma_id");

-- CreateIndex
CREATE INDEX "sessoes_estudo_revisao_id_idx" ON "sessoes_estudo"("revisao_id");

-- CreateIndex
CREATE INDEX "revisoes_cronograma_id_status_idx" ON "revisoes"("cronograma_id", "status");

-- CreateIndex
CREATE INDEX "revisoes_aluno_id_proxima_revisao_em_idx" ON "revisoes"("aluno_id", "proxima_revisao_em");

-- CreateIndex
CREATE INDEX "resultados_revisao_revisao_id_idx" ON "resultados_revisao"("revisao_id");

-- CreateIndex
CREATE INDEX "insight_jobs_status_proxima_tentativa_em_idx" ON "insight_jobs"("status", "proxima_tentativa_em");

-- CreateIndex
CREATE UNIQUE INDEX "insight_jobs_aluno_id_idempotency_key_key" ON "insight_jobs"("aluno_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "insights_job_id_key" ON "insights"("job_id");

-- CreateIndex
CREATE INDEX "insights_aluno_id_criado_em_idx" ON "insights"("aluno_id", "criado_em");

-- CreateIndex
CREATE INDEX "insights_disciplinas_disciplina_id_idx" ON "insights_disciplinas"("disciplina_id");

-- CreateIndex
CREATE UNIQUE INDEX "insights_disciplinas_insight_id_disciplina_id_key" ON "insights_disciplinas"("insight_id", "disciplina_id");

-- CreateIndex
CREATE INDEX "outbox_eventos_publicado_em_criado_em_idx" ON "outbox_eventos"("publicado_em", "criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "recuperacoes_senha_token_hash_key" ON "recuperacoes_senha"("token_hash");

-- CreateIndex
CREATE INDEX "recuperacoes_senha_aluno_id_expira_em_idx" ON "recuperacoes_senha"("aluno_id", "expira_em");

-- CreateIndex
CREATE INDEX "auditoria_admin_admin_id_criado_em_idx" ON "auditoria_admin"("admin_id", "criado_em");

-- CreateIndex
CREATE INDEX "auditoria_admin_recurso_recurso_id_idx" ON "auditoria_admin"("recurso", "recurso_id");

-- AddForeignKey
ALTER TABLE "conteudos" ADD CONSTRAINT "conteudos_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidades_aluno" ADD CONSTRAINT "disponibilidades_aluno_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_questoes" ADD CONSTRAINT "diagnosticos_questoes_diagnostico_id_fkey" FOREIGN KEY ("diagnostico_id") REFERENCES "diagnosticos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_questoes" ADD CONSTRAINT "diagnosticos_questoes_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_questoes" ADD CONSTRAINT "diagnosticos_questoes_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respostas_diagnostico" ADD CONSTRAINT "respostas_diagnostico_diagnostico_questao_id_fkey" FOREIGN KEY ("diagnostico_questao_id") REFERENCES "diagnosticos_questoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_desempenho" ADD CONSTRAINT "registros_desempenho_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_desempenho" ADD CONSTRAINT "registros_desempenho_diagnostico_id_fkey" FOREIGN KEY ("diagnostico_id") REFERENCES "diagnosticos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_desempenho" ADD CONSTRAINT "registros_desempenho_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_desempenho" ADD CONSTRAINT "registros_desempenho_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gaps" ADD CONSTRAINT "gaps_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gaps" ADD CONSTRAINT "gaps_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gaps" ADD CONSTRAINT "gaps_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronogramas" ADD CONSTRAINT "cronogramas_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes_estudo" ADD CONSTRAINT "sessoes_estudo_cronograma_id_fkey" FOREIGN KEY ("cronograma_id") REFERENCES "cronogramas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes_estudo" ADD CONSTRAINT "sessoes_estudo_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes_estudo" ADD CONSTRAINT "sessoes_estudo_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes_estudo" ADD CONSTRAINT "sessoes_estudo_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes_estudo" ADD CONSTRAINT "sessoes_estudo_revisao_id_fkey" FOREIGN KEY ("revisao_id") REFERENCES "revisoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisoes" ADD CONSTRAINT "revisoes_cronograma_id_fkey" FOREIGN KEY ("cronograma_id") REFERENCES "cronogramas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisoes" ADD CONSTRAINT "revisoes_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisoes" ADD CONSTRAINT "revisoes_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisoes" ADD CONSTRAINT "revisoes_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_revisao" ADD CONSTRAINT "resultados_revisao_revisao_id_fkey" FOREIGN KEY ("revisao_id") REFERENCES "revisoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_jobs" ADD CONSTRAINT "insight_jobs_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "insight_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights_disciplinas" ADD CONSTRAINT "insights_disciplinas_insight_id_fkey" FOREIGN KEY ("insight_id") REFERENCES "insights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights_disciplinas" ADD CONSTRAINT "insights_disciplinas_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_eventos" ADD CONSTRAINT "outbox_eventos_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "insight_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recuperacoes_senha" ADD CONSTRAINT "recuperacoes_senha_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_admin" ADD CONSTRAINT "auditoria_admin_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

