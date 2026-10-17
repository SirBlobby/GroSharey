# GroSharey

Monorepo template with a Python Flask backend and an Expo (React Native + React Native Web) frontend. Both deploy to Vercel as separate projects.

## Structure

```
backend/
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
  App.js
  index.js
  src/
    config/                     Environment values
    api/                        HTTP client and endpoint calls
    hooks/                      Data hooks
    screens/                    Screens
    components/                 UI components
    theme/                      Colors and spacing
```

## Root Commands

| Command | Description |
|---------|-------------|
| `bun run setup` | Install root, backend, and frontend dependencies |
| `bun run dev` | Run backend and frontend together |
| `bun run dev:backend` | Run only the backend on port 8000 |
| `bun run dev:frontend` | Run only the frontend web app |
| `bun run build:web` | Build the frontend into `frontend/dist` |
| `bun run preview:web` | Serve the built frontend locally |
| `bun run test:health` | Check that the backend is running |

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env` before running.

## Backend

```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
flask --app server.main run --debug --port 8000
```

## Frontend

```
cd frontend
bun install
bunx expo install --fix
cp .env.example .env
bun run web
```

## Adding a service

1. Model in `backend/server/models/`
2. Repository in `backend/server/repositories/`
3. Service in `backend/server/services/`
4. Blueprint in `backend/server/routes/` and register in `routes/__init__.py`
5. Frontend calls in `frontend/src/api/` and a hook in `frontend/src/hooks/`

## Deploying to Vercel

Create two Vercel projects from this repository.

| Project  | Root Directory | Environment Variables |
|----------|----------------|-----------------------|
| Backend  | `backend`      | `ALLOWED_ORIGINS`, `APP_NAME`, `ENVIRONMENT` |
| Frontend | `frontend`     | `EXPO_PUBLIC_API_URL` (backend URL) |

The in-memory repository resets between serverless invocations. Replace it with a database-backed repository for persistent data.
