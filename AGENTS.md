# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Project Overview

Next.js 16 + React 19 meal planning app with shadcn/ui, Tailwind CSS v4, and TypeScript. Uses JSONBin for data persistence and Resend for email notifications.

## Build Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3000

# Production
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint (Next.js config + TypeScript)
npm run format           # Format all files with Prettier
npm run format:check     # Check formatting without writing
```

## Testing

No test framework configured yet. When adding tests:

- Use Vitest for unit tests
- Use Playwright for E2E tests
- Place test files alongside source files: `*.test.ts` or `*.test.tsx`

## Code Style Guidelines

### TypeScript

- Enable strict mode (already configured)
- Use explicit return types for exported functions
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, literals, and mapped types

### Naming Conventions

- **Components**: PascalCase (e.g., `Button`, `Navigation`)
- **Functions/Variables**: camelCase (e.g., `getData`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE for true constants (e.g., `DAYS_OF_WEEK`)
- **Types/Interfaces**: PascalCase (e.g., `Menu`, `Assignment`)
- **Files**: PascalCase for components, camelCase for utilities

### Imports

- Group imports: React/Next → External libraries → Internal (@/\*) → Relative
- Use `@/*` path alias for all internal imports
- Use named imports from `lucide-react` (tree-shakeable)

```typescript
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
```

### Formatting (Prettier)

- Single quotes
- Trailing commas (ES5 compatible)
- 100 character line width
- 2-space indentation
- Semicolons required

### Components

- Use `function` keyword for component definitions
- Destructure props in parameter list
- Use shadcn/ui patterns with `cva` for variants
- Apply `cn()` utility from `@/lib/utils` for class merging

```typescript
function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
```

### Error Handling

- Use try/catch for async operations
- Return structured error objects: `{ success: boolean; error?: string }`
- Log errors to console with context
- Use `sonner` for user-facing toast notifications

### Styling

- Use Tailwind CSS utility classes
- Prefer CSS variables from `globals.css` theme
- Mobile-first responsive design
- Use `shadcn/ui` color tokens (e.g., `--color-primary`)

### API Routes

- Use Next.js App Router convention: `app/api/[route]/route.ts`
- Return `NextResponse.json()` for consistent responses
- Handle errors with appropriate HTTP status codes

### Environment Variables

- Use `.env.local` for local secrets
- Prefix client-side variables with `NEXT_PUBLIC_`
- Validate env vars at runtime before use

## File Structure

```
app/                 # Next.js App Router
├── api/            # API routes
├── layout.tsx      # Root layout
├── page.tsx        # Home page
├── globals.css     # Global styles + Tailwind
components/
├── ui/             # shadcn/ui components
└── *.tsx           # Custom components
lib/
├── utils.ts        # Utility functions (cn, etc.)
├── types.ts        # TypeScript types
└── *.ts            # Service modules
public/             # Static assets
```

## shadcn/ui Usage

- Add components: `npx shadcn add [component]`
- Style: "new-york" variant
- Icons: Lucide React
- Use existing components from `@/components/ui/*`

## Key Dependencies

- next: ^16.1.6
- react: ^19.2.3
- tailwindcss: ^4
- radix-ui: ^1.4.3
- class-variance-authority: ^0.7.1
- lucide-react: ^0.575.0
