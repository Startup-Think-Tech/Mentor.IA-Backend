# Mentor.ia API

Backend NestJS da plataforma Mentor.ia, uma aplicação educacional para preparação ENEM baseada no ciclo `Diagnosticar -> Identificar gaps -> Priorizar -> Planejar -> Estudar -> Avaliar -> Adaptar`.

O backend centraliza autenticação, regras de negócio, persistência, processamento assíncrono, geração de cronogramas, acompanhamento de desempenho e integração com serviços externos. O frontend nunca acessa PostgreSQL, Redis, filas ou serviços externos diretamente.

## Visão Do Produto

O Mentor.ia ajuda estudantes do ensino médio e egressos a organizar uma rotina de estudos mais direcionada. A API transforma respostas de diagnósticos, revisões e sessões de estudo em dados de desempenho, identifica lacunas de aprendizagem e gera cronogramas adaptativos respeitando a disponibilidade do aluno.

Objetivos principais:

- Permitir cadastro, autenticação e acesso individualizado de alunos.
- Registrar disponibilidade semanal de estudo.
- Disponibilizar diagnóstico inicial baseado em referências de questões ENEM.
- Calcular desempenho por disciplina e conteúdo.
- Identificar gaps e classificar prioridades.
- Gerar cronogramas com revisão espaçada.
- Registrar sessões concluídas, perdidas e resultados de revisão.
- Adaptar atividades futuras quando o desempenho mudar.
- Gerar insights motivacionais com IA para as três disciplinas de menor desempenho.

## Stack

- Node.js e TypeScript
- NestJS 11
- Prisma 6
- PostgreSQL
- Redis
- BullMQ para filas e workers
- JWT e Passport para autenticação
- Swagger em `/api/docs`
- bcrypt para hash de senhas
- Nodemailer para e-mails transacionais
- pdf-lib para relatórios/exportações em PDF
- Docker Compose para infraestrutura local

## Arquitetura

Arquitetura lógica:

```text
Frontend Next.js
  -> API REST NestJS
    -> Módulos de negócio
    -> Prisma Client
    -> PostgreSQL
    -> BullMQ
    -> Redis
    -> Serviços externos: API ENEM e IA
```

Camadas:

- Controllers: recebem requisições HTTP, validam DTOs e expõem contratos REST.
- Services: concentram regras de negócio, cálculos, orquestração e decisões do domínio.
- Repositories/Prisma: persistem dados e consultam PostgreSQL.
- Workers/Queues: executam tarefas demoradas ou retentáveis, como insights e integrações externas.
- Guards/Strategies: protegem rotas com autenticação e autorização.
- DTOs: validam entrada com `class-validator` e `ValidationPipe` global.

Princípios:

- API RESTful com prefixo global `/api/v1`.
- Dados do aluno sempre derivados da sessão autenticada nas rotas comuns.
- Rotas `/admin` exigem papel administrativo.
- Histórico não deve ser apagado por recálculos.
- Atividades concluídas permanecem intactas.
- Questões ENEM não são armazenadas como catálogo local de enunciado e alternativas.
- Falhas de IA ou fonte externa não devem derrubar os fluxos principais.

## Estrutura De Pastas

```text
api/
  prisma/
    schema.prisma
  scripts/
    create-module.js
  src/
    app.module.ts
    main.ts
    health/
    prisma/
  docker-compose.yml
  .env.example
```

Estrutura planejada para módulos de negócio:

```text
src/
  auth/
  alunos/
    disponibilidade/
  disciplinas/
    conteudos/
  diagnosticos/
    desempenhos/
  gaps/
  cronogramas/
    revisoes/
  sessoes-estudo/
  dashboard/
  insights/
  prisma/
  health/
```

## Setup Local

Instale as dependências:

```bash
npm install
cp .env.example .env
```

Suba PostgreSQL e Redis a partir da pasta `api/`:

```bash
docker compose up -d
```

Gere o Prisma Client e sincronize o banco local:

```bash
npm run prisma:generate
npx prisma db push
```

Para fluxo com migrations:

```bash
npm run prisma:migrate
```

Inicie a API:

```bash
npm run start:dev
```

URLs locais:

- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`
- Health: `http://localhost:3001/api/v1/health`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Variáveis De Ambiente

```env
DATABASE_URL="postgresql://mentor_ia:mentor_ia@localhost:5432/mentor_ia?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3001
```

Variáveis futuras recomendadas:

