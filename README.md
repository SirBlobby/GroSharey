# GroSharey

Monorepo template with a Python Flask backend and an Expo (React Native + React Native Web) TypeScript frontend. Both deploy to Vercel as separate projects.

## Prerequisites

| Tool | Used For | Install |
|------|----------|---------|
| [uv](https://docs.astral.sh/uv/) | Python packages and virtual environment | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| [Bun](https://bun.sh/) | JavaScript packages and scripts | `curl -fsSL https://bun.sh/install \| bash` |

## Structure

```
package.json                    Root scripts (bun)
backend/
  pyproject.toml                Python dependencies (uv)
  uv.lock                       Locked Python versions
  api/index.py                  Vercel entry point
  server/
    main.py                     App factory
    config.py                   Environment settings
    errors.py                   Domain errors
    error_handlers.py           Error to HTTP response mapping
    models/                     Pydantic schemas
    repositories/               Data access
    services/                   Business logic
    routes/                     HTTP endpoints
frontend/
  package.json                  JavaScript dependencies (bun)
  bun.lock                      Locked JavaScript versions
  App.tsx
  index.ts
  tsconfig.json
  src/
    config/                     Environment values
    api/                        HTTP client and endpoint calls
    hooks/                      Data hooks
    screens/                    Screens
    components/                 UI components
    theme/                      Colors and spacing
```

## Root Commands

Run from the project root.

| Command | Description |
|---------|-------------|
| `bun run setup` | Install root, backend, and frontend dependencies |
| `bun run dev` | Run backend and frontend together |
| `bun run dev:backend` | Run only the backend on port 8000 |
| `bun run dev:frontend` | Run only the frontend web app |
| `bun run build:web` | Build the frontend into `frontend/dist` |
| `bun run preview:web` | Serve the built frontend locally |
| `bun run typecheck` | Type check the frontend |
| `bun run test:health` | Check that the backend is running |

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env` before running.

## Backend

```
cd backend
uv sync
cp .env.example .env
uv run flask --app server.main run --debug --port 8000
```

| Task | Command |
|------|---------|
| Add a package | `uv add <package>` |
| Remove a package | `uv remove <package>` |
| Upgrade all packages | `uv lock --upgrade && uv sync` |
| Run a Python command | `uv run <command>` |

## Frontend

```
cd frontend
bun install
bunx expo install --fix
cp .env.example .env
bun run web
```

| Task | Command |
|------|---------|
| Add an Expo or React Native package | `bunx expo install <package>` |
| Add any other package | `bun add <package>` |
| Add a dev package | `bun add -d <package>` |
| Remove a package | `bun remove <package>` |
| Align Expo package versions | `bunx expo install --fix` |

## Adding a service

1. Model in `backend/server/models/`
2. Repository in `backend/server/repositories/`
3. Service in `backend/server/services/`
4. Blueprint in `backend/server/routes/` and register in `routes/__init__.py`
5. Frontend calls in `frontend/src/api/` and a hook in `frontend/src/hooks/`

## Deploying to Vercel

Create two Vercel projects from this repository.

| Project  | Root Directory | Framework Preset | Environment Variables |
|----------|----------------|------------------|-----------------------|
| Backend  | `backend`      | Flask            | `ALLOWED_ORIGINS`, `APP_NAME`, `ENVIRONMENT` |
| Frontend | `frontend`     | Other            | `EXPO_PUBLIC_API_URL` (Config type, backend URL) |

The backend installs from `pyproject.toml` and `uv.lock`. The frontend installs with `bun install` and builds with `bunx expo export --platform web`, as set in `frontend/vercel.json`.

Commit `backend/uv.lock`, `bun.lock`, and `frontend/bun.lock` so Vercel installs the same versions.
