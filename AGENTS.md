# AGENTS.md - Mentor.ia Backend

## Contexto Do Projeto
- Backend NestJS do Mentor.ia, app educacional para ENEM: diagnostica desempenho, calcula gaps/prioridades, gera cronogramas, organiza sessões, revisões espaçadas e insights com IA.
- Mantenha como monólito modular NestJS: API REST, regras de negócio, Prisma, producers/consumers RabbitMQ e processamento assíncrono ficam neste mesmo projeto.
- Não criar microserviço/worker separado agora.

## Fontes De Verdade Antes De Editar
- Leia `package.json`, `prisma/schema.prisma`, `docker-compose.yml`, `.env.example` e os módulos em `src/modules` antes de mudanças relevantes.
- Módulos existentes hoje: `auth`, `health`, `prisma`, `rabbitmq`; não trate módulos planejados como já implementados.
- Preserve `package-lock.json`; o gerenciador atual é `npm`.
- Não recrie arquivos/módulos existentes sem necessidade; siga padrões já usados em controllers/services/repositories.

## Comandos Reais
- Instalar dependências: `npm install`.
- Desenvolvimento: `npm run start:dev`.
- Build: `npm run build`.
- Lint: `npm run lint` (atenção: o script aplica `--fix`).
- Testes unitários: `npm run test`; teste focado: `npm run test -- nome-ou-caminho.spec.ts`.
- E2E configurado no script: `npm run test:e2e`, mas não há diretório `test` no estado atual.
- Prisma: `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:studio`; valide schema com `npx prisma validate`.
- Infra local: `docker compose up -d`; valide compose com `docker compose config`.

## Configuração E Entrypoints
- `src/main.ts` aplica prefixo global via `API_PREFIX`, padrão `api/v1`, e `ValidationPipe` global com `whitelist`, `forbidNonWhitelisted` e `transform`.
- Swagger usa `API_DOCS_PATH`, padrão `api/docs`, e pode ser desligado com `SWAGGER_ENABLED=false`.
- Configuração é validada em `src/config/env.validation.ts` com Joi; novas envs devem entrar também em `.env.example`.
- `JWT_SECRET` é obrigatório e precisa ter pelo menos 32 caracteres; `JWT_REFRESH_SECRET` é opcional e cai para `JWT_SECRET` via `app.config.ts`.

## Banco E Prisma
- PostgreSQL é o banco oficial; `prisma/schema.prisma` usa UUIDs e nomes físicos em snake_case via `@map`/`@@map`.
- Acesso ao Prisma deve passar por `PrismaService`/módulo existente; controllers não devem consultar Prisma diretamente.
- Não apague migrations existentes para resolver conflito local; no estado atual não há diretório `prisma/migrations`.
- Antes de alterar schema, avalie relações, índices, uniques e preservação de histórico; crie migration quando o schema mudar.

## Arquitetura Prioritária
- RabbitMQ é o broker oficial para filas e jobs; não introduza Bull, BullMQ ou Redis para filas.
- O README, `.env.example`, `package.json` e `docker-compose.yml` ainda mencionam Redis; trate isso como legado/inconsistência, não como autorização para usar Redis como fila.
- Não adicionar Redis salvo necessidade independente e explícita, como cache, rate limit ou sessão.
- API e consumer RabbitMQ devem viver no mesmo projeto NestJS.
- Insights assíncronos devem responder rápido com `202 Accepted`, `job_id`, `status` e `status_url`; não manter HTTP aberto esperando IA.
- Consumers RabbitMQ devem ser idempotentes e usar ACK/NACK conscientemente; evite loops infinitos de requeue e prepare retry/DLQ sem complexidade prematura.

## Rotas E Segurança
- Rotas da aplicação usam `/api/v1`; rotas admin ficam em `/api/v1/admin/...` e exigem autenticação, autorização e papel `ADMIN`.
- Rotas comuns nunca devem confiar em `alunoId` livre enviado pelo cliente; derive o aluno da autenticação/token/sessão.
- Cadastro público sempre cria `ALUNO`; usuário nunca pode se promover a `ADMIN` via API pública.
- Sempre valide ownership do recurso; possuir um ID não autoriza acesso.
- Nunca logue senha, JWT completo, token de recuperação, API keys, credenciais ou dados sensíveis desnecessários.

## Domínio Que Não Deve Ser Quebrado
- Não criar módulo/tabela/importador para catálogo completo de questões ENEM; armazene apenas referências como `year`, `index`, `language` quando necessário.
- Fonte externa atual de questões: `https://api.enem.dev/v1/exams/{year}/questions/{index}`; o frontend carrega o conteúdo visual conforme contrato.
- Finalização de diagnóstico deve ser idempotente: sem desempenhos, gaps ou efeitos duplicados.
- Gaps são determinísticos: `gap = 100 - desempenho`; prioridade = `(gap * 0.70) + (urgencia * 0.30)`; desempenho `< 50%` força pelo menos prioridade `ALTA`.
- IA só gera insights complementares; nunca decide cronograma, desempenho, gaps ou prioridades.
- Cronograma é determinístico e deve preservar histórico; recálculos reorganizam somente atividades futuras.
- Sessões concluídas/perdidas e resultados de revisão permanecem como histórico; não apague a sessão original para reagendar.
- Revisão espaçada MVP: `1`, `3`, `7`, `14`, `30` dias; `>=80%` avança, `50%-79%` mantém, `<50%` volta para 1 dia.

## Estilo De Implementação
- Organize por domínio/caso de uso, não por uma pasta para cada entidade do banco.
- Controllers pequenos: request/guards/decorators/chamada ao service/resposta.
- Services concentram regras de negócio; se crescerem demais, separe por responsabilidade sem abstração prematura.
- Todas as entradas HTTP devem usar DTOs com validação declarativa; não exponha DTO Prisma como contrato HTTP.
- Prefira soft delete/inativação quando houver histórico acadêmico vinculado.
- Use exceções HTTP apropriadas do NestJS; não retorne `200` para erro e não exponha stack trace ao cliente.

## Verificação Antes De Concluir
- Para mudanças comuns, rode pelo menos `npm run build` e o teste/lint relevante; lembre que `npm run lint` modifica arquivos.
- Se mexer em Prisma, rode `npx prisma validate` e `npm run prisma:generate`; informe migrations criadas.
- Informe no resumo final: arquivos alterados, migrations, novas variáveis de ambiente, novos serviços Docker e decisões arquiteturais relevantes.
