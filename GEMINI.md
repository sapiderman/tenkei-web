# Tenkei Aikidojo Website

## Project Overview

This is the official website for Tenkei Aikidojo, a martial arts dojo specializing in Aikido. The site provides information about the dojo, classes, instructors, and allows potential students to learn about and connect with the community.

**Live Site**: <https://tenkeiaikidojo.org>  
**Repository**: <https://github.com/sapiderman/tenkei-web>  
**License**: MIT

## Tech Stack

### Core Framework

- **Next.js 16+** (App Router)
- **React 19+**
- **TypeScript** (strict mode)
- **Node.js** (required for development)
- **Internationalization**: `i18next`, `react-i18next`, `next-i18n-router`
- **State Management**: Local component state, React Context, and i18n hooks
- **Data Fetching**: Next.js native `fetch` with caching

### Styling & UI

- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- Custom components in `/components` directory

### Package Management

- **Yarn** (v4 / Berry, managed via Corepack) - Primary package manager
- Configuration: `package.json` (`packageManager` field) and `.yarnrc.yml`
- Lock file: `yarn.lock`

### Deployment & Infrastructure

- **Vercel** - Primary deployment platform
- **Google Cloud Platform** - Alternative deployment (via `app.yaml`)
- **Docker** - Containerization support
- **GitHub Actions** - CI/CD workflows
- **Cloudflare R2** - Static asset storage

### Development Environment

- **VS Code** - Primary IDE (see `.vscode/` for settings)
- **Devcontainer** - Development container support (see `.devcontainer/`)
- **ESLint** - Code linting (`.eslintrc.json`)
- **Prettier** - Code formatting

## Project Structure

```shell
tenkei-web/
├── app/                    # Next.js App Router pages and layouts
│   ├── [lang]/            # Localized routes (en, id, ja)
│   │   ├── layout.tsx     # Localized layout component
│   │   ├── page.tsx      # Localized home page
│   │   └── [feature]/    # Feature-based localized routing
│   ├── i18n/              # Internationalization configuration & utilities
│   │   ├── settings.ts    # i18n settings (languages, defaultNS, etc.)
│   │   ├── index.ts      # Server-side i18n initialization (getT)
│   │   └── client.ts     # Client-side i18n hook (useTranslation)
│   ├── layout.tsx         # Root layout component
│   └── globals.css        # Global CSS styles
├── components/            # Reusable React components
│   └── [ComponentName].tsx # Component files
├── lib/                  # Utility functions and helpers
│   └── constants.ts     # Shared constants
├── .agents/             # AI agent skills and context (see below)
├── public/              # Static assets (images, fonts, etc.)
│   ├── images/          # Image assets
│   ├── fonts/           # Font files
│   └── locales/         # JSON translation files
│       ├── en/
│       ├── id/
│       └── ja/
├── i18n.config.ts        # General i18n configuration
├── .github/             # GitHub Actions workflows
├── .devcontainer/       # VS Code devcontainer configuration
├── .vscode/             # VS Code workspace settings
└── [config files]       # Configuration files
```

## Internationalization (i18n)

The project supports multiple languages: English (`en`), Indonesian (`id`), and Japanese (`ja`).

- **Default Locale**: `en`
- **Translation Files**: Located in `public/locales/[lang]/common.json`.
- **URL Pattern**: `/[lang]/path` (e.g., `/en/about`, `/id/about`).

### Server Components Usage

```typescript
import { getT } from "@/app/i18n";

export default async function Page({ params }: { params: { lang: string } }) {
  const { t } = await getT(params.lang, "common");
  return <h1>{t("welcome_message")}</h1>;
}
```

### Client Components Usage

```typescript
'use client'
import { useTranslation } from "@/app/i18n/client";

export function ClientComponent({ lang }: { lang: string }) {
  const { t } = useTranslation(lang, "common");
  return <button>{t("submit")}</button>;
}
```

## Coding Standards & Conventions

### TypeScript Guidelines