```env
JWT_SECRET="change-me"
JWT_EXPIRES_IN="1d"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
AI_PROVIDER_API_KEY=""
AI_REQUEST_TIMEOUT_MS="60000"
INSIGHT_MAX_ATTEMPTS="3"
```

## Banco De Dados

O schema Prisma está em `prisma/schema.prisma` e modela o MVP descrito na documentação ABNT e no documento de rotas.

Principais tabelas:

- `alunos`: usuário principal, papel `aluno` ou `admin`, senha hash e exclusão lógica.
- `disponibilidades_aluno`: disponibilidade semanal de estudo, única por aluno e dia da semana.
- `disciplinas` e `conteudos`: catálogo interno de disciplinas/conteúdos, com inativação lógica.
- `diagnosticos`: avaliações do aluno.
- `diagnosticos_questoes`: referências externas de questões ENEM (`year`, `index`, `language`).
- `respostas_diagnostico`: respostas do aluno e marcação de correção verificada ou não.
- `registros_desempenho`: percentuais por disciplina/conteúdo e origem.
- `gaps`: cálculo de prioridade e urgência.
- `cronogramas`: plano gerado para o aluno.
- `sessoes_estudo`: sessões planejadas, concluídas, perdidas ou canceladas.
- `revisoes`: revisão espaçada vinculada ao cronograma.
- `resultados_revisao`: resultado usado para avançar, manter ou reiniciar intervalo.
- `insight_jobs`: controle durável e idempotente da geração de insights.
- `insights` e `insights_disciplinas`: resultado gerado por IA.
- `outbox_eventos`: publicação recuperável para filas.
- `recuperacoes_senha`: tokens de recuperação armazenados apenas como hash.
- `auditoria_admin`: trilha de ações administrativas.

Remoções do modelo final:

- Não persistir `questoes`, `alternativas_questao` ou `importacoes_questoes` como catálogo local.
- O backend mantém referências e metadados; o frontend busca o conteúdo da questão na API externa.

## Integração ENEM

A questão é referenciada por:

```text
year
index
language
```

Contrato de busca externo usado pelo frontend:

```text
GET https://api.enem.dev/v1/exams/{year}/questions/{index}
```

Regras:

- O backend não armazena enunciado nem alternativas.
- O backend pode armazenar disciplina e conteúdo como metadados internos.
- Falha de rede ou questão inexistente não deve virar resposta errada.
- Se a correção for feita somente no cliente, `correcao_verificada` deve ser `false`.

## Algoritmo Do Cronograma

O motor de cronograma deve ser determinístico. Para as mesmas entradas, deve produzir prioridades equivalentes.

Entradas:

- Desempenho por disciplina.
- Desempenho por conteúdo, quando disponível.
- Histórico recente.
- Revisões pendentes e atrasadas.
- Disponibilidade semanal do aluno.
- Sessões concluídas e perdidas.
- Resultados de diagnósticos e revisões.

Cálculo base:

```text
Gap = 100 - desempenho
Urgência = 0 a 100
Prioridade = (Gap * 0.70) + (Urgência * 0.30)
```

Faixas:

| Pontuação | Nível   |
| --------- | ------- |
| 0-29      | Baixa   |
| 30-59     | Média   |
| 60-79     | Alta    |
| 80-100    | Crítica |

Regra obrigatória:

- Desempenho inferior a `50%` força alta prioridade.

Disponibilidade:

| Tempo diário | Sessões |
| ------------ | ------- |
| 30 min       | 1       |
| 60 min       | 2       |
| 90 min       | 3       |
| 120 min      | 4       |

Regras adicionais:

- Bloco padrão do MVP: `30 minutos`.
- Máximo de `4` sessões por dia.
- Revisões vencidas têm preferência sobre sessões novas.
- A mesma disciplina não deve receber mais de `2` sessões no mesmo dia.
- Não agendar sessões em dias sem disponibilidade.
- Atividades futuras podem ser reorganizadas; concluídas permanecem no histórico.

Revisão espaçada:

```text
1 dia -> 3 dias -> 7 dias -> 14 dias -> 30 dias
```

Resultado da revisão:

| Resultado | Ação                            |
| --------- | ------------------------------- |
| >= 80%    | Avança para o próximo intervalo |
| 50%-79%   | Mantém o intervalo atual        |
| < 50%     | Retorna para revisão em 1 dia   |

Desempate de prioridade:

