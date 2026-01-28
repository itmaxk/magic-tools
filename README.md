# Magic Tools Web

Web tools for Magic development team with authentication and SQL mapping functionality.

## Features

- 🔐 NextAuth v5 authentication with credentials provider
- 👥 User roles (Admin & User)
- 🗄️ SQLite database with Prisma ORM
- 📧 Email verification (requires SMTP configuration)
- 🔒 Password reset functionality
- 📱 Two-factor authentication (2FA) support
- 🗄️ SQL Mapper tool (PostgreSQL & MySQL)
- ⚙️ User settings management (email, password, 2FA)
- 🎨 Shadcn/UI components with Tailwind CSS v4
 - 🛡️ Role-based access control
 - 🌐 Responsive design with dark mode support
 - 🤖 Telegram bot for automated SonarQube issues fetching

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   - Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`
   - Configure SMTP settings for email functionality
   - (Optional) Configure OAuth providers (GitHub, Google)

3. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## SQL Mapper Tool

The SQL Mapper tool helps you generate mapping files from SQL queries:

1. Navigate to Dashboard → SQL Mapper
2. Select SQL dialect (PostgreSQL or MySQL)
3. Enter your SQL query
4. Click "Parse SQL"
5. View and download generated files:
   - `inputMapping.js` - Maps input parameters (@variable syntax)
   - `inputSchema.json` - JSON schema for input
   - `resultMapping.js` - Maps result columns (camelCase)
   - `resultSchema.json` - JSON schema for result

### Example Usage

For PostgreSQL:
```sql
SELECT CONTRACT_ID, AMENDMENT_NUMBER, ATT1, ATT2 
FROM contracts 
WHERE ATT1 = @att1 AND ATT2 = @att2
```

For MySQL:
```sql
SELECT CONTRACT_ID, AMENDMENT_NUMBER, ATT1, ATT2 
FROM contracts 
WHERE ATT1 = :att1 AND ATT2 = :att2
```

The tool will automatically:
- Extract input parameters (@att1, @att2 for PostgreSQL, :att1, :att2 for MySQL)
- Extract result columns (CONTRACT_ID, AMENDMENT_NUMBER, ATT1, ATT2)
- Convert to camelCase (contractId, amendmentNumber, att1, att2)
 - Generate appropriate type detection (integer for SEQ_NUMBER, AMENDMENT_NUMBER)

## Telegram Bot

The Telegram bot automates the process of fetching SonarQube issues from GitLab merge requests and posting them back to GitLab.

### Setup

1. **Create a Telegram bot:**
   - Open [@BotFather](https://t.me/BotFather) in Telegram
   - Send `/newbot` command
   - Follow the instructions to create your bot
   - Copy the bot token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

2. **Configure environment variables:**
   Add the bot token to your `.env` file:
   ```env
   BOT_TOKEN="your-telegram-bot-token-here"
   ```

   Ensure the following variables are also configured (already in your `.env`):
   ```env
   GITLAB_URL="https://your-gitlab-domain.com"
   GITLAB_TOKEN="your-gitlab-personal-access-token"
   GITLAB_PROJECT="your-project-name"
   SONAR_URL="https://your-sonarqube-domain.com"
   SONAR_TOKEN="your-sonarqube-token"
   SONAR_PROJECT="your-sonarqube-project"
   ```

3. **Start the bot:**
   
   The bot runs as a separate process alongside the Next.js application. You have two options:

   **Option A: Run only the bot**
   ```bash
   npm run dev:bot
   ```

   **Option B: Run both Next.js and bot (recommended)**
   
   Open two terminal windows:

   **Terminal 1 (Next.js server):**
   ```bash
   npm run dev
   ```

   **Terminal 2 (Telegram bot):**
   ```bash
   npm run dev:bot
   ```

   You should see the following messages:
   ```
   [bot-server] Starting Telegram bot...
   [bot-server] Telegram bot started successfully!
   ```

### Usage

Once the bot is running, you can interact with it in Telegram:

#### Available Commands

1. **`/start`** - Initialize conversation
   ```
   Response: Привет! Отправьте MR ID (например: 12767), и я получу SonarQube issues и отправлю их в GitLab.
   ```

2. **`/help`** - Display usage instructions
   ```
   Response: Использование: просто отправьте MR ID (например: 12767)
   ```

#### Processing Merge Requests

1. Send a Merge Request ID (just the number, e.g., `12767`)

2. The bot will:
   - Validate the MR ID (must be numeric only)
   - Fetch GitLab merge request details
   - Extract SonarQube URL from MR description
   - Fetch SonarQube issues from the SonarQube URL
   - Post a summary comment to the GitLab merge request

3. You'll receive status updates:
   ```
   🔍 Получаю SonarQube issues для MR #12767...
   ✅ Успешно! Найдено 15 issues, отправлено в GitLab.
   ```

#### Example Workflow

```
You: 12767
Bot: 🔍 Получаю SonarQube issues для MR #12767...
Bot: ✅ Успешно! Найдено 15 issues, отправлено в GitLab.
```

#### Error Handling

The bot handles various error scenarios:

- **Invalid MR ID:**
  ```
  You: abc123
  Bot: Пожалуйста, введите корректный MR ID (только цифры)
  ```

- **API Errors:**
  ```
  Bot: ❌ Ошибка: Failed to fetch merge request: 404 Not Found
  ```

### Bot Comment Format

When posting to GitLab, the bot creates a formatted comment:

```markdown
### 📊 SonarQube Issues Report

