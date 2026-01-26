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

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Database Commands

- `npx prisma studio` - Open Prisma Studio
- `npx prisma db push` - Push schema changes
- `npx prisma db seed` - Seed database with admin user
- `npx prisma generate` - Generate Prisma Client

## Application Structure

```
src/
├── actions/           # Server actions (auth, settings)
├── app/              # Next.js app directory
│   ├── (auth)/      # Auth pages
│   ├── (dashboard)/  # Protected dashboard pages
│   ├── auth/         # Additional auth pages
│   └── settings/     # Settings page
├── components/       # React components
│   ├── auth/        # Auth-related components
│   └── ui/          # Shadcn UI components
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries
├── types/           # TypeScript type definitions
└── utils/           # Server utilities
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
