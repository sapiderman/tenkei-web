# Tenkei Aikidojo Website

Official website for Tenkei Aikidojo — a martial arts dojo in Jakarta, Indonesia.
**Live**: <https://tenkeiaikidojo.org> · **Repo**: <https://github.com/sapiderman/tenkei-web>

## Tech Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS · Yarn v4 (Corepack) · Vercel

- **i18n**: `i18next` / `react-i18next` / `next-i18n-router` — 3 locales: `en`, `id`, `ja`
- **Routing**: `proxy.ts` handles CSP headers + i18n routing (Next.js 16 edge proxy — replaces `middleware.ts`)
- **Forms**: Native React state for client-side validation. Do not introduce React Hook Form or other form libraries without explicit user approval.
- **Rate limiting**: in-memory per-IP limiter in `app/api/auth/_lib.ts`, env-tunable via `RATE_LIMIT_MAX_REQUESTS` (default 10) and `RATE_LIMIT_WINDOW_MINUTES` (default 15). See `.env.example`. Per-instance only — the Go backend's limiter is the authoritative gate.
- **Turnstile**: all auth forms (register, login) include a Cloudflare Turnstile widget (`@marsidev/react-turnstile`, site key `NEXT_PUBLIC_TURNSTILE_SITE_KEY`). The client sends `cf_turnstile_response`; the Next proxy only format-checks it (`isValidTurnstileToken` in `app/api/auth/_lib.ts`) — the Go backend verifies via siteverify. Tokens are single-use: reset the widget after any failed submission.

## Key Directories

```shell
app/[lang]/        # Localized pages (en, id, ja)
app/i18n/          # Server (getT) + client (useTranslation) i18n hooks
components/        # Shared React components
lib/constants.ts   # Shared constants
public/locales/    # Translation JSON files (en, id, ja)
.agents/skills/    # Agent skill files — read next-best-practices/SKILL.md for Next.js tasks
```

## Coding Conventions

- **Server Components by default** — use `'use client'` only when necessary
- **Functional components only** — no class components
- **No `any`** — prefer explicit types; use `interface` for object shapes, `type` for unions
- **Naming**: Components `PascalCase`, functions `camelCase`, constants `UPPER_SNAKE_CASE`, utility files `kebab-case`
- **Styling**: Tailwind-first, mobile-first (`md:` 768px, `lg:` 1024px, `xl:` 1280px)
- **Images**: Always use `<Image>` from `next/image`
- **Global chrome**: `Header` and `Footer` are rendered once in `app/[lang]/layout.tsx` — never import or re-render them inside a page
- **Session-aware CTA**: reuse `components/joinButton.tsx` (`variant="light"` on paper, `variant="dark"` on `bg-ai`) — do not inline the `tenkei_session` cookie check
- **Git**: Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`)

## i18n Patterns

Server component:

```typescript
import { getT } from "@/app/i18n";
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { t } = await getT(lang, "common");
  return <h1>{t("key")}</h1>;
}
```

Client component:

```typescript
'use client'
import { useTranslation } from "@/app/i18n/client";
export function Btn({ lang }: { lang: string }) {
  const { t } = useTranslation(lang, "common");
  return <button>{t("key")}</button>;
}
```

## Agent Workflow

Work through each phase in order; do not skip ahead.

### Phase 1: Understand & Plan

Before suggesting or implementing any changes, load this skill [SKILL.md](https://github.com/multica-ai/andrej-karpathy-skills/blob/main/skills/karpathy-guidelines/SKILL.md).

1. **Read relevant files first** before making changes.
2. **Understand the requirement** — ask for clarification if ambiguous.
3. **Check existing patterns** — if an existing file violates a coding standard (e.g., uses `any`), follow the standard for new code and add a `// TODO: existing violation` comment. Do not silently replicate the bad pattern.
4. **Plan the approach** — what files need to be created/modified?
5. **Consider localization early** — when adding new translation keys, add the key with an English value to all three locale files (`en`, `id`, `ja`). If you don't know the `id`/`ja` translation, use English as placeholder with `// TODO: translate` comment.

### Phase 2: Implement

1. **Follow established patterns** — don't introduce new patterns without discussion.
2. **Accessibility**: semantic HTML, ARIA where needed, keyboard navigation, 4.5:1 contrast ratio.
3. **Performance**: consider bundle size, use Next.js `<Image>`, leverage automatic code splitting.
4. **When adding dependencies**, specify `dependencies` vs `devDependencies`.
5. **Do not output more than 20 lines of code in chat** — use file editing tools to apply changes directly.

### Phase 3: Validate

1. **Run `yarn lint`** and **`yarn build`** before finalizing. If either fails, fix all errors and report them. Do not leave the build broken.
2. **Check for TypeScript errors** (no `any`).
3. **Verify**: responsive design, accessibility, SEO meta tags (localized), no console errors, all user-facing strings in translation files.

### Phase 4: Communicate

1. **Provide clear explanations** of changes made.
2. **Keep commits focused** — one logical change per commit.

## Target Audience

- Adults interested in martial arts in Jakarta/Depok
- Parents looking for children's classes
- Training typically evenings (weekdays) and weekends

---

**Last Updated**: August 2026