[View in SonarQube](sonarqube-url)

#### Summary
- Total Issues: **15**
- **BLOCKER**: 0
- **CRITICAL**: 2
- **MAJOR**: 8
- **MINOR**: 4
- **INFO**: 1

#### 🔴 Critical Issues
**CRITICAL:**
- `rule-name`: Issue description...
- ...and 1 more
```

### Troubleshooting

#### Bot won't start

**Error: `Empty token!`**
- Solution: Make sure `BOT_TOKEN` is set in `.env` file

**Error: `Unauthorized`**
- Solution: Verify your BOT_TOKEN is correct and not expired

#### Bot doesn't respond to messages

1. Check if the bot is running:
   ```bash
   # Should see: [bot-server] Telegram bot started successfully!
   ```

2. Check the terminal for error messages

3. Verify you're sending messages to the correct bot

#### Fetch Issues fails

**Error: `Failed to fetch merge request`**
- Check `GITLAB_TOKEN` is valid
- Verify `GITLAB_URL` and `GITLAB_PROJECT` are correct
- Ensure the MR ID exists

**Error: `Failed to fetch SonarQube issues`**
- Check `SONAR_TOKEN` is valid
- Verify `SONAR_URL` and `SONAR_PROJECT` are correct
- Ensure the MR has SonarQube analysis linked

#### Post to GitLab fails

- Ensure `GITLAB_TOKEN` has appropriate permissions (api, read_repository, write_repository)
- Check network connectivity to GitLab

### Bot Architecture

- **Long Polling**: Uses grammy's default polling mechanism
- **Independent Process**: Runs separately from Next.js for better isolation
- **Error Recovery**: Handles API errors gracefully and reports to user
- **Multi-user**: Can handle multiple users simultaneously

### Advanced Configuration

#### Custom Bot Name

When creating the bot via @BotFather, choose a descriptive name like `magic-sonar-bot` to easily identify it in Telegram.

#### Multiple Environments

For development/staging/production, use different bot tokens:
```env
# Development
BOT_TOKEN="dev-bot-token"

# Production
BOT_TOKEN="prod-bot-token"
```

### Security Notes

- Keep `BOT_TOKEN` secret - it gives full control over your bot
- Store `.env` in `.gitignore` (already configured)
- Rotate bot tokens periodically
- Monitor bot activity logs

## Development

### Available Scripts

- `npm run dev` - Start development server (Next.js only)
- `npm run dev:bot` - Start Telegram bot only
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

**Recommended Development Workflow:**
```bash
# Terminal 1: Next.js server
npm run dev

# Terminal 2: Telegram bot
npm run dev:bot
```

### Database Commands

- `npx prisma studio` - Open Prisma Studio
- `npx prisma db push` - Push schema changes
- `npx prisma db seed` - Seed database with admin user
- `npx prisma generate` - Generate Prisma Client

## Application Structure

```
src/
├── actions/           # Server actions (auth, settings, sonar)
├── app/              # Next.js app directory
│   ├── (auth)/      # Auth pages
│   ├── (dashboard)/  # Protected dashboard pages
│   ├── auth/         # Additional auth pages
│   └── settings/     # Settings page
├── components/       # React components
│   ├── auth/        # Auth-related components
│   └── ui/          # Shadcn UI components
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries (gitlab-client, sonar-client, openai-client)
├── types/           # TypeScript type definitions
└── utils/           # Server utilities

bot-server.js        # Telegram bot script (standalone process)
```

## Authentication Features

### Supported Auth Flows

1. **Credentials Login** - Email/password authentication
2. **Email Verification** - Required for new accounts
3. **Password Reset** - Forgot password flow
4. **Two-Factor Auth** - Optional 2FA using TOTP

### User Roles

- **ADMIN** - Full access to all sections including admin panel
- **USER** - Access to dashboard and SQL mapper

### Protected Routes

- `/dashboard/*` - Requires authentication
- `/settings` - Requires authentication
- `/dashboard/admin` - Requires ADMIN role

## Email Configuration

To enable email functionality, configure SMTP in `.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"
```

**Note**: For Gmail, you need to:
1. Enable 2FA on your Google account
2. Create an App Password in Google Account settings
3. Use the App Password as `SMTP_PASSWORD`

## Security Notes

- All passwords are hashed using bcrypt
- JWT tokens for session management
- CSRF protection via NextAuth
- SQL injection prevention via Prisma ORM
- Role-based access control for sensitive operations

## Troubleshooting

### Database Issues
```bash
# Reset database
rm prisma/dev.db
npx prisma db push
npx prisma db seed
```

### Email Not Working
- Verify SMTP settings in `.env`
- Check firewall allows SMTP connections
- For Gmail, ensure App Password is used (not regular password)

### Build Errors
```bash
# Clean and rebuild
rm -rf .next
npm run build
```

## License

MIT

## Support

For issues or questions, please contact the development team.
