# Drivee Decision Room Frontend

Техническая документация frontend-части Drivee NL2SQL. Приложение предоставляет SPA-интерфейс для аналитических NL2SQL-сценариев: пользователь задает бизнес-вопрос, получает controlled clarification flow, SQL, explain, confidence, визуализацию, таблицу данных и рекомендации.

Документ описывает фактическую структуру `front`, правила сопровождения, локальный запуск, интеграцию с backend, тесты и quality gates. Все команды выполняются из папки `front`, если явно не указано другое.

## Назначение

Frontend решает пять задач:

1. Дает пользователю рабочий Decision Room вместо landing page.
2. Отправляет NL2SQL-вопросы в backend через `POST /api/ask`.
3. Показывает clarification screen, если backend требует уточнение.
4. Отображает результат через trust-контур: SQL, explain, confidence, cost, actions, table, chart.
5. Хранит историю отчетов текущей сессии в локальном store и показывает optional KPI snapshot.

## Технологический стек

- React 18.
- TypeScript.
- Vite 6.
- React Router 7.
- Tailwind CSS 4.
- shadcn/Radix UI primitives.
- MUI icons и lucide-react.
- Recharts для визуализаций.
- Docker / Nginx для production-сборки.

## Архитектура

Проект остается компактным SPA, поэтому структура разделена по ответственности, а не по избыточным слоям.

```text
front/
  src/
    main.tsx                       # React entrypoint
    app/
      App.tsx                      # RouterProvider
      routes.tsx                   # Route objects
      api.ts                       # API contracts, runtime guards, fetch client
      store.ts                     # Local session state and preset scenarios
      components/                  # Product screens and composed widgets
        Home.tsx                   # Decision Room start screen
        LoadingScreen.tsx          # Pending ask flow
        ResultScreen.tsx           # Success, error and clarification result
        ReportView.tsx             # Saved report details
        ReportsLibrary.tsx         # Session report library
        QueryVisualization.tsx     # Chart/table visualization adapter
        ui/                        # Reusable UI primitives
        figma/                     # Figma import compatibility helpers
    styles/                        # Global CSS, fonts, Tailwind and theme tokens
  scripts/                         # Node-based regression and hygiene tests
  guidelines/                      # Figma Make implementation guidance
  Dockerfile                       # dev/build/prod stages
  docker-compose.yml               # Local Vite container
  vite.config.ts                   # Plugins, aliases, /api proxy, chunks
  package.json                     # npm scripts and dependency manifest
  package-lock.json                # Reproducible npm dependency lock
```

### Frontend Boundaries

`src/app/api.ts` is the only place that knows backend response shapes. It validates API payloads at runtime before the UI receives them.

`src/app/store.ts` owns session state, prepared business questions and report persistence for the current browser session.

`src/app/components/*` owns rendering and user workflows. Components should consume typed API/store data and avoid duplicating backend payload parsing.

`src/app/components/ui/*` contains reusable primitives. Product-specific behavior should live in composed components outside `ui`.

`dist/`, `node_modules/` and local logs are generated artifacts. They are intentionally ignored and must not be committed.

## Backend Integration

The frontend uses relative API paths by default:

- `POST /api/ask`: sends a natural-language analytics question and receives success, clarification or controlled error payload.
- `GET /api/pilot/kpi`: optional historical KPI snapshot for the pilot panel.

In local development, Vite proxies `/api/*` to:

```text
http://localhost:8000
```

To target another backend URL:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8000"
npm run dev
```

If `VITE_API_BASE_URL` is not set, requests stay relative to the current frontend origin.

## Local Setup

Install dependencies from the lockfile:

```powershell
npm ci
```

Start Vite:

```powershell
npm run dev
```

Open:

```text
http://localhost:5173
```

Typical full-stack local flow:

1. Start backend API on `http://localhost:8000`.
2. Run `npm ci` in `front`.
3. Run `npm run dev`.
4. Open `http://localhost:5173`.
5. Ask a prepared Ops/Finance question and verify success or clarification flow.

## npm Scripts

```powershell
npm run dev
```

Starts Vite dev server with hot reload.

```powershell
npm run build
```

Builds production assets into `dist/`.

```powershell
npm run test
```

Runs the complete review gate. This delegates to `test:all`.

```powershell
npm run test:all
```

Runs repository hygiene checks, API contract checks, UX regression checks, production build, bundle chunk budget check and visualization UI checks.

Individual checks:

- `npm run test:repository-hygiene`
- `npm run test:api-contract`
- `npm run test:loading-flow`
- `npm run test:home-ux`
- `npm run test:visualization-ui`
- `npm run test:build-chunks`

`test:build-chunks` expects a fresh `dist/`; `test:all` runs `npm run build` before it.

## Quality Gates Перед Ревью

Run from `front`:

```powershell
git status --short
npm run test
```

Expected state:

- `node_modules/`, `dist/` and Vite logs are not tracked by git.
- `package.json` name identifies the Drivee frontend, not the original Figma import.
- Runtime API payloads are protected by guards in `src/app/api.ts`.
- Loading, home UX and visualization behaviors are covered by regression scripts.
- Production bundle builds successfully.
- JS chunks stay under the configured 500 KiB budget.
- README and npm scripts describe the same workflow.

## Docker

Development container:

```powershell
docker compose up --build
```

Open:

```text
http://localhost:5173
```

Production image:

```powershell
docker build --target prod -t drivee-decision-room-front .
docker run --rm -p 8080:80 drivee-decision-room-front
```

Open:

```text
http://localhost:8080
```

The production stage serves static assets through Nginx. It does not proxy `/api/*`; production deployments need an external reverse proxy or an Nginx config that routes `/api/*` to backend.

## Manual Smoke Check

After `npm run test`, check the product flow manually when backend is available:

1. Home screen opens without layout overlap.
2. Prepared Ops/Finance scenario starts only after explicit action.
3. Loading screen does not claim validation is complete before backend response.
4. Successful result shows visualization, table, SQL, explain, confidence and recommended actions.
5. Ambiguous request opens clarification UI.
6. Backend errors render controlled error messaging instead of a blank screen.
7. Reports library opens saved session reports.

## Maintenance Rules

- Keep backend payload validation in `src/app/api.ts`.
- Keep product workflow state in `src/app/store.ts` or a dedicated app-level module.
- Keep reusable primitives generic under `src/app/components/ui`.
- Do not commit generated assets, dependency folders, local logs or env files.
- Prefer `npm ci` for clean installs and CI-like verification.
- Add a focused script in `scripts/` for each regression-prone frontend behavior.

## Origin

The initial interface was imported from Figma Make and then adapted for Drivee NL2SQL MVP. The current repository keeps Figma attribution files, but runtime package metadata and README describe the Drivee frontend product.