1. Menor percentual de desempenho.
2. Maior quantidade de erros recentes.
3. Revisão mais atrasada.
4. Maior quantidade de revisões pendentes.
5. Identificador estável da disciplina.

## Insights Com IA

A IA atua como camada complementar, não como motor de planejamento.

Fluxo esperado:

1. `POST /insights/gerar` valida o aluno e cria um job durável.
2. A API responde `202 Accepted` com `job_id`, `status` e `status_url`.
3. Worker consome a fila via BullMQ.
4. Worker seleciona até três disciplinas de menor desempenho.
5. Worker chama o provedor de IA com timeout configurável.
6. Resultado é persistido em `insights` e associado às disciplinas.
7. Job é marcado como `concluido` ou `falhou`.

Estados do job:

- `pendente`
- `processando`
- `aguardando_retentativa`
- `concluido`
- `falhou`

Parâmetros iniciais:

- Timeout da IA: `60s`.
- Tentativas totais: `3`.
- Backoff inicial: `5s` e `15s`, com variação aleatória.
- Retentar apenas timeout, indisponibilidade e erros transitórios.
- Usar `Idempotency-Key` por aluno e payload.
- Aplicar limite de jobs ativos por aluno e retornar `429` quando exceder.

## Rotas Planejadas

Todas as rotas internas usam prefixo `/api/v1`. A documentação OpenAPI fica fora do prefixo em `/api/docs`.

### Health E Documentação

| Método | Rota             | Acesso      |
| ------ | ---------------- | ----------- |
| GET    | `/api/v1/health` | Público     |
| GET    | `/api/docs`      | Público/dev |

### Autenticação

| Método | Rota                    | Acesso      |
| ------ | ----------------------- | ----------- |
| POST   | `/auth/register`        | Público     |
| POST   | `/auth/login`           | Público     |
| POST   | `/auth/logout`          | Autenticado |
| GET    | `/auth/me`              | Autenticado |
| POST   | `/auth/esqueceu-senha`  | Público     |
| POST   | `/auth/redefinir-senha` | Público     |

### Alunos

| Método | Rota                     | Acesso |
| ------ | ------------------------ | ------ |
| GET    | `/alunos/me`             | Aluno  |
| PATCH  | `/alunos/me`             | Aluno  |
| GET    | `/admin/alunos`          | Admin  |
| GET    | `/admin/alunos/:alunoId` | Admin  |
| POST   | `/admin/alunos`          | Admin  |
| PATCH  | `/admin/alunos/:alunoId` | Admin  |
| DELETE | `/admin/alunos/:alunoId` | Admin  |

### Disponibilidade

| Método | Rota                                     | Acesso |
| ------ | ---------------------------------------- | ------ |
| GET    | `/alunos/me/disponibilidade`             | Aluno  |
| PUT    | `/alunos/me/disponibilidade`             | Aluno  |
| GET    | `/admin/alunos/:alunoId/disponibilidade` | Admin  |
| POST   | `/admin/alunos/:alunoId/disponibilidade` | Admin  |
| PUT    | `/admin/alunos/:alunoId/disponibilidade` | Admin  |
| DELETE | `/admin/alunos/:alunoId/disponibilidade` | Admin  |

### Disciplinas E Conteúdos

| Método | Rota                                           | Acesso      |
| ------ | ---------------------------------------------- | ----------- |
| GET    | `/disciplinas`                                 | Autenticado |
| GET    | `/disciplinas/:id`                             | Autenticado |
| GET    | `/disciplinas/:id/conteudos`                   | Autenticado |
| GET    | `/admin/disciplinas`                           | Admin       |
| POST   | `/admin/disciplinas`                           | Admin       |
| PATCH  | `/admin/disciplinas/:id`                       | Admin       |
| DELETE | `/admin/disciplinas/:id`                       | Admin       |
| GET    | `/admin/disciplinas/:id/conteudos`             | Admin       |
| POST   | `/admin/disciplinas/:id/conteudos`             | Admin       |
| PATCH  | `/admin/disciplinas/:id/conteudos/:conteudoId` | Admin       |
| DELETE | `/admin/disciplinas/:id/conteudos/:conteudoId` | Admin       |

### Diagnósticos