- **Strict mode**: Always enabled
- **Type safety**: Prefer explicit types over `any`
- **Interfaces over Types**: Use `interface` for object shapes, `type` for unions/intersections
- **Naming conventions**:
  - Components: `PascalCase` (e.g., `HeroSection.tsx`)
  - Functions: `camelCase` (e.g., `getUserData()`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_STUDENTS`)
  - Files: Match component name or use `kebab-case` for utilities

### React Component Patterns

- **Functional components only** - No class components
- **Server Components by default** - Use `'use client'` only when necessary
- **Component structure**:

  ```typescript
  // 1. Imports (grouped: React, Next.js, third-party, local)
  import { ReactNode } from 'react'
  import Link from 'next/link'

  // 2. Type definitions
  interface HeroSectionProps {
    title: string
    subtitle?: string
    children?: ReactNode
  }

  // 3. Component
  export function HeroSection({ title, subtitle, children }: HeroSectionProps) {
    return (
      <section className="...">
        {/* Implementation */}
      </section>
    )
  }
  ```

### File Naming

- **Components**: `ComponentName.tsx` (PascalCase)
- **Pages**: `page.tsx` (Next.js App Router convention)
- **Layouts**: `layout.tsx` (Next.js App Router convention)
- **Utilities**: `utility-name.ts` (kebab-case)
- **Types**: `types.ts` or `ComponentName.types.ts`

### CSS & Styling

- **Tailwind-first**: Use Tailwind utilities wherever possible
- **Component classes**: Use `cn()` helper from `lib/utils` for conditional classes
- **Custom CSS**: Only when Tailwind utilities are insufficient
- **Responsive design**: Mobile-first approach
  - Mobile: default (no prefix)
  - Tablet: `md:` (768px+)
  - Desktop: `lg:` (1024px+)
  - Large screens: `xl:` (1280px+)

### Git Commit Conventions

Follow conventional commits format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example: `feat: add contact form to aikido classes page`

## Development Workflow

### Environment Setup

1. Clone repository
2. Copy `.env.example` to `.env.local`
3. Run `corepack enable` (ensures Yarn v4 is active)
4. Run `yarn install`
5. Run `yarn dev` to start development server
6. Open `http://localhost:3000`

### Common Commands

```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint
yarn format       # Run Prettier format
```

### Code Quality Checks

Before committing:

1. Run `yarn lint` - Must pass with no errors
2. Run `yarn format` (if Prettier is configured)
3. Run `yarn build` - Must build successfully
4. Test changes manually in browser
5. Check responsive design (mobile, tablet, desktop)

## Content & Domain Knowledge

### Aikido Context

- **Tenkei** - The name of the dojo
- **Aikido** - Japanese martial art focusing on harmony and self-defense
- **Dojo** - Training hall for martial arts
- **Sensei** - Instructor/teacher
- **Kyu/Dan** - Ranking system in martial arts

### Target Audience

- **Primary**: Adults interested in learning martial arts in Jakarta, Indonesia
- **Secondary**: Parents looking for children's martial arts classes
- **Tertiary**: Existing students checking schedules/news

### Key Website Sections (Typical)

1. **Home** - Introduction to the dojo
2. **About** - History, philosophy, instructors
3. **Dojos** - Class schedules, locations, contacts and registration page
4. **Events** - Photos, videos and information about past and upcoming events
5. **Shinjuku** - Information about Shinjuku Dojo and Tenkei affiliation
6. **Blog** - Articles about Aikido, announcements

## Performance & SEO Requirements

### Performance Targets

- **Lighthouse Score**: 90+ across all metrics
- **Core Web Vitals**:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
- **Image optimization**: Use Next.js `<Image>` component
- **Code splitting**: Leverage Next.js automatic code splitting

### SEO Best Practices

- **Meta tags**: Every page must have unique title and description, translated per locale.
- **Structured data**: Use JSON-LD for organization/local business
- **Open Graph**: Proper OG tags for social sharing, localized `og:locale`
- **Sitemap**: Auto-generated via Next.js
- **robots.txt**: Configured for search engines
- **Alt text**: All images must have descriptive alt text

### Accessibility (a11y)

- **WCAG 2.1 AA compliance** as minimum target
- **Semantic HTML**: Use proper heading hierarchy (h1-h6)
- **ARIA labels**: Where necessary for screen readers
- **Keyboard navigation**: All interactive elements accessible via keyboard
- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text

## Deployment

### Vercel (Primary)

- **Auto-deployment**: Every push to `main` triggers deployment
- **Preview deployments**: Every PR gets a preview URL
- **Environment variables**: Set in Vercel dashboard
- **Custom domain**: Configured in Vercel DNS settings and Cloudflare DNS settings

### Google Cloud Platform (Alternative)

- Uses `app.yaml` configuration
- Deploy via `gcloud app deploy`
- Staging/production environments

### Docker

- `Dockerfile` provided for containerized deployments
- `.dockerignore` configured to exclude unnecessary files

## Testing Strategy

### Manual Testing Checklist

When implementing new features, test:

- [ ] Desktop (Chrome, Firefox, Safari)
- [ ] Mobile (iOS Safari, Android Chrome)
- [ ] Tablet (iPad, Android tablet)
- [ ] Different screen sizes (320px to 1920px+)
- [ ] Dark mode (if applicable)
- [ ] Accessibility (keyboard navigation, screen reader)
- [ ] Multi-language support (English, Indonesian, Japanese)

### Future Considerations

- Unit tests with Jest + React Testing Library
- E2E tests with Playwright
- Visual regression testing

## API & Data Management

### Data Sources

- Static content in components/pages (managed via translation files)
- Potential CMS integration (future consideration)
- Contact form submissions (via Server Actions or API routes)

### Forms

- Client-side validation with native React state (React Hook Form is **not** currently installed)
- Server-side validation using **Server Actions** (preferred over API routes)
- Proper error handling and user feedback

## Security Considerations

### General Security

- No sensitive data in client-side code
- Environment variables for secrets (never commit `.env.local`)
  - Common variables: `NEXT_PUBLIC_SITE_URL`, API keys, etc.
- HTTPS enforced on production
- CSP headers and i18n routing handled together in `proxy.ts` (Next.js 16 edge proxy convention — replaces the old `middleware.ts`)
- Input validation on all user-submitted data

### Contact Forms

- CSRF protection
- Rate limiting
- Email validation
- Spam protection (Turnstile or similar)

## Common Patterns & Best Practices

### Image Handling

```typescript
import Image from 'next/image'

// Always use Next.js Image component for optimization
<Image
  src="/images/dojo-training.jpg"
  alt="Students practicing Aikido at Tenkei Dojo"
  width={800}
  height={600}
  priority={isAboveFold} // Use for LCP images
  placeholder="blur"
  blurDataURL="..." // Low-quality placeholder
/>
```

### Metadata (SEO)

```typescript
// app/[lang]/page.tsx
import { Metadata } from "next";
import { getT } from "@/app/i18n";

// In Next.js 15+, params is a Promise — always await it.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getT(lang, "common");
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}
```

### Loading States

```typescript
// app/[lang]/loading.tsx
export default function Loading() {
  return <div className="...">Loading...</div>
}
```

### Error Handling

```typescript
// app/[lang]/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

## Agent Skills

This repository ships a set of agent skill files under `.agents/skills/`. Before implementing features or making significant changes, AI agents should load the relevant skill:

```
.agents/skills/
└── next-best-practices/   # Next.js 15/16 App Router best practices
    ├── SKILL.md           # Entry point — read this first
    ├── async-patterns.md  # Async params, cookies, headers (Next.js 15+)
    ├── rsc-boundaries.md  # Server vs. Client component boundaries
    ├── data-patterns.md   # Fetch, caching, revalidation
    ├── metadata.md        # SEO metadata patterns
    └── ...                # Other topic files
```

To use: read `.agents/skills/next-best-practices/SKILL.md` before working on any Next.js-related task. The SKILL.md file references the relevant topic files.

## When Making Changes

### Before Writing Code

1. **Understand the requirement** - What problem are we solving?
2. **Check existing patterns** - Is there a similar component/pattern already?
3. **Plan the approach** - What files need to be created/modified?
4. **Consider performance** - Will this impact loading time or bundle size?
5. **Think accessibility** - Is this usable for everyone?
6. **Consider localization** - Does this need to be translated?

### Code Review Checklist

- [ ] TypeScript types are properly defined (no `any`)
- [ ] Components follow established patterns
- [ ] Tailwind classes are used appropriately
- [ ] Responsive design works on all screen sizes
- [ ] Accessibility requirements met
- [ ] Performance not negatively impacted
- [ ] SEO meta tags updated and localized
- [ ] No console errors or warnings
- [ ] Code is well-commented for complex logic
- [ ] All user-facing strings are in translation files

### AI Agent Guidelines

When I (an AI agent) am working on this project:

1. **Always read relevant files first** before making changes
2. **Follow the established patterns** in the codebase
3. **Run `yarn lint`** after making changes
4. **Test the build** with `yarn build` before finalizing
5. **Provide clear explanations** of changes made
6. **Ask for clarification** if requirements are ambiguous
7. **Consider edge cases** and error states
8. **Document complex logic** with comments
9. **Keep commits focused** on single changes
10. **Respect the existing architecture** - don't introduce new patterns without discussion
11. **Do not output large blocks of code in chat**; use file editing tools to apply changes directly.
12. **Always check for TypeScript errors** after modifying or creating components.
13. **When adding new dependencies**, specify whether they should be `dependencies` or `devDependencies`.
14. **Ensure all new features are properly localized** in supported languages.

## Project-Specific Context

### Indonesian Locale Considerations

- Content may be in **Bahasa Indonesia**, English and Japanese
- Date/time formatting should follow Indonesian conventions
- Currency: Indonesian Rupiah (IDR)
- Time zone: WIB (Western Indonesia Time, UTC+7)

### Business Hours & Contact

- Training typically in evenings (weekdays) and weekends
- Location: Jakarta and Depok, Indonesia
- Contact methods: Phone, WhatsApp, Email, Social media

## Future Roadmap Ideas

- Member portal with login
- Online class registration
- Payment integration
- Training schedule calendar
- Blog/news section
- Multi-language support (Indonesian/English/Japanese toggle - implemented)
- Photo/video gallery
- Instructor profiles
- Student testimonials
- Online store for merchandise

## Questions to Ask Before Implementation

When implementing new features, consider asking:

1. **Who is the target user?** (New visitors, existing students, parents?)
2. **What devices will they use?** (Primarily mobile? Desktop?)
3. **What's the expected load?** (High traffic? Static content?)
4. **Does this need to be dynamic?** (Can it be static for better performance?)
5. **Are there accessibility concerns?** (Forms, interactive elements?)
6. **What's the content update frequency?** (Should this use a CMS?)
7. **Are there legal requirements?** (Privacy policy, terms of service?)
8. **Are all translations available for the new feature?**

## Emergency Contacts & Resources

### Deployment Issues

- Check Vercel dashboard for build logs
- Check GitHub Actions for CI/CD failures
- Review environment variables configuration

### Documentation

- Next.js docs: <https://nextjs.org/docs>
- Tailwind CSS: <https://tailwindcss.com/docs>
- TypeScript: <https://www.typescriptlang.org/docs>
- React: <https://react.dev>
- i18next: <https://www.i18next.com/>

### Package Updates

- Check for security vulnerabilities: `yarn audit`
- Update dependencies: Be cautious with major version updates
- Test thoroughly after updates

---

**Last Updated**: March 2026  
**Maintained by**: Tenkei Aikidojo Development Team  
**For questions about this project, consult the repository owner or create a GitHub issue.**
