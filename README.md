# Mentor.ia API

Backend NestJS da plataforma Mentor.ia. A API atende autenticação, gestão de alunos, diagnóstico ENEM, cálculo de desempenho e gaps, cronogramas, revisões, sessões de estudo, dashboard e geração assíncrona de insights com IA.

## Stack

- NestJS 11
- Prisma 6
- PostgreSQL
- Redis, BullMQ e filas assíncronas
- JWT e Passport
- Swagger em `/api/docs`
- Nodemailer para e-mails transacionais
- pdf-lib para exportação de relatórios em PDF
- bcrypt para hash de senhas

## Setup

```bash
npm install
cp .env.example .env
```

Suba a infraestrutura a partir da pasta `api/`:

```bash
docker compose up -d
```

Gere o Prisma Client e rode as migrações:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Inicie em desenvolvimento:

```bash
npm run start:dev
```

## Variáveis de ambiente

```env
DATABASE_URL="postgresql://mentor_ia:mentor_ia@localhost:5432/mentor_ia?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3001
```

## Banco de dados

O schema Prisma está em `prisma/schema.prisma` e segue o modelo revisado do documento funcional:

- `alunos`, com papel `aluno` ou `admin` e exclusão lógica.
- `disciplinas` e `conteudos`, com inativação lógica via `ativo`.
- `diagnosticos`, `diagnosticos_questoes` e `respostas_diagnostico`, armazenando apenas referências externas da API ENEM.
- `registros_desempenho` e `gaps`, derivados de respostas, sessões e revisões.
- `cronogramas`, `sessoes_estudo`, `revisoes` e `resultados_revisao`.
- `insight_jobs`, `insights`, `insights_disciplinas` e `outbox_eventos` para processamento assíncrono e idempotente.
- `recuperacoes_senha` e `auditoria_admin` para suporte a autenticação e trilha administrativa.

As questões do ENEM não são persistidas como catálogo local. O backend armazena `year`, `index` e `language`; o frontend busca o enunciado e alternativas em `https://api.enem.dev/v1/exams/{year}/questions/{index}`.

## Health check

```bash
GET /api/v1/health
```

A rota valida a aplicação e a conexão com o PostgreSQL via Prisma.

## Convenções de API

- Rotas internas usam prefixo planejado `/api/v1`.
- Rotas públicas: cadastro, login, recuperação e redefinição de senha.
- Rotas de negócio exigem autenticação e escopo do aluno autenticado.
- Rotas `/admin` exigem autenticação e permissão administrativa.
- Operações administrativas devem registrar auditoria em `auditoria_admin`.
- Rotas estáticas como `/atual`, `/historico` e `/jobs` devem ser registradas antes de rotas dinâmicas como `/:id`.

## Scripts úteis

```bash
npm run build
npm run start:dev
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```
