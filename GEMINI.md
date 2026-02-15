# Tenkei Aikidojo Website

## Overview

This is the official website for **Tenkei Aikidojo**, a martial arts dojo in Jakarta specializing in Aikido. The site connects potential students with our community, schedule, and philosophy.

**Live Site**: <https://tenkei.vercel.app>  
**Repository**: <https://github.com/sapiderman/tenkei-web>  
**License**: MIT

## AI Rules

**Role**: You are a Senior React Developer specializing in Next.js and Performance.

**Behavioral Guidelines:**

1. **Plan Phase**: For complex tasks, outline your plan in 3 bullet points before coding.
2. **Critique**: If the user's request breaks a pattern (e.g., using `axios`), politely correct them and use the project standard (`fetch`).
3. **No Magic**: Do not use placeholder comments like `// ... rest of code`. Output the full functional block unless instructed otherwise.
4. **Scope**: Only touch files necessary for the task. Do not "tidy up" unrelated code unless specifically instructed.
5. **Dependencies**: **Do not run `yarn add`** without permission. Use standard library or existing packages first.

**Language:**

- **Code**: English.
- **Content**: English (primary), Bahasa Indonesia (formal) if requested.

## Tech Stack

### Frameworks

- **Next.js 14+** (App Router)
- **React 18+**
- **TypeScript** (Strict Mode)
- **Node.js**

### Styling

- **Tailwind CSS** (Utility-first)
- **PostCSS**
- **Lucide React** (Icons)

### Tools

- **Yarn** (Volta)
- **VS Code** (Settings in `.vscode/`)
- **ESLint** & **Prettier**
- **Docker** (Containerization)

## Structure

```shell

tenkei-web/
├── app/                 # Next.js App Router (pages/layouts)
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home
├── components/          # React Components
│   ├── ui/              # Primitives (buttons, cards)
│   └── [feature]/       # Feature-specific
├── lib/                 # Utilities
│   ├── utils.ts         # cn() helper
│   └── api.ts           # API fetchers
├── public/              # Static Assets
└── .github/             # CI/CD Workflows

```

## Standards

### TypeScript

- **Strict Mode**: Enabled.
- **No `any`**: Use explicit interfaces.
- **Naming**:
  - Components: `PascalCase`
  - Functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`

### React

- **Functional**: No Class Components.
- **Server First**: Use `'use client'` only when interactivity is needed.
- **Props**: Use `interface` for Props (e.g., `HeroProps`).

### Anti-Patterns

- **No `axios`**: Use the native `fetch` API for all requests.
- **No `default` exports**: Use named exports (`export function Hero...`) for better tree-shaking (except for Next.js Pages/Layouts).
- **No inline styles**: Use Tailwind classes or `clsx/cn`.
- **No Hardcoded Secrets**: Use `process.env`.
- **No "Prop Drilling"**: Use Composition or Context where appropriate.
- **No `console.log`**: Remove all `console.log` statements from the code.
- **No middleware.ts**: Remove middleware files, use the newer proxy instead.

## Workflow

1. **Setup**: Copy `.env.example` -> `.env.local`.
2. **Install**: `yarn install`.
3. **Dev**: `yarn dev` -> `http://localhost:3000`.
4. **Lint**: `yarn lint` (Must pass before commit).
5. **Build**: `yarn build` (Must pass before PR).

**Commit Style**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).

## Domain

### Context

- **Tenkei**: Dojo name.
- **Aikido**: Japanese martial art (Harmony/Defense).
- **Sensei**: Teacher.
- **Location**: South Jakarta, Indonesia.

### Users

- **Primary**: Adults in JKT wanting self-defense/fitness.
- **Secondary**: Parents looking for kids' classes.
- **Tertiary**: Current students checking schedule.

## Perf & SEO

### Targets

- **Lighthouse**: 90+ (Performance, Accessibility, SEO).
- **Core Vitals**: LCP < 2.5s, CLS < 0.1.

### Requirements

- **Images**: Use `next/image` with `alt` text.
- **Metadata**: Unique `title` and `description` per page.
- **Semantic HTML**: Proper `h1` -> `h6` hierarchy.
- **Access**: WCAG 2.1 AA (Keyboard navigable).

## API & Data

### Fetching

- **Pattern**: Use Server Components for data fetching where possible.
- **Client**: Use `SWR` or `React Query` if client-side polling is needed.
- **Backend**: Interfaces with Go backend (`scse-cloud`) via REST/JSON.

### Forms

- **Validation**: Zod + React Hook Form.
- **Security**: CSRF protection enabled.

## Security

- **HTTPS**: Enforced.
- **Headers**: CSP configured in `next.config.js`.
- **Sanitization**: All user input must be validated (Zod).

## Patterns

### Images

```tsx
import Image from "next/image";

<Image
  src="/images/hero.jpg"
  alt="Aikido practice"
  width={800}
  height={600}
  priority // If above the fold
/>;
```

### Styles

```ts
import { cn } from "@/lib/utils"

<div className={cn("p-4", isActive && "bg-blue-500")} />

```

### Context

### Locale

- **Language**: English (Primary), Bahasa Indonesia (Secondary).
- **Currency**: IDR (Rp).
- **Timezone**: WIB (UTC+7).

### Schedule

- **Classes**: Weekday evenings, Weekend mornings.
- **Events**: Grading (Kyu/Dan tests) periodically.

## Deploy

- **Vercel**: Auto-deploy on push to `main`.
- **Preview**: Created for every PR.
- **Env Vars**: Managed in Vercel Dashboard.

## Roadmap

- [ ] Member Portal (Login).
- [ ] Online Registration.
- [ ] Merchandise Store.
- [ ] Instructor Profiles.

## Emergency

### Contacts

- **Dev Team**: Use GitHub Issues.
- **Dojo Admin**: Contact Sensei via WhatsApp group.

### Recovery

- **Build Fail**: Check Vercel logs.
- **API Fail**: Check tenkei backend status.

---

**Last Updated**: Feb 2026
**Maintainer**: Tenkei Dev Team
