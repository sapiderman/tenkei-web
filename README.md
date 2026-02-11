# Project Overview

This is a Next.js web application, bootstrapped with `create-next-app`, serving as the official website for Tenkei Aikidojo. It leverages the new App Router for routing and uses React for its UI components. The project integrates Tailwind CSS for styling, TypeScript for type safety, and Prettier for code formatting. It also includes Vercel Analytics and Speed Insights for performance monitoring.

## Technologies Used

- **Framework:** Next.js (with App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Package Manager:** Yarn
- **Version Management:** Volta (for Node.js and Yarn versions)
- **Deployment:** Configured for Vercel, with `output: "standalone"` for self-hosting.
- **Analytics/Performance:** Vercel Analytics and Speed Insights

## Building and Running

The project uses `yarn` as its package manager. Node.js and Yarn versions are managed by `volta`.

### Development

To run the development server:

```bash
yarn dev
```

This will start the application at `http://localhost:3000`. The page auto-updates as you edit files.

### Production Build

To build the application for production:

```bash
yarn build
```

### Start Production Server

To start the built production application:

```bash
yarn start
```

## Development Conventions

### Linting

To lint the codebase using ESLint (configured for Next.js):

```bash
yarn lint
```

### Formatting

The project uses Prettier for code formatting.

To check for formatting issues:

```bash
yarn check-format
```

To automatically format the code:

```bash
yarn format
```

### Project Structure

- `app/`: Contains the main application routes and layouts (App Router).
  - `app/layout.tsx`: Root layout and metadata for the application.
  - `app/page.tsx`: The home page of the application.
  - `app/api/`: API routes.
- `components/`: Reusable React components.
- `public/`: Static assets (images, etc.).
- `lib/`: Utility functions or constants.
- `next.config.mjs`: Next.js configuration, including custom security headers and `output: "standalone"`.
- `tailwind.config.ts`: Tailwind CSS configuration.
- `tsconfig.json`: TypeScript compiler configuration.

## Contribution Guidelines

- Adhere to the established Prettier formatting rules (`yarn format`).
- Ensure that all code passes ESLint checks (`yarn lint`).
- Follow the existing code style and architectural patterns (e.g., functional components, TypeScript for new features).
