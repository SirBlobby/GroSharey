# GroSharey

Monorepo template with a Python Flask backend and an Expo (React Native + React Native Web) TypeScript frontend. Both deploy to Vercel as separate projects.

## Prerequisites

| Tool | Used For | Install |
|------|----------|---------|
| [uv](https://docs.astral.sh/uv/) | Python packages and virtual environment | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| [Bun](https://bun.sh/) | JavaScript packages and scripts | `curl -fsSL https://bun.sh/install \| bash` |
| [MongoDB](https://www.mongodb.com/) | Database | Local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster |

## Structure

```
package.json                    Root scripts (bun)
backend/
  pyproject.toml                Python dependencies (uv) and Vercel entrypoint
  uv.lock                       Locked Python versions
  server/
    main.py                     App factory
    config.py                   Environment settings
    database.py                 MongoDB connection
    dependencies.py             Service wiring
    authentication.py           require_authentication decorator
    errors.py                   Domain errors
    error_handlers.py           Error to HTTP response mapping
    models/                     Pydantic schemas
    repositories/               MongoDB data access
    services/                   Business logic, passwords, tokens, image compression
    routes/                     HTTP endpoints
frontend/
  package.json                  JavaScript dependencies (bun)
  bun.lock                      Locked JavaScript versions
  App.tsx                       Native app entry
  App.web.tsx                   Web app entry (loads fonts and global styles)
  index.ts
  tsconfig.json
  src/
    config/                     Environment values
    api/                        HTTP client and endpoint calls
    context/                    Auth state provider
    hooks/                      Data hooks (friends, grocery runs, receipt scanning)
    services/                   Converts API responses for the screens, builds split requests
    navigation/                 Shows auth or app screens
    linking/                    Profile QR code links
    media/                      Image picking, cropping math, crop export, receipt photos
    screens/                    Screens
    components/                 UI components
    storage/                    Token storage (secure store on native, localStorage on web)
    styles/                     Web stylesheets from the prototype
    types/                      Shared types
    utils/                      Money formatting, initials, ids
    theme/                      Colors and spacing for native screens
```

### Web and Native Screens

Files ending in `.web.tsx` are used on web instead of the file with the same name. The web app uses the game style screens from `groSharey prototype.html`:

| Page | Screen |
|------|--------|
| Log in and create account | `LogInScreen.web.tsx`, `SignUpScreen.web.tsx` |
| Friends, balances, and settle up | `MainScreen.tsx` |
| Scan a receipt | `ScanReceiptScreen.tsx` |
| Edit items and assign friends | `ManageItemsScreen.tsx` |
| Grocery run saved | `ConfirmedScreen.tsx` |
| Settings menu with Profile, Friends, Appearance, Account, and App Info | `SettingsScreen.tsx`, `components/settings/` |
| Another user's profile with Add Friend | `FriendProfileScreen.tsx` |

The iOS and Android apps still use the basic account screens. Web icons come from [Iconify](https://iconify.design/) through `@iconify/react` and are collected in `src/components/icons.tsx`.

## Root Commands

Run from the project root.

| Command | Description |
|---------|-------------|
| `bun run setup` | Install root, backend, and frontend dependencies |
| `bun run dev` | Run backend and frontend together |
| `bun run dev:backend` | Run only the backend on port 8000 |
| `bun run dev:frontend` | Run only the frontend web app |
| `bun run dev:ios` | Run backend and the iOS simulator together |
| `bun run dev:android` | Run backend and the Android emulator together |
| `bun run dev:mobile` | Run backend and Expo (scan the QR code with Expo Go) |
| `bun run ios` | Run only the app in the iOS simulator |
| `bun run android` | Run only the app in the Android emulator |
| `bun run mobile` | Run only Expo for a physical device with Expo Go |
| `bun run stop` | Stop anything still running on ports 8000 (backend) and 8081 (Expo) |
| `bun run build:web` | Build the frontend into `frontend/dist` |
| `bun run preview:web` | Serve the built frontend locally |
| `bun run typecheck` | Type check the frontend |
| `bun run test:health` | Check that the backend is running |

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env` before running.

### Mobile Preview

- iOS simulator requires macOS with Xcode. Android emulator requires Android Studio.
- A physical phone or the Android emulator cannot reach `localhost` on your computer. Set `EXPO_PUBLIC_API_URL` in `frontend/.env` to your computer's LAN address, for example `http://192.168.1.20:8000`. The Android emulator can also use `http://10.0.2.2:8000`.
- The local backend listens on all network interfaces so phones on the same network can reach it.

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

## Authentication

Email and password accounts stored in the MongoDB `users` collection. Passwords are hashed with Argon2. The backend returns a JWT that the frontend sends as `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Create an account, returns token and user |
| POST | `/api/auth/login` | No | Log in, returns token and user |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/profiles/<username>` | Yes | Public profile (id, username, display name, picture URL) |
| PUT | `/api/profiles/me/picture` | Yes | Upload profile picture as `{"image_base64": "..."}` |
| GET | `/api/profiles/<username>/picture` | No | Profile picture image |
| POST | `/api/receipts/parse` | Yes | Read a receipt photo sent as `{"image_base64": "..."}`, returns items and totals as JSON |
| POST | `/api/receipts/split` | Yes | Preview a split: what each person owes the logged-in payer (nothing is saved) |
| GET | `/api/friends` | Yes | Your friends, each with `balance` (positive: they owe you, negative: you owe them) |
| POST | `/api/friends` | Yes | Add a friend as `{"username": "..."}` (mutual) |
| DELETE | `/api/friends/<username>` | Yes | Remove a friend (past splits are kept) |
| POST | `/api/splits` | Yes | Confirm and save a split, same body as the preview |
| GET | `/api/splits` | Yes | Your 50 most recent splits, as payer or participant |
| POST | `/api/payments` | Yes | Record a settle-up payment: `{"friend_username": "alex", "amount": 7.07, "direction": "received", "method": "venmo"}` |
| GET | `/api/payments` | Yes | Your 50 most recent payments |
| PUT | `/api/profiles/me/payment-handles` | Yes | Set `{"venmo_username": "...", "paypal_username": "..."}` so friends get pay buttons |
| GET | `/api/health` | No | Health check |
| GET | `/` | No | API name, status, and endpoint list |

Protect a backend route:

```python
from flask import g

from server.authentication import require_authentication


@example_blueprint.get("")
@require_authentication
def get_example():
    current_user = g.current_user
```

On the frontend, every screen except the log in and create account screens is shown only when logged in. Use `useAuth()` to read `currentUser` or call `logOut()`.

## Accounts and Profiles

Each account has an `id` (MongoDB ObjectId), a unique `username` (3 to 30 lowercase letters, numbers, or underscores), a `display_name`, and an email used to log in.

### QR Codes

The My QR Code screen shows a QR code linking to `EXPO_PUBLIC_APP_URL/?user=<username>`. Scanning it with any phone camera opens the web app on that user's profile, after logging in if needed. The home screen can also look up a profile by username.

### Profile Pictures

1. The user picks an image and crops it to a square in the `ImageCropper` component (drag to position, zoom buttons).
2. The crop is exported as PNG (lossless) and scaled down to at most 1024 by 1024 pixels.
3. The backend strips metadata, applies orientation, and re-encodes it as lossless WebP at maximum compression effort.
4. Images are stored in the MongoDB `profile_pictures` collection and served with long-lived cache headers.

Uploads are limited to 3 MB to stay under the Vercel request size limit.

## Receipt Scanning

`POST /api/receipts/parse` sends the receipt image to Google Gemini and returns the store, date, line items, subtotal, tax, and total. Each item gets an `id` (`item_1`, `item_2`, ...) for assigning roommates, and `warnings` lists any totals that don't add up so the user can double-check before splitting.

To try it on an image without the frontend, put the image in `sample-receipts/` (ignored by git, since receipts can show card digits) and run from `backend/`:

```
uv run python scripts/parse_receipt.py ../sample-receipts/costco.jpg
```

### Splitting

`POST /api/receipts/split` previews a split and `POST /api/splits` saves it. Both take the receipt (a parsed receipt, or manually entered items with `id`, `name`, and `total_price`) plus who shares each item:

```json
{"receipt": {...}, "assignments": {"item_1": ["alex", "sam"], "item_2": ["sachi"]}}
```

The logged-in user is the payer, and everyone assigned must be the payer or one of their friends. Each item's price is split evenly between its people, and tax goes only on items the receipt taxed, found by matching the tax total against each group of tax codes (the letters after prices). If that is ambiguous, tax is spread across all items by price and `tax_note` says so. All math is in cents, so everyone's totals add up exactly to the receipt.

### Friends and Balances

Friendships are mutual and stored in the `friendships` collection. Saved splits go in the `splits` collection, one document per receipt. Payments go in the `payments` collection. Balances are not stored; `GET /api/friends` adds them up from saved splits and payments, so the history always explains the totals.

### Email Notifications

Saving a split with `POST /api/splits` emails everyone who owes money: their items, the amount, and a link to the payer's profile in the web app. `emailed_usernames` in the response says who was emailed. If email isn't configured or sending fails, the split is still saved; the error is only logged.

### Settling Up

`POST /api/payments` records money changing hands. `direction` is `"paid"` (you paid the friend) or `"received"` (the friend paid you), and either friend can record it. Amounts over what's owed are rejected as likely typos.

When you owe a friend who has set their Venmo or PayPal.me name, their entry in `GET /api/friends` includes `venmo_pay_url` and `paypal_pay_url`, which open the payment with the amount filled in. Opening a link doesn't record anything; record the payment afterwards with `POST /api/payments`.

## Backend Environment Variables

| Variable | Description |
|----------|-------------|
| `APP_NAME` | API name |
| `ENVIRONMENT` | `development` or `production` |
| `ALLOWED_ORIGINS` | Comma separated frontend URLs |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DATABASE_NAME` | Database name |
| `JWT_SECRET_KEY` | Long random string, required when `ENVIRONMENT=production` |
| `JWT_EXPIRATION_MINUTES` | Token lifetime, default 10080 (7 days) |
| `GEMINI_API_KEY` | Google Gemini key for receipt scanning, free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | Gemini model for receipt scanning, default `gemini-flash-latest` |
| `EMAIL_SENDER_ADDRESS` | Gmail address that sends "you owe" emails; leave blank to skip emails |
| `EMAIL_APP_PASSWORD` | 16-character Gmail app password from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (needs 2-Step Verification) |
| `SMTP_HOST` / `SMTP_PORT` | Email server, default `smtp.gmail.com` / `587` |
| `APP_URL` | Frontend URL for links in emails, same as the frontend's `EXPO_PUBLIC_APP_URL` |
| `GEMINI_FALLBACK_MODEL` | Model tried once when `GEMINI_MODEL` is overloaded, default `gemini-flash-lite-latest` |

Generate a secret key with `openssl rand -hex 32`.

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
| Backend  | `backend`      | Flask            | All backend variables above, with `ENVIRONMENT=production` |
| Frontend | `frontend`     | Other            | `EXPO_PUBLIC_API_URL` (backend URL) and `EXPO_PUBLIC_APP_URL` (frontend URL), both Config type |

The backend installs from `pyproject.toml` and `uv.lock`. The frontend installs with `bun install` and builds with `bunx expo export --platform web`, as set in `frontend/vercel.json`.

Commit `backend/uv.lock`, `bun.lock`, and `frontend/bun.lock` so Vercel installs the same versions.

For MongoDB Atlas, allow access from anywhere (`0.0.0.0/0`) under Network Access, since Vercel functions do not have fixed IP addresses.
