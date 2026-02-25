# Magic3T Monorepo

[![Biome CI](https://github.com/King-witcher/Magic3T/actions/workflows/biome.yml/badge.svg)](https://github.com/King-witcher/Magic3T/actions/workflows/biome.yml)


## Description
This is the Magic3T monorepo, which includes the backend, the frontend and some shared type libraries.

## Tech Stack

### Backend
- **Framework:** [NestJS](https://nestjs.com/)
- **WebSockets:** [Socket.IO](https://socket.io/) with `@nestjs/websockets`
- **Database:** [Cloud Firestore](https://cloud.google.com/products/firestore) [(with Firebase)](https://firebase.google.com/docs/firestore)
- **API Documentation:** OpenAPI (`@nestjs/swagger`) + [Scalar](https://scalar.com/)
- **Validation:** [class-validator + class-transformer](https://docs.nestjs.com/techniques/validation) + [Zod](https://zod.dev/)
- **Observability:** [Sentry](https://sentry.io/)
- **Testing:** [Vitest](https://vitest.dev/) (very little tests so far)

### Frontend
- **Framework:** [React 19](https://react.dev/) with React Compiler
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Routing:** [TanStack Router](https://tanstack.com/router/latest)
- **State Management:** [TanStack Query](https://tanstack.com/query/latest) + [React Hook Form](https://react-hook-form.com/)
- **WebSockets:** [Socket.IO](https://socket.io/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/) + [React Icons](https://react-icons.github.io/react-icons/) + [Tailwind CSS](https://tailwindcss.com/)
- **Authentication:** [Firebase Auth](https://firebase.google.com/docs/auth) + [Firebase Functions](https://firebase.google.com/docs/functions)
- **Analytics:** [Vercel Analytics](https://vercel.com/docs/analytics) + [Speed Insights](https://vercel.com/docs/speed-insights)
- **Observability:** [Sentry](https://sentry.io/) (+ [PostHog](https://posthog.com/) in the future)

### Monorepo & Tooling
- **Package Manager:** npm Workspaces
- **Linting:** [Biome JS](https://biomejs.dev/)
- **CI/CD:** GitHub Actions ([Biome CI](https://biomejs.dev/recipes/continuous-integration/), [Reviewdog](https://github.com/reviewdog/reviewdog), npm audit)
- **Deployment:** [Render with IaC](https://render.com/) (backend) + [Vercel](https://vercel.com/docs) (frontend) + [Firebase](https://firebase.google.com/)
- **Debugging:** [VSCode Launch Configurations](https://code.visualstudio.com/docs/debugtest/debugging) and a bunch of [Tasks](https://code.visualstudio.com/docs/debugtest/tasks) + [Problem Matchers](https://code.visualstudio.com/docs/debugtest/tasks#_defining-a-problem-matcher) (see `.vscode` folder)

## Projects
- **[backend](./backend)**: The backend server built with NestJS.
- **[frontend](./frontend)**: The frontend application built with React and Vite.

## Running Locally

First off, install dependencies for all projects:

```bash
npm install
```

### Backend

- Navigate to the `backend` directory.

- Provide the necessary environment variables by copying the `.env.example` file to `.env` and filling in the required values.

> **Important environment variables:**
> - Firebase admin credentials in the `FIREBASE_ADMIN_CREDENTIALS` environment variable in a base64 encoded JSON format
> - Sentry DSN in `SENTRY_DSN` (optional for development - if not provided, Sentry will be disabled)

- To run the backend server locally, navigate to the `backend` directory and start the server:

```bash
npm run start:dev
```

### Frontend

- Navigate to the `frontend` directory.

- Provide the necessary environment variables by copying the `.env.example` file to `.env` and filling in the required values.

> **Important environment variables:**
> - Firebase configuration (`VITE_FIREBASE_*`)
> - API URL (`VITE_API_URL`)
> - CDN URL (`VITE_CDN_URL`)
> - Sentry configuration (`VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, etc.) - optional for development

- To run the frontend application locally, use the following command:

```bash
npm run dev
```

> **Note:** Sentry is only enabled in production builds. During development, no errors or traces will be sent to Sentry.
