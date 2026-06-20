# Espaço Bíblico Infantil

Plataforma web completa para o departamento infantil da igreja: cadastro de crianças, controle de presença, frequência, relatórios e dashboard — com suporte offline (PWA).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Default Login

- **Admin:** admin@ebi.com / admin123
- **Auxiliar:** maria@ebi.com / auxiliar123

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Wouter + React Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT + bcryptjs
- Charts: Recharts
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/db/src/schema/` — Drizzle table definitions (users, congregations, children, attendance, dailyReports)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, congregations, children, attendance, reports)
- `artifacts/api-server/src/lib/auth.ts` — JWT sign/verify + authMiddleware
- `artifacts/espaco-biblico/src/` — React frontend

## Architecture decisions

- Age is never stored; always computed client-side from `birthDate`
- Attendance is unique per child per date (DB constraint)
- `daily_reports` table is updated automatically every time attendance is marked
- JWT stored in `localStorage` as `ebi_token`; Authorization header added via custom-fetch

## Product

- Login (email + senha, two roles: admin / auxiliar)
- Dashboard com estatísticas, gráfico semanal, aniversariantes e crianças com mais faltas
- Presença: busca instantânea por nome, marcar presença com um clique, cadastro rápido se não encontrar
- Cadastro de crianças com badges para TEA, restrição alimentar e 12+
- Perfil da criança: histórico completo, frequência, link WhatsApp do responsável
- Histórico por data: ver quem esteve presente em cada culto
- Relatórios: tabela diária e tendência semanal
- Congregações: CRUD completo

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any change to `lib/api-spec/openapi.yaml`
- Run `pnpm --filter @workspace/db run push` after schema changes in `lib/db/src/schema/`
- `children` route file has `/children/birthdays` and `/children/most-absent` BEFORE `/:id` — order matters in Express

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
