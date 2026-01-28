# AGENTS.md - AI Agent Guidelines

This file provides essential information for AI agents working on this codebase.

## Commands

### Development
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint to check for issues

### Database
- `npm run prisma:init` - Initialize database (generate client, push schema, seed data)
- `npx prisma studio` - Open Prisma Studio for database GUI
- `npx prisma db push` - Push schema changes to database
- `npx prisma generate` - Regenerate Prisma Client

### Testing
**No test framework is currently configured in this project.** If tests are needed, set up a framework like Jest or Vitest first.

## Code Style Guidelines

### File Structure & Directives
- **Server Actions**: Start with `'use server'` at top of file
- **Client Components**: Start with `'use client'` at top of file
- Place server actions in `src/actions/`
- Place React components in `src/components/` with subdirectories (e.g., `auth/`, `ui/`)
- Place pages in `src/app/` following Next.js App Router conventions

### Imports
- Use absolute imports with `@/` alias for `src/` directory
- Third-party imports first, then local imports
- Import React components with explicit braces: `import { Component } from 'path'`
- Type-only imports: `import type { Type } from 'path'`

### TypeScript & Types
- Strict TypeScript mode is enabled
- Use interfaces for object shapes, types for unions/primitives
- Prefer explicit return types on exported functions
- Define custom types in `src/types/` (e.g., `next-auth.d.ts`)
- Use Zod schemas for runtime validation in server actions

### Naming Conventions
- **Variables/Functions**: camelCase (`userData`, `handleSubmit`)
- **Components**: PascalCase (`LoginForm`, `DashboardPage`)
- **Constants/Enums**: UPPER_SNAKE_CASE (`USER`, `ADMIN`)
- **Files**: kebab-case for utilities (`sql-parser.ts`), PascalCase for components (`LoginForm.tsx`)

### Server Actions
- Always validate input with Zod schemas
- Return objects with `{ success: boolean, error?: string, data?: any }`
- Use try-catch blocks and return error messages
- Example:
  ```ts
  'use server'
  export async function login(formData: FormData) {
    const validated = schema.safeParse(data)
    if (!validated.success) return { error: 'Invalid data' }
    try {
      // operation
      return { success: true }
    } catch (error) {
      return { error: 'Error message' }
    }
  }
  ```

### React Components
- Client components need `'use client'` directive
- Use React Hook Form + Zod for forms
- Use the `cn()` utility from `@/lib/utils` to merge Tailwind classes
- Components should be exportable functions: `export function ComponentName() {}`

### Error Handling
- Server actions: return error objects, don't throw
- Client components: use toast notifications with `useToast` hook
- Try-catch around async operations
- Provide user-friendly error messages

### Styling
- **Tailwind CSS v4** is used
- **Dark/Light Mode**: Use `light:` prefix for light mode overrides
- **Custom Classes**: Use glassmorphism classes like `glass-card`, `glass-button`, `bento-card`
- **Color Palette**: Purple/violet theme with `hsl(var(--primary))` CSS variables
- **Utilities**: Use `cn()` to merge classes with proper precedence

### Database (Prisma)
- Prisma singleton pattern in `src/lib/prisma.ts` prevents multiple instances in dev
- Schema file: `prisma/schema.prisma`
- Use `await prisma.{model}.{operation}(...)` for queries
- Models: User, Account, Session, VerificationToken

### Authentication
- NextAuth v5 with credentials provider
- Protected routes: use `await currentUser()` utility in server components
- Role-based access: check `user.role === 'ADMIN'`
- RoleGate component for conditional rendering in client components

### Forms
- React Hook Form with Zod resolver
- Form schemas defined with `z.object({...})`
- Type inference with `z.infer<typeof schema>`
- Handle FormData conversion: `Object.fromEntries(formData.entries())`

### UI Components (Shadcn/UI)
- Located in `src/components/ui/`
- Built on Radix UI primitives
- Use `class-variance-authority` for variant management
- Forward refs properly for composition

### API Routes
- Next.js 15 App Router in `src/app/api/`
- Use standard HTTP methods (GET, POST, etc.)
- NextAuth routes in `src/app/api/auth/[...nextauth]/route.ts`

## Important Notes

- Always check for existing patterns before creating new code
- Follow the existing component structure (check similar files)
- Test changes in dev server before committing
- Run `npm run lint` before pushing changes
- Database changes require `npx prisma db push` after schema updates
