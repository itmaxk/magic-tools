# Magic Tools

Набор веб-инструментов для команды разработки: парсинг SQL-запросов, маппинг JSON, анализ отчётов SonarQube и автоматизация через Telegram-бот.

## Возможности

- SQL Mapper — парсинг SQL-запросов (PostgreSQL и MySQL) и генерация маппинг-файлов
- JSON Mapper — трансформация и валидация JSON-структур данных
- Sonar Logs — анализ отчётов качества кода из SonarQube
- Telegram-бот — автоматическое получение SonarQube issues из GitLab MR
- Аутентификация NextAuth v5 с ролевой моделью (Admin / User)
- Двухфакторная аутентификация (2FA, TOTP)
- Email-верификация и сброс пароля (SMTP)
- SQLite база данных через Prisma ORM
- UI на Shadcn/UI с Tailwind CSS v4, тёмная тема

## Установка и настройка

### Требования

- Node.js 20+
- npm

### Установка

1. Установка зависимостей:
   ```bash
   npm install
   ```

2. Настройка переменных окружения:
   ```bash
   cp .env.example .env
   ```

   Отредактируйте `.env`:
   - `NEXTAUTH_SECRET` — сгенерировать: `openssl rand -base64 32`
   - SMTP-настройки для отправки email
   - GitLab и SonarQube токены (для Sonar Logs и бота)

3. Инициализация базы данных:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

4. Запуск сервера разработки:
   ```bash
   npm run dev
   ```

