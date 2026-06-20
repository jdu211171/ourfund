# Ourfund Codebase Guide

This app is a TanStack Start + React family budget app. Most product UI is built as phone-style screens in `src/components/knit`, with shared app state and actions in `src/lib/navigation.tsx`.

## Local Development Setup

Follow these steps from a fresh clone. The project uses npm, Vite/TanStack Start, Prisma, and PostgreSQL.

### Prerequisites

- Node.js 22.12 or newer. Node 24 works locally; avoid older Node versions because some Vite/TanStack dependencies require modern Node.
- npm 10 or newer.
- PostgreSQL 14 or newer, running locally or in a reachable development database.
- Git.

Check your tool versions:

```bash
node --version
npm --version
psql --version
```

If `psql` is missing, install PostgreSQL first. On macOS with Homebrew:

```bash
brew install postgresql@16
brew services start postgresql@16
```

### Install Dependencies

Use the checked-in npm lockfile:

```bash
npm ci
```

There is also an old `bun.lock` in the repo, but `package-lock.json` is the current source of truth for local setup. Do not mix package managers in one setup unless you intentionally regenerate the lockfile.

### Create A Local Database

Create a dedicated development database:

```bash
createdb ourfund_dev
```

If `createdb` cannot connect, PostgreSQL is probably not running or your local user does not have database permissions. Start PostgreSQL first, then try one of these:

```bash
psql postgres
CREATE DATABASE ourfund_dev;
\q
```

or create the database with an explicit user:

```bash
createdb -U postgres ourfund_dev
```

### Configure Environment Variables

Create `.env` in the repo root. This file is intentionally ignored by git.

Minimum local configuration:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ourfund_dev?schema=public"
JWT_SECRET="replace-with-a-long-random-local-secret"
APP_BASE_URL="http://localhost:3000/ourfund"
PORT=3000
```

For a default Homebrew PostgreSQL install that trusts your macOS user locally, `DATABASE_URL` often looks like this:

```bash
DATABASE_URL="postgresql://localhost:5432/ourfund_dev?schema=public"
```

Optional integrations:

```bash
# Google sign-in. The browser client ID in LoginScreen must match this server-side value.
GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"

# Email for welcome, invite, loan, and password reset messages.
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="user@example.com"
SMTP_PASS="smtp-password-or-app-password"
SMTP_FROM="OurFund <user@example.com>"

# Receipt scanning.
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.5-flash"
GEMINI_FALLBACK_MODELS="gemini-2.5-flash,gemini-2.5-flash-lite"

# Use empty client-side demo data instead of the built-in dev demo seed.
VITE_EMPTY_DATA=true
```

Notes:

- `DATABASE_URL` is required by Prisma. Most server-backed flows fail without it.
- `JWT_SECRET` has a built-in fallback for development, but set it anyway so sessions remain valid across restarts and everyone uses the same expected behavior.
- SMTP is not optional for email/password sign-up in the current server flow because sign-up sends a welcome email. If SMTP is missing, account creation can fail after creating the user. Use a local SMTP catcher such as Mailpit/Mailhog, or configure a real test SMTP account.
- `APP_BASE_URL` should include `/ourfund` because the Vite/TanStack router base path is configured to `/ourfund`.
- Receipt scanning works only when `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` is present.
- Google sign-in works only when `GOOGLE_CLIENT_ID` is configured server-side and matches the browser client ID used by `src/components/knit/LoginScreen.tsx`.

### Optional: Run Local SMTP With Mailpit

If you do not want to use a real SMTP account, Mailpit is enough for local email testing:

```bash
brew install mailpit
mailpit
```

Then use:

```bash
SMTP_HOST="localhost"
SMTP_PORT=1025
SMTP_USER="local"
SMTP_PASS="local"
SMTP_FROM="OurFund <local@ourfund.test>"
```

Open Mailpit at `http://localhost:8025` to see outgoing messages. If your SMTP server does not require auth, the current mailer still expects `SMTP_USER` and `SMTP_PASS`, so set harmless local values.

### Prepare Prisma

Generate the Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

When `prisma migrate dev` asks for a migration name, it should not ask during a normal fresh setup because migrations already exist. If it does ask, stop and check whether `prisma/schema.prisma` has uncommitted changes.

Useful database commands:

```bash
npx prisma migrate status
npx prisma studio
```

`prisma studio` opens a browser UI for inspecting local tables.

### Start The App

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/ourfund
```

The app is served under `/ourfund`, not `/`. If Vite chooses another port because `3000` is busy, keep the `/ourfund` suffix on the printed URL.

Useful routes:

- `http://localhost:3000/ourfund` shows the mobile phone-style app/gallery surface.
- `http://localhost:3000/ourfund/app/home` shows the desktop/web app shell.

### Verify The Setup

Run:

```bash
npm run build
```

For changed files, also run targeted checks:

```bash
npx eslint path/to/changed-file.tsx
npx prettier --check path/to/changed-file.tsx
```

Full `npm run lint` currently reports repo-wide existing formatting/type issues, so targeted lint/prettier checks are more useful until the broader cleanup is done.

### Common Setup Problems

`npm ci` fails with an engine or syntax error:

- Upgrade Node to 22.12 or newer, then remove `node_modules` and run `npm ci` again.

`npx prisma migrate dev` cannot reach the database:

- Confirm PostgreSQL is running.
- Confirm the database exists: `psql -d ourfund_dev`.
- Confirm `DATABASE_URL` points at the same database, host, port, and user.
- If you use a password, URL-encode special characters in the password.

