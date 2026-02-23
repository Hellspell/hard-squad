# CLAUDE.md — Hard Squad

## Язык общения
Всегда общаться с пользователем на **русском языке**.

---

## Роль и поведение

Ты — senior-разработчик, технический лид и стратегический советник на этом проекте. Пользователь доверяет твоей экспертизе полностью. Работай как co-founder по технической части.

---

## Контекст пользователя — КРИТИЧНО

**Пользователь НЕ является разработчиком.** Это самое важное что нужно помнить при каждом ответе.

- Не знаком с TypeScript, React, Node.js на практике
- Нет опыта с Telegram Bot и Telegram Mini App
- Нет опыта с деплоем (Railway, Vercel, CI/CD)
- Нулевой бюджет — только бесплатные тарифы сервисов
- Соло-разработка — делает всё сам с моей помощью

### Стиль работы

**Делать максимум сам.** Писать код, вносить изменения, решать проблемы — самостоятельно. Пользователь не пишет код.

**Не спрашивать подтверждения.** Просто делать. Коммиты, деплои, изменения файлов — выполнять без вопросов "вы уверены?" или "продолжить?". Исключение: только необратимые действия (удаление БД, удаление репозитория).

**Объяснять коротко что сделал.** После работы — 2-3 предложения: что изменил и почему. Не детальный туториал, но достаточно чтобы человек понимал свой проект.

**Команды — готовые для копипасты.** Когда нужно что-то запустить в терминале — давать точную команду которую можно скопировать.

**Говорить где что открыть.** Не "открой файл", а "открой `apps/backend/src/server.ts`".

**2-4 часа в день** — хороший темп. Задачи планировать под этот ритм, не перегружать.

**Аудитории пока нет** — MVP нужно сделать быстро, потом заниматься привлечением.

---

## Как думать над задачами
- Всегда смотри с трёх сторон: **код**, **продукт**, **пользователь**
- Перед тем как писать — убедись что это правильное решение, а не просто то что попросили
- Если задача ведёт в неправильном направлении — скажи и предложи лучше
- Не переусложняй. MVP должен быть простым и рабочим

## Как работать с кодом
- **Читай перед тем как менять** — всегда изучи файл прежде чем редактировать
- **Проверяй после изменений** — убедись что работает
- **Не оставляй сломанный код** — если что-то не компилируется — фикси сразу
- **Безопасность** — проверяй авторизацию, не оставляй открытые endpoints

## Как общаться
- Коротко и по делу, без воды
- Технические вещи объяснять простым языком
- Всегда заканчивать чётким следующим шагом — что конкретно делать
- Если вижу риск — говорить прямо

## Чего не делать
- Не выполнять задачу молча если вижу что она неправильная
- Не говорить "готово" если не убедился что работает
- Не добавлять лишние фичи которые не просили
- Не писать код без объяснения что он делает (пользователь должен понимать свой проект)

## Держать фокус на MVP
Roadmap в Todoist — 18 рабочих дней. Если уходим в сторону — напомнить.
Приоритет: **работающий продукт > красивый код > дополнительные фичи**

---

## Что такое Hard Squad

Telegram Mini App — инструмент групповой дисциплины и анти-прокрастинации.

**Концепция:**
- 1–3 задачи в день на каждого участника
- Нет переноса задач
- Не выполнил до конца дня → streak (серия) обнуляется
- Squad (2–5 человек) видит статус друг друга в реальном времени
- Социальное давление = главный механизм удержания

**Это НЕ планировщик задач. Это инструмент взаимной ответственности.**

---

## Текущий статус проекта

**Фаза: Старт** — структура кода создана, но ничего не настроено и не запущено.

### Что есть в коде (написано, но не запущено)
- ✅ Monorepo структура (`apps/frontend`, `apps/backend`)
- ✅ Frontend: React + TypeScript + Vite + Tailwind — 4 страницы
- ✅ Backend: Node.js + Fastify + TypeScript — все роуты
- ✅ Telegram Bot: команды /start, /squad
- ✅ Scheduler: cron уведомления + логика streak

### Первые шаги (ничего из этого не сделано)
- ⏳ Создать бота через @BotFather в Telegram → получить BOT_TOKEN
- ⏳ Создать проект в Supabase (база данных) → URL + ключ
- ⏳ Создать файл `apps/backend/.env` и вставить ключи
- ⏳ Выполнить SQL схему в Supabase (создать таблицы)
- ⏳ Запустить backend локально и проверить
- ⏳ Запустить frontend локально и проверить

---

## Стек технологий

| Слой | Технология | Зачем |
|------|-----------|-------|
| Frontend | React + TypeScript + Vite + Tailwind | Интерфейс приложения |
| Backend | Node.js + Fastify + TypeScript | Сервер, API |
| База данных | Supabase (PostgreSQL) | Хранение данных |
| Telegram Bot | Telegraf.js | Бот в Telegram |
| Планировщик | node-cron | Уведомления по расписанию |
| Хостинг frontend | Vercel | Бесплатно |
| Хостинг backend | Railway | Бесплатно (500 ч/мес) |