5. Откройте [http://localhost:3003](http://localhost:3003) в браузере

## SQL Mapper

Инструмент парсит SQL-запросы и генерирует маппинг-файлы для интеграции.

### Использование

1. Dashboard → SQL Mapper
2. Выберите диалект SQL (PostgreSQL или MySQL)
3. Введите SQL-запрос
4. Нажмите "Parse SQL"
5. Получите сгенерированные файлы:
   - `inputMapping.js` — маппинг входных параметров
   - `inputSchema.json` — JSON-схема входных данных
   - `resultMapping.js` — маппинг результирующих колонок (camelCase)
   - `resultSchema.json` — JSON-схема результата

### Примеры

Простой запрос (PostgreSQL):
```sql
SELECT CONTRACT_ID, AMENDMENT_NUMBER, ATT1, ATT2
FROM contracts
WHERE ATT1 = @att1 AND ATT2 = @att2
```

Простой запрос (MySQL):
```sql
SELECT CONTRACT_ID, AMENDMENT_NUMBER, ATT1, ATT2
FROM contracts
WHERE ATT1 = :att1 AND ATT2 = :att2
```

Сложный запрос с подзапросами:
```sql
SELECT a.COL1, (SELECT MAX(b.ID) FROM other_table b WHERE b.X = a.X) AS MAX_ID,
       a.STATUS
FROM main_table a
WHERE a.STATUS = @status
```

Парсер корректно обрабатывает вложенные подзапросы — подзапрос в скобках распознаётся как единый токен, а `FROM` внутри подзапроса не путается с `FROM` основного запроса.

Инструмент автоматически:
- Извлекает входные параметры (`@param` для PostgreSQL, `:param` для MySQL)
- Извлекает результирующие колонки, включая алиасы через `AS`
- Конвертирует имена в camelCase (`contractId`, `amendmentNumber`, `att1`, `att2`)
- Определяет типы (integer для `SEQ_NUMBER`, `AMENDMENT_NUMBER`; object для JSON-колонок)

## JSON Mapper

Инструмент для трансформации и валидации JSON-структур данных с продвинутыми возможностями маппинга.

## Sonar Logs

Анализ и визуализация отчётов качества кода из SonarQube.

### Возможности

- Получение SonarQube issues по URL или через GitLab MR
- Автоматическое извлечение ссылки на SonarQube из описания MR
- Публикация найденных issues обратно в GitLab как комментарий к MR
- Быстрый ввод по MR ID с автоподстановкой URL

## Telegram-бот

Автоматизация процесса получения SonarQube issues из GitLab merge requests.

### Настройка

1. Создайте бота через [@BotFather](https://t.me/BotFather) в Telegram
2. Добавьте токен в `.env`:
   ```env
   BOT_TOKEN="your-telegram-bot-token"
   ```
3. Убедитесь, что настроены переменные GitLab и SonarQube:
   ```env
   GITLAB_URL="https://your-gitlab-domain.com"
   GITLAB_TOKEN="your-gitlab-token"
   GITLAB_PROJECT="your-project-name"
   SONAR_URL="https://your-sonarqube-domain.com"
   SONAR_TOKEN="your-sonarqube-token"
   SONAR_PROJECT="your-sonarqube-project"
   ```

### Запуск

```bash
# Только бот
npm run dev:bot

# Бот + Next.js (в двух терминалах)
npm run dev      # Терминал 1
npm run dev:bot  # Терминал 2
```

### Команды бота

- `/start` — инициализация
- `/help` — справка
- Отправьте MR ID (число) — бот получит SonarQube issues и опубликует их в GitLab

### Пример

```
Вы: 12767
Бот: 🔍 Получаю SonarQube issues для MR #12767...
Бот: ✅ Успешно! Найдено 15 issues, отправлено в GitLab.
```

## Аутентификация и роли

### Поддерживаемые способы

- Вход по email и паролю
- Email-верификация новых аккаунтов
- Сброс пароля
- Двухфакторная аутентификация (TOTP)

### Роли

- **ADMIN** — полный доступ, включая панель администрирования
- **USER** — доступ к dashboard и инструментам

### Защищённые маршруты

- `/dashboard/*` — требуется аутентификация
- `/settings` — требуется аутентификация
- `/dashboard/admin` — требуется роль ADMIN

## Структура проекта

```
src/
├── actions/           # Server actions (auth, settings, sonar)
├── app/               # Next.js App Router
│   ├── (auth)/        # Страницы авторизации
│   ├── (dashboard)/   # Защищённые страницы dashboard
│   ├── api/           # API-маршруты
│   └── auth/          # Дополнительные auth-страницы
├── components/        # React-компоненты
│   ├── auth/          # Компоненты авторизации
│   └── ui/            # Shadcn UI компоненты
├── hooks/             # Кастомные React-хуки
├── lib/               # Библиотеки (gitlab-client, sonar-client, sql-parser)
├── types/             # TypeScript-типы
├── styles/            # Общие стили
└── utils/             # Серверные утилиты

bot-server.js          # Telegram-бот (отдельный процесс)
```

## Команды разработки

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск сервера разработки (Next.js) |
| `npm run dev:bot` | Запуск Telegram-бота |
| `npm run build` | Сборка для production |
| `npm start` | Запуск production-сервера |
| `npm run lint` | Проверка ESLint |
| `npx prisma studio` | Открыть Prisma Studio |
| `npx prisma db push` | Применить изменения схемы |
| `npx prisma db seed` | Заполнить БД начальными данными |
| `npx prisma generate` | Сгенерировать Prisma Client |

## Настройка email

Для работы email добавьте SMTP-настройки в `.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"
```

Для Gmail: включите 2FA на аккаунте Google и используйте App Password.

## Безопасность

- Пароли хешируются bcrypt
- JWT-токены для управления сессиями
- CSRF-защита через NextAuth
- Защита от SQL-инъекций через Prisma ORM
- Ролевой контроль доступа

## Устранение неполадок

### Проблемы с БД
```bash
rm prisma/dev.db
npx prisma db push
npx prisma db seed
```

### Ошибки сборки
```bash
rm -rf .next
npm run build
```

### Email не работает
- Проверьте SMTP-настройки в `.env`
- Для Gmail используйте App Password, а не обычный пароль

## Лицензия

MIT
