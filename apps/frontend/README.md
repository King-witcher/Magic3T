# Magic3T Frontend

Frontend application for Magic3T, a multiplayer real-time game based on the magic square concept.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI library with React Compiler |
| **Vite** | Build tool & dev server |
| **TanStack Router** | Type-safe file-based routing |
| **TanStack Query** | Server state management & caching |
| **Tailwind CSS v4** | Utility-first styling |
| **Radix UI** | Accessible UI primitives |
| **Lucide Icons** | Icon library |
| **React Hook Form** | Form handling |
| **Firebase Auth** | Authentication (Google provider) |
| **Socket.IO Client** | Real-time communication |
| **Sentry** | Error tracking & performance monitoring |

## Project Structure

```
frontend/src/
├── main.tsx                 # Entry point
├── router.ts                # Router configuration
├── main.css                 # Global styles (Tailwind + theme)
├── route-tree.gen.ts        # Auto-generated routes
│
├── routes/                  # Pages (TanStack Router)
│   ├── __root.tsx           # Root layout
│   ├── _auth.tsx            # Auth pages layout
│   ├── _auth-guarded.tsx    # Protected pages layout
│   └── ...
│
├── components/              # React components
│   ├── ui/                  # Base components (Button, Input, Dialog)
│   └── templates/           # Page templates
│
├── contexts/                # React Contexts
│   ├── auth-context.tsx     # Authentication state
│   ├── game-context.tsx     # Current match state
│   └── queue.context.tsx    # Matchmaking queue state
│
├── services/                # External communication
│   ├── firebase.ts          # Firebase initialization
│   └── clients/             # REST API clients
│
├── hooks/                   # Custom hooks
├── lib/                     # Utilities & classes
├── types/                   # TypeScript types
└── assets/                  # Fonts & textures
```

## Running Locally

### Prerequisites

- Node.js 20+
- npm 10+

### Using Docker

```bash
docker build -t magic3t-frontend .
docker run -p 3000:3000 magic3t-frontend
```

### Local Development

1. Install dependencies (from monorepo root):

```bash
npm install
```

2. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run Biome linter |

## Environment Variables

Required environment variables (see `.env.example` for details):

- `VITE_API_URL` - Backend API URL
- `VITE_CDN_URL` - CDN URL for assets
- `VITE_FIREBASE_*` - Firebase configuration
- `VITE_SENTRY_DSN` - Sentry DSN (optional, only for production)
- `SENTRY_AUTH_TOKEN` - Sentry auth token for sourcemap upload (optional)

## Documentation

For detailed technical documentation, see [FRONTEND.md](./docs/FRONTEND.md).