| Método | Rota                                      | Acesso |
| ------ | ----------------------------------------- | ------ |
| POST   | `/diagnosticos`                           | Aluno  |
| GET    | `/diagnosticos/atual`                     | Aluno  |
| GET    | `/diagnosticos/historico`                 | Aluno  |
| GET    | `/diagnosticos/:id`                       | Aluno  |
| GET    | `/diagnosticos/:id/questoes`              | Aluno  |
| POST   | `/diagnosticos/:id/respostas`             | Aluno  |
| PATCH  | `/diagnosticos/:id/respostas/:respostaId` | Aluno  |
| POST   | `/diagnosticos/:id/finalizar`             | Aluno  |
| GET    | `/diagnosticos/:id/resultado`             | Aluno  |

### Diagnósticos Admin

| Método | Rota                                                            | Acesso |
| ------ | --------------------------------------------------------------- | ------ |
| POST   | `/admin/alunos/:alunoId/diagnosticos`                           | Admin  |
| GET    | `/admin/alunos/:alunoId/diagnosticos`                           | Admin  |
| GET    | `/admin/alunos/:alunoId/diagnosticos/atual`                     | Admin  |
| GET    | `/admin/alunos/:alunoId/diagnosticos/:id`                       | Admin  |
| GET    | `/admin/alunos/:alunoId/diagnosticos/:id/questoes`              | Admin  |
| POST   | `/admin/alunos/:alunoId/diagnosticos/:id/respostas`             | Admin  |
| PATCH  | `/admin/alunos/:alunoId/diagnosticos/:id/respostas/:respostaId` | Admin  |
| POST   | `/admin/alunos/:alunoId/diagnosticos/:id/finalizar`             | Admin  |
| GET    | `/admin/alunos/:alunoId/diagnosticos/:id/resultado`             | Admin  |

### Desempenhos

| Método | Rota                                                              | Acesso |
| ------ | ----------------------------------------------------------------- | ------ |
| GET    | `/diagnosticos/desempenhos`                                       | Aluno  |
| GET    | `/diagnosticos/desempenhos/historico`                             | Aluno  |
| GET    | `/diagnosticos/desempenhos/disciplinas/:id`                       | Aluno  |
| GET    | `/admin/alunos/:alunoId/diagnosticos/desempenhos`                 | Admin  |
| GET    | `/admin/alunos/:alunoId/diagnosticos/desempenhos/historico`       | Admin  |
| GET    | `/admin/alunos/:alunoId/diagnosticos/desempenhos/disciplinas/:id` | Admin  |

### Gaps

| Método | Rota                                    | Acesso |
| ------ | --------------------------------------- | ------ |
| GET    | `/gaps`                                 | Aluno  |
| GET    | `/gaps/historico`                       | Aluno  |
| GET    | `/gaps/:id`                             | Aluno  |
| GET    | `/admin/gaps`                           | Admin  |
| GET    | `/admin/alunos/:alunoId/gaps`           | Admin  |
| GET    | `/admin/alunos/:alunoId/gaps/historico` | Admin  |
| GET    | `/admin/alunos/:alunoId/gaps/:id`       | Admin  |

### Cronogramas

| Método | Rota                                            | Acesso |
| ------ | ----------------------------------------------- | ------ |
| POST   | `/cronogramas/gerar`                            | Aluno  |
| GET    | `/cronogramas/atual`                            | Aluno  |
| GET    | `/cronogramas/historico`                        | Aluno  |
| GET    | `/cronogramas/:id`                              | Aluno  |
| POST   | `/cronogramas/recalcular`                       | Aluno  |
| POST   | `/admin/alunos/:alunoId/cronogramas/gerar`      | Admin  |
| GET    | `/admin/alunos/:alunoId/cronogramas`            | Admin  |
| GET    | `/admin/alunos/:alunoId/cronogramas/atual`      | Admin  |
| GET    | `/admin/alunos/:alunoId/cronogramas/:id`        | Admin  |
| POST   | `/admin/alunos/:alunoId/cronogramas/recalcular` | Admin  |
| PATCH  | `/admin/alunos/:alunoId/cronogramas/:id`        | Admin  |

### Sessões De Estudo

