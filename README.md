# Drivee Decision Room Frontend

Фронтенд-часть MVP веб-сервиса аналитики Drivee: интерфейс для NL2SQL-сценариев, где пользователь задает бизнес-вопрос на естественном языке, получает проверяемый SQL-ответ, визуализацию, объяснение результата, confidence-оценку и следующие действия.

Приложение собрано как SPA на React + Vite и подключается к backend API Drivee NL2SQL через `/api/*`.

## Что есть в интерфейсе

- Главный экран Decision Room с готовыми Ops/Finance-сценариями и свободным вопросом.
- Clarification-first flow: если вопрос неоднозначный, backend возвращает варианты уточнения, а UI не показывает выдуманный результат.
- Trust-контур результата: SQL, explain, confidence, оценка стоимости, рекомендации и таблица данных.
- Автоматический выбор визуализации: line/bar/table-only по спецификации backend или fallback-логике UI.
- Библиотека сохраненных отчетов внутри локального in-memory store текущей сессии.
- Pilot KPI panel с baseline/target метриками и optional snapshot из `GET /api/pilot/kpi`.

## Технологический стек

- React 18
- TypeScript
- Vite 6
- React Router 7
- Tailwind CSS 4
- shadcn/Radix UI primitives
- MUI icons, lucide-react
- Recharts для графиков
- Docker / Nginx для production-сборки

## Структура проекта

```text
front/
  src/
    main.tsx                 # Точка входа React-приложения
    app/
      App.tsx                # RouterProvider
      routes.tsx             # Маршруты SPA
      api.ts                 # Контракты и fetch-клиент backend API
      store.ts               # Локальное состояние запросов и отчетов
      components/            # Экраны и UI-компоненты приложения
      components/ui/         # UI primitives
    styles/                  # Глобальные стили, тема, Tailwind
  Dockerfile                 # dev/build/prod stages
  docker-compose.yml         # Локальный dev-контейнер с Vite
  vite.config.ts             # Vite config, aliases, proxy /api -> backend
  package.json               # npm scripts и зависимости
```

## Требования

- Node.js 20+.
- npm, поставляется вместе с Node.js.
- Запущенный backend Drivee NL2SQL на `http://localhost:8000`, если нужен реальный ответ API.
- Docker, если запускаете фронтенд в контейнере.

## Быстрый локальный запуск

Команды ниже выполняются из папки `front`.

```bash
npm install
npm run dev
```

После запуска откройте:

```text
http://localhost:5173
```

По умолчанию Vite проксирует все запросы `/api/*` на:

```text
http://localhost:8000
```

Поэтому стандартный сценарий разработки:

1. Поднять backend API на `http://localhost:8000`.
2. Запустить фронтенд через `npm run dev`.
3. Открыть `http://localhost:5173`.

## Подключение к backend

Фронтенд использует следующие endpoint'ы:

- `POST /api/ask` - отправка NL2SQL-вопроса и получение результата, уточнения или контролируемой ошибки.
- `GET /api/pilot/kpi` - optional snapshot для Pilot KPI panel.

В dev-режиме можно оставить относительные `/api/*`: Vite proxy из `vite.config.ts` направит их в backend.

Если backend запущен на другом адресе, задайте переменную окружения:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

На Windows PowerShell:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8000"
npm run dev
```

Если `VITE_API_BASE_URL` не задана, frontend отправляет запросы на относительный путь `/api/...`.

## Backend перед запуском frontend

Минимальный backend-поток из корня репозитория:

```bash
python -m venv venv
venv\Scripts\pip install -r backend\requirements.txt
docker compose -f backend\docker-compose.yml --env-file backend\.env up -d
venv\Scripts\python -m backend.app.interfaces.cli.init_db_cli
venv\Scripts\python -m backend.app.interfaces.cli.init_vanna_cli
venv\Scripts\python -m backend.app.interfaces.http.server
```

После этого frontend сможет обращаться к API через Vite proxy.

## npm scripts

```bash
npm run dev
```

Запускает Vite dev server с hot reload.

```bash
npm run build
```

Собирает production bundle в `dist/`.

В проекте пока нет отдельных npm-скриптов для lint/test/typecheck.

## Запуск через Docker

### Development mode

Команды выполняются из папки `front`.

```bash
docker compose up --build
```

Откройте:

```text
http://localhost:5173
```

Контейнер запускает Vite на `0.0.0.0:5173`, монтирует текущую папку и сохраняет `node_modules` внутри контейнера.

### Production mode

```bash
docker build --target prod -t drivee-decision-room-front .
docker run --rm -p 8080:80 drivee-decision-room-front
```

Откройте:

```text
http://localhost:8080
```

Production stage собирает статические файлы через Vite и отдает их Nginx.

## Проверка сборки

Перед передачей изменений проверьте, что frontend собирается:

```bash
npm run build
```

Если backend доступен, дополнительно проверьте вручную:

1. Открывается главная страница.
2. Готовый Ops/Finance-сценарий проходит через loading screen.
3. Успешный ответ показывает таблицу, визуализацию, SQL и explain.
4. Неоднозначный запрос открывает экран уточнения.
5. Ошибки backend отображаются как контролируемые сообщения, а не как пустой экран.

## Частые проблемы

### API не отвечает

Проверьте, что backend запущен на `http://localhost:8000` или задана корректная `VITE_API_BASE_URL`.

### На главной нет historical KPI snapshot

Это допустимое состояние. Если `GET /api/pilot/kpi` недоступен или вернул невалидный payload, UI оставляет baseline/target панель и не ломает страницу.

### Production-контейнер не проксирует `/api`

Nginx stage в текущем `Dockerfile` отдает только статический frontend. Для production-интеграции нужен внешний reverse proxy или отдельная Nginx-конфигурация, которая направит `/api/*` в backend.

## Происхождение

Изначальный UI был импортирован из Figma Make, после чего адаптирован под Drivee NL2SQL MVP: добавлены контракты backend API, trust/guardrail UX, KPI panel, библиотека отчетов и Docker/Vite сценарии запуска.
