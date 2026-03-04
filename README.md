# Tenkei Aikidojo Website

The official website for Tenkei Aikidojo, built with Next.js 16+, React 19, and TypeScript. This project serves as a modern, high-performance platform for students and practitioners to connect with the dojo.

## Key Features

- **Multi-language Support (i18n):** Full support for English, Indonesian, and Japanese using `i18next`.
- **Modern Tech Stack:** Built with Next.js 16 (App Router) and React 19.
- **Performance Optimized:** High Lighthouse scores, optimized images, and Vercel Speed Insights.
- **SEO Ready:** Localized metadata, Open Graph tags, and structured data (JSON-LD).
- **Responsive Design:** Mobile-first approach using Tailwind CSS.
- **Security Focused:** Custom security headers and Turnstile spam protection.

## Technologies Used

- **Framework:** Next.js 16+ (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Internationalization:** `i18next`, `react-i18next`, `next-i18n-router`
- **Styling:** Tailwind CSS
- **Package Manager:** Yarn (Classic)
- **Version Management:** Volta (Node.js 22+, Yarn 1.22.22)
- **Monitoring:** Vercel Analytics & Speed Insights

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (managed via Volta)
- [Yarn](https://classic.yarnpkg.com/en/docs/install/)

### Installation

```bash
yarn install
```

### Development

Run the development server:

```bash
yarn dev
```

The application will be available at `http://localhost:3000`.

### Production Build

```bash
yarn build
yarn start
```

## Internationalization (i18n)

This project uses a localized routing strategy (`/[lang]/...`).

- **Adding Translations:** Edit JSON files in `public/locales/[lang]/common.json`.
- **Adding a Language:** Update `i18n.config.ts` and `app/i18n/settings.ts`.
- **Usage:**
  - **Server Components:** Use `getT(lang, 'common')`.
  - **Client Components:** Use `useTranslation(lang, 'common')`.

## Project Structure

- `app/[lang]/`: Localized routes and layouts.
- `app/i18n/`: Internationalization configuration and hooks.
- `components/`: Reusable React components.
- `public/locales/`: Translation resource files.
- `lib/`: Shared utilities and constants.
- `GEMINI.md`: **Crucial** - Detailed technical standards and development mandates.

## Quality Standards

### Linting & Formatting

```bash
yarn lint           # Run ESLint
yarn format         # Auto-format with Prettier
yarn check-format   # Verify formatting
```

## Contributing

Please refer to [GEMINI.md](./GEMINI.md) for comprehensive coding standards, architectural patterns, and AI agent guidelines before making any changes.

1. Ensure all code passes `yarn lint`.
2. All user-facing strings must be localized.
3. Follow the Conventional Commits specification.

---

**License:** MIT
