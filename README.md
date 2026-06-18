# Ourfund Codebase Guide

This app is a TanStack Start + React family budget app. Most product UI is built as phone-style screens in `src/components/knit`, with shared app state and actions in `src/lib/navigation.tsx`.

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