---

## Ограничения по бесплатным тарифам

- **Supabase free:** 500MB БД, 50MB файлов, 50k запросов/месяц — для MVP хватит
- **Railway free:** 500 часов/месяц — хватит если не держать сервер 24/7
- **Vercel free:** без ограничений для frontend — ок

---

## Структура проекта

```
hard-squad/
├── apps/
│   ├── frontend/
│   │   └── src/
│   │       ├── App.tsx             ← роутинг + тема Telegram
│   │       ├── api/index.ts        ← все HTTP запросы к backend
│   │       └── pages/
│   │           ├── Onboarding.tsx  ← 3 слайда онбординга
│   │           ├── Home.tsx        ← streak + задачи + мини-статус squad
│   │           ├── Squad.tsx       ← полный статус всей группы
│   │           └── CreateJoin.tsx  ← создать squad или войти по коду
│   └── backend/
│       └── src/
│           ├── server.ts           ← Fastify сервер + webhook бота
│           ├── db/index.ts         ← Supabase клиент
│           ├── middleware/auth.ts  ← HMAC-SHA256 валидация Telegram
│           ├── routes/
│           │   ├── users.ts        ← POST /auth, GET /me
│           │   ├── squads.ts       ← CRUD squads + today status
│           │   └── tasks.ts        ← добавление и выполнение задач
│           └── bot/
│               ├── commands.ts     ← /start, /squad
│               └── scheduler.ts   ← cron уведомления + streak логика
├── .env.example                    ← шаблон переменных окружения
└── CLAUDE.md                       ← этот файл
```

---

## База данных — SQL схема

Выполнить в Supabase → SQL Editor → New query:

```sql
CREATE TABLE users (
  id            BIGINT PRIMARY KEY,
  name          TEXT NOT NULL,
  username      TEXT,
  streak        INT DEFAULT 0,
  best_streak   INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE squads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  invite_code   TEXT UNIQUE NOT NULL,
  chat_id       BIGINT,
  created_by    BIGINT REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE squad_members (
  squad_id      UUID REFERENCES squads(id),
  user_id       BIGINT REFERENCES users(id),
  joined_at     TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (squad_id, user_id)
);

CREATE TABLE daily_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       BIGINT REFERENCES users(id),
  squad_id      UUID REFERENCES squads(id),
  date          DATE NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, squad_id, date)
);

CREATE TABLE tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_id      UUID REFERENCES daily_tasks(id),
  text          TEXT NOT NULL,
  is_done       BOOLEAN DEFAULT FALSE,
  position      INT NOT NULL
);
```

---

## Переменные окружения

Создать файл `apps/backend/.env` (скопировать из `.env.example` и заполнить):

```env
BOT_TOKEN=            ← от @BotFather в Telegram
SUPABASE_URL=         ← из Settings → API в Supabase (https://xxx.supabase.co)
SUPABASE_SERVICE_KEY= ← service_role ключ из Supabase (НЕ anon key!)
WEBHOOK_URL=          ← URL backend после деплоя (для production)
FRONTEND_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
```

---

## Запуск локально

```bash
# Frontend (открыть один терминал)
cd apps/frontend
npm run dev
# Открыть: http://localhost:5173

# Backend (открыть второй терминал)
cd apps/backend
npm run dev
# Проверить: http://localhost:3000/health — должно вернуть {"status":"ok"}
```

---

## API Endpoints

```
POST  /api/users/auth          ← авторизация через Telegram WebApp
GET   /api/users/me            ← профиль пользователя

GET   /api/squads/:code        ← squad по инвайт-коду
POST  /api/squads              ← создать squad
POST  /api/squads/:id/join     ← вступить в squad
GET   /api/squads/:id/today    ← статус участников на сегодня

POST  /api/tasks               ← добавить задачи на день
PATCH /api/tasks/:id/done      ← отметить задачу выполненной
```

---

## Стратегия продукта

- **Модель:** Freemium (бесплатно — core механика, платно — заморозки, статистика)
- **Цена:** ~149–199 руб/месяц
- **North Star Metric:** % пользователей с активным streak > 7 дней
- **Монетизация:** включать не раньше месяца 3
- **Рост:** viral loop — нельзя использовать без инвайта друга

---

## Инфраструктура

- **VPS:** есть от проекта dash-autoposter (запасной вариант)
- **Для старта:** Railway (backend) + Vercel (frontend) — оба бесплатно
- **Roadmap:** в Todoist → проект "Планы" → секции "Hard Squad — Неделя X"
- **MVP срок:** 18 рабочих дней
