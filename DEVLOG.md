# Hard Squad — Лог разработки

Хронология того что было сделано, с датами и пометками.

---

## День 1 — 23 февраля 2026

### Настройка окружения

**Что было до этого дня:**
- Создана структура monorepo (`apps/frontend`, `apps/backend`)
- Написан базовый код: 4 страницы frontend, все backend роуты, Telegram bot команды, scheduler
- Установлены зависимости
- Инициализирован git

**Сделано сегодня:**

#### 1. CLAUDE.md — переписан под реальный контекст
- Добавлен раздел "Контекст пользователя — КРИТИЧНО" (пользователь не разработчик)
- Обновлён статус проекта
- Добавлены лимиты бесплатных тарифов
- Скорректирован стиль работы: делать самостоятельно, объяснять кратко

#### 2. Telegram Bot создан
- Бот: **@HardSquadBot** (имя: "Hard Squad")
- Создан через @BotFather
- `BOT_TOKEN` сохранён в `apps/backend/.env`

#### 3. Supabase — аккаунт и проект
- Зарегистрирован аккаунт через GitHub OAuth
- Создан проект **hard-squad**
- Регион: West EU (Ireland) — ближе к СНГ
- Получены ключи:
  - `SUPABASE_URL` — в `.env`
  - `SUPABASE_SERVICE_KEY` (service_role) — в `.env`

#### 4. База данных — схема создана
Создано 5 таблиц через Supabase Management API:
- `users` — пользователи (Telegram ID, streak)
- `squads` — группы (invite_code, created_by)
- `squad_members` — участники групп
- `daily_tasks` — запись задач на день (user + squad + date)
- `tasks` — отдельные задачи (text, is_done, position)

#### 5. Backend запущен локально
- `npm run dev` в `apps/backend`
- Бот подключился (long polling)
- Health check: `GET http://localhost:3000/health` → `{"ok":true}`

### Статус на конец дня
```
✅ Telegram Bot — создан, работает
✅ Supabase — проект создан, схема применена
✅ .env — все ключи вставлены
✅ Backend — запускается, бот онлайн, DB подключена
⏳ Frontend — не запускали, не тестировали
⏳ API endpoints — не тестировали через curl
⏳ Деплой — не настраивали
```

---

## День 2 — (следующий рабочий день)

> Заполнится после работы

**Планируется:**
- Запустить frontend локально
- Протестировать ключевые API endpoints
- Убедиться что авторизация через Telegram работает

---

## Шаблон для следующих дней

```
## День N — DD месяца YYYY

### Сделано
-

### Проблемы / что не пошло
-

### Статус
✅ ...
⏳ ...
❌ ...
```

---

## Ключевые данные проекта

| Параметр | Значение |
|----------|----------|
| Telegram Bot | @HardSquadBot |
| Supabase проект | hard-squad |
| Supabase регион | West EU (Ireland) |
| Supabase URL | https://ldbqqrbceylksuysbcaw.supabase.co |
| Backend (локально) | http://localhost:3000 |
| Frontend (локально) | http://localhost:5173 |

> Ключи (`BOT_TOKEN`, `SUPABASE_SERVICE_KEY`) хранятся только в `apps/backend/.env` — не коммитить в git.