| Método | Rota                                                 | Acesso |
| ------ | ---------------------------------------------------- | ------ |
| GET    | `/sessoes-estudo`                                    | Aluno  |
| GET    | `/sessoes-estudo/hoje`                               | Aluno  |
| GET    | `/sessoes-estudo/:id`                                | Aluno  |
| POST   | `/sessoes-estudo/:id/concluir`                       | Aluno  |
| POST   | `/sessoes-estudo/:id/perder`                         | Aluno  |
| GET    | `/admin/alunos/:alunoId/sessoes-estudo`              | Admin  |
| GET    | `/admin/alunos/:alunoId/sessoes-estudo/:id`          | Admin  |
| POST   | `/admin/alunos/:alunoId/sessoes-estudo`              | Admin  |
| PATCH  | `/admin/alunos/:alunoId/sessoes-estudo/:id`          | Admin  |
| DELETE | `/admin/alunos/:alunoId/sessoes-estudo/:id`          | Admin  |
| POST   | `/admin/alunos/:alunoId/sessoes-estudo/:id/concluir` | Admin  |
| POST   | `/admin/alunos/:alunoId/sessoes-estudo/:id/perder`   | Admin  |

### Revisões

| Método | Rota                                                      | Acesso |
| ------ | --------------------------------------------------------- | ------ |
| GET    | `/cronogramas/:cronogramaId/revisoes`                     | Aluno  |
| GET    | `/cronogramas/:cronogramaId/revisoes/pendentes`           | Aluno  |
| GET    | `/cronogramas/:cronogramaId/revisoes/atrasadas`           | Aluno  |
| GET    | `/cronogramas/:cronogramaId/revisoes/historico`           | Aluno  |
| GET    | `/cronogramas/:cronogramaId/revisoes/:id`                 | Aluno  |
| POST   | `/cronogramas/:cronogramaId/revisoes/:id/resultado`       | Aluno  |
| GET    | `/admin/cronogramas/:cronogramaId/revisoes`               | Admin  |
| GET    | `/admin/cronogramas/:cronogramaId/revisoes/:id`           | Admin  |
| POST   | `/admin/cronogramas/:cronogramaId/revisoes`               | Admin  |
| PATCH  | `/admin/cronogramas/:cronogramaId/revisoes/:id`           | Admin  |
| DELETE | `/admin/cronogramas/:cronogramaId/revisoes/:id`           | Admin  |
| POST   | `/admin/cronogramas/:cronogramaId/revisoes/:id/resultado` | Admin  |

### Dashboard

| Método | Rota                | Acesso                   |
| ------ | ------------------- | ------------------------ |
| GET    | `/dashboard/:visao` | Aluno/Admin condicionado |

`visao` aceita `resumo` ou `historico`. Filtros planejados: `inicio`, `fim`, `disciplina_id`, `pagina`, `limite`.

### Insights

| Método | Rota                    | Acesso |
| ------ | ----------------------- | ------ |
| POST   | `/insights/gerar`       | Aluno  |
| GET    | `/insights/jobs/:jobId` | Aluno  |
| GET    | `/insights`             | Aluno  |
| GET    | `/insights/:id`         | Aluno  |

## Segurança E Governança

- Senhas sempre com hash (`bcrypt`).
- Tokens JWT assinados com segredo de ambiente.
- Recuperação de senha armazena somente hash do token.
- Admin é papel persistido e validado por middleware/guard confiável.
- `aluno_id` em rotas comuns nunca deve ser aceito livremente do cliente.
- Operações administrativas devem registrar auditoria.
- Variáveis sensíveis ficam em `.env` e não devem ser commitadas.
- Pull Requests devem passar por lint, build e validação do PO/tester.

## DoR E DoD

Definition of Ready:

- História ou requisito associado.
- Contrato de API definido entre front e back.
- Critérios de aceitação claros.

Definition of Done:

- Implementação integrada.
- Validações e erros tratados.
- Testes relevantes executados.
- Swagger/README atualizados quando houver mudança de contrato.
- Validação do PO/tester.

## Scripts Úteis

```bash
npm run start:dev
npm run build
npm run lint
npm run test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Comandos De Validação

```bash
npx prisma validate
npx eslint "src/**/*.ts" "scripts/**/*.js"
npm run build
docker compose config
docker compose up -d
docker compose ps
```

## Roadmap MVP

1. Fundação técnica: NestJS, Prisma, PostgreSQL, Redis, BullMQ e Docker.
2. Autenticação e onboarding de disponibilidade.
3. Integração ENEM e diagnóstico.
4. Cálculo de desempenho e gaps.
5. Motor de cronograma e revisão espaçada.
6. Execução de sessões, adaptação e insights com IA.
7. Integração completa, testes, ajustes de UX e release candidate.

## Fora Do Escopo Do MVP

- Módulo de professores.
- Pagamentos ou assinaturas.
- Gamificação completa.
- Catálogo local completo de enunciados/alternativas ENEM.
- Relatórios avançados para responsáveis ou instituições.
