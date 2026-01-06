# Daadaar Frontend - Project Structure

## Overview

Persian (Farsi) RTL web application built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, TanStack React Query, and MapLibre GL for mapping.

## Tech Stack

- **Framework:** Next.js 16.1.1 (App Router)
- **UI:** React 19, Radix UI, shadcn/ui pattern
- **Styling:** Tailwind CSS 4 + CSS Modules
- **State:** TanStack React Query 5
- **HTTP:** Axios
- **Maps:** MapLibre GL (OpenStreetMap tiles)
- **Icons:** Lucide React
- **Font:** Vazirmatn (primary font for all text)
- **Theme:** Blue and white color scheme

## Directory Structure

```
app/                        # Next.js App Router pages
├── layout.tsx              # Root layout with providers
├── page.tsx                # Homepage
└── [route]/page.tsx        # Route pages

src/
├── features/               # Feature-specific components
├── lib/                    # Utilities (axios, providers, utils)
└── shared/
    ├── common/             # Shared business components
    └── core/
        └── components/
            ├── ui/         # shadcn/ui components ONLY
            └── ...         # Other shared core components
```

## Path Aliases

```typescript
"@/*"    → "./*"
"core/*" → "./src/shared/core/*"
"src/*"  → "./src/*"
```

## Where to Place New Code

| Type | Location |
|------|----------|
| shadcn/ui components | `src/shared/core/components/ui/` |
| Shared core components | `src/shared/core/components/` |
| Feature components | `src/features/` |
| Pages | `app/[route]/page.tsx` |
| Utilities | `src/lib/` |
| Business logic | `src/shared/common/` |

## Conventions

- Persian (Farsi) language, RTL layout direction (`lang="fa"`, `dir="rtl"`)
- Use `"use client"` directive for client components
- Use `cn()` from `@/src/lib/utils` for conditional classes
- Default map center: Tehran `[51.3890, 35.6892]`
- API base URL: `NEXT_PUBLIC_API_URL` or `/api`

## Theming

- Colors defined as HSL values in `app/globals.css` (format: `h s% l%`)
- shadcn/ui components use CSS variables: `--primary`, `--secondary`, `--background`, etc.
- Light mode: Blue primary (`217 91% 50%`), white backgrounds
- Dark mode: Lighter blue primary (`217 91% 60%`), dark blue backgrounds
- Always use Tailwind color classes (`bg-primary`, `text-foreground`) — never hardcode colors

## Import Order

1. React/Next.js
2. Third-party libraries
3. Internal aliases (`core/*`, `src/*`, `@/*`)
4. Relative imports
