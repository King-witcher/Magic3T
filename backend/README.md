# Magic3T Backend

Backend server for Magic3T, a multiplayer real-time game based on the magic square concept.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **NestJS** | Backend framework |
| **TypeScript** | Static typing |
| **Socket.IO** | Real-time WebSocket communication |
| **Firebase Admin** | Authentication & Firestore database |
| **Zod** | Runtime validation |
| **class-validator** | DTO validation |
| **Swagger + Scalar** | API documentation |
| **Sentry** | Error tracking & performance monitoring |
| **Vitest** | Testing framework |

## Project Structure

```
backend/src/
├── main.ts                  # Application bootstrap
├── app.module.ts            # Root module
├── app.gateway.ts           # Main WebSocket gateway
├── app.controller.ts        # Health check controller
│
├── infra/                   # Infrastructure layer
│   ├── firestore/           # Firestore repositories
│   ├── firebase/            # Firebase Admin SDK setup
│   └── websocket/           # WebSocket infrastructure
│
├── modules/                 # Business modules
│   ├── auth/                # Authentication (Firebase tokens)
│   ├── match/               # Game logic & match management
│   ├── queue/               # Matchmaking queue
│   ├── rating/              # ELO rating system
│   ├── user/                # User management
│   └── admin/               # Admin endpoints
│
├── common/                  # Shared utilities
│   ├── decorators/          # Custom decorators
│   ├── errors/              # Custom error classes
│   ├── filters/             # Exception filters
│   ├── guards/              # Auth guards
│   ├── pipes/               # Validation pipes
│   └── websocket/           # WebSocket utilities
│
└── shared/                  # Shared types & constants
```

## Running Locally

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase project with Firestore enabled

### Setup

1. Install dependencies (from monorepo root):

```bash
npm install
```

2. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

3. Configure the required environment variables:

| Variable | Description |
|----------|-------------|
| `FIREBASE_ADMIN_CREDENTIALS` | Base64 encoded Firebase Admin SDK JSON |
| `SENTRY_DSN` | Sentry DSN (optional for development) |

4. Start the development server:

```bash
npm run dev
```

The server will be available at `http://localhost:3001`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start:prod` | Run production build |
| `npm run test` | Run tests with Vitest |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run Biome linter |

## API Documentation

When running locally, access the API documentation at:

- **Swagger UI**: `http://localhost:3001/api`
- **Scalar**: `http://localhost:3001/reference`

## Architecture

For detailed architecture documentation, see [ARCHITECTURE.md](../ARCHITECTURE.md) in the monorepo root.

### WebSocket Events

WebSocket documentation is available at [docs/WEBSOCKETS.md](docs/WEBSOCKETS.md).

### Error Handling

Error handling patterns are documented at [docs/ERROR-HANDLING.md](docs/ERROR-HANDLING.md).

### Database

Database schema and access patterns are documented at [docs/DATABASE.md](docs/DATABASE.md).