`PrismaClientInitializationError` appears in the dev server:

- Run `npx prisma generate`.
- Run `npx prisma migrate dev`.
- Restart `npm run dev` after changing `.env`.

The browser shows a 404 or blank page:

- Use `/ourfund` in the URL. The app is not mounted at the domain root.
- Check the terminal for the actual Vite port if `3000` was already in use.

Sign-up fails with an SMTP error:

- Configure the `SMTP_*` variables or run Mailpit as described above.
- If a user record was created before the email failed, either sign in with that email/password after SMTP is fixed or remove the user from the local database with Prisma Studio.

Google login says the client ID is not configured:

- Set `GOOGLE_CLIENT_ID` in `.env`.
- Make sure it is the same OAuth client ID used in `src/components/knit/LoginScreen.tsx`.
- Restart the dev server after changing `.env`.

Receipt scanning says it is not configured:

- Set `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY`.
- If Gemini returns model unavailable errors, set `GEMINI_MODEL` to a model available for your API key and region, and keep fallback models in `GEMINI_FALLBACK_MODELS`.

Local data looks wrong after switching branches:

- Run `npx prisma migrate dev`.
- Clear browser local storage for the site if you are testing the demo client seed.
- For a completely fresh database, drop and recreate the local database, then run migrations again:

```bash
dropdb ourfund_dev
createdb ourfund_dev
npx prisma migrate dev
```

## Start Here

- `src/components/knit/*Screen.tsx`: user-facing screens.
- `src/lib/navigation.tsx`: client app state, screen navigation, shared types, and mutation helper functions used by screens.
- `src/lib/screen-registry.tsx`: source of truth for `/app/:screen` web-shell screen registration.
- `src/routes/index.tsx`: mobile gallery/root app route. It has its own switch and must be updated for new screens.
- `src/routes/app.tsx`: desktop/web app shell and sidebar.
- `src/routes/app.$screen.tsx`: renders registered screens from `screen-registry`.
- `src/lib/server-fns.ts`: server actions, persistence, auth, email, receipt scanning.
- `prisma/schema.prisma`: database models.
- `src/lib/seed.ts`: demo/empty seed data and local fallback data.
- `src/styles.css`: global theme tokens and Tailwind CSS.
- `TODO.md`: product backlog shown by the More screen.

## Mental Model

There are two app surfaces:

1. `/app/:screen`: desktop/web shell. It renders screens through `src/lib/screen-registry.tsx`.
2. `/`: mobile phone gallery/app preview. It renders screens through the switch in `src/routes/index.tsx`.

Most screens call `useAppNavigation()` from `src/lib/navigation.tsx` to read data, navigate, and perform mutations. Client mutations usually update local state first, then call `syncMutationServerFn` in `src/lib/server-fns.ts`.

## Add Or Change A Screen

1. Create or edit `src/components/knit/MyFeatureScreen.tsx`.
2. Add the screen slug to `ScreenName` in `src/lib/navigation.tsx`.
3. Register it in `SCREENS` in `src/lib/screen-registry.tsx`.
4. Add an import and switch case in `src/routes/index.tsx`.
5. If it belongs in More, add it to `quickActions` or `screenForLabel` in `src/components/knit/MoreScreen.tsx`.
6. Use `goBack`, `navigate`, and shared data from `useAppNavigation()` instead of local routing hacks.
7. Run targeted checks:

```bash
npx eslint path/to/changed-file.tsx
npx prettier --check path/to/changed-file.tsx
npm run build
```

## Add Or Change Data

1. Add or update TypeScript types in `src/lib/navigation.tsx`.
2. Update initial/demo data in `src/lib/seed.ts`.
3. If data must persist, update `prisma/schema.prisma`.
4. Add or update server handling in `src/lib/server-fns.ts`.
5. Add a client helper action in `AppNavigationProvider` in `src/lib/navigation.tsx`.
6. Use that helper from screens.

## Add A Server Mutation

1. Add the client-side function in `src/lib/navigation.tsx`.
2. Call `syncMutationServerFn({ data: { type: "...", data } })`.
3. Add the matching `type` handling in `src/lib/server-fns.ts`.
4. Keep local optimistic state and server persisted state in the same shape.
5. Check permissions and household/member ownership before writing.

## Must-Do Checklist Before Finishing A Change

- New screen is registered in both `screen-registry.tsx` and `routes/index.tsx`.
- New screen slug exists in `ScreenName`.
- Back buttons call `goBack`.
- Buttons that navigate use `navigate("screen_slug")`.
- New persisted data exists in Prisma, server functions, navigation state, and seed data.
- Money values are stored as USD internally unless the existing helper says otherwise.
- Currency display uses helpers from `src/lib/currency.ts`.
- UI uses existing `PhoneFrame`, `BottomNav`, and app styles.
- Changed files pass targeted ESLint and Prettier checks.
- `npm run build` passes.

## Current Quality Note

`npm run build` passes. Full `npm run lint` currently reports repo-wide existing formatting/type issues, so use targeted lint/prettier checks for changed files until the broader lint cleanup is done.

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm run format
npx prisma generate
npx prisma migrate dev
```

## Common Searches

```bash
rg -n "ScreenName|SCREENS|case \"screen_slug\"|navigate\\(" src
rg -n "syncMutationServerFn|type: \"mutationName\"" src/lib
rg -n "model ModelName|schema.prisma" prisma src
```
