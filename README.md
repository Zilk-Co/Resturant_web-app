# Real Farmers Chicken

Real Farmers Chicken is a restaurant ordering app workspace containing:
- `artifacts/mobile/` — Expo mobile app
- `artifacts/admin/` — web admin dashboard
- `artifacts/api-server/` — Express API backend
- `lib/api-spec/openapi.yaml` — shared API contract

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — start the Expo mobile app
- `pnpm --filter @workspace/admin run dev` — start the admin web app
- `pnpm --filter @workspace/api-server run dev` — start the backend API server
- `pnpm run typecheck` — run typechecking across workspace packages
- `pnpm run build` — build all packages in the workspace

## Stack

- pnpm workspaces, Node.js, TypeScript
- Mobile: Expo SDK, Expo Router, React Native
- Admin: Vite + React + Tailwind
- Backend: Express 5, Drizzle ORM

## Project layout

- `artifacts/mobile/` — Expo application source, screens, contexts, hooks
- `artifacts/admin/` — admin dashboard source and UI components
- `artifacts/api-server/` — backend API implementation and build scripts
- `lib/api-spec/` — OpenAPI schema and API codegen

## Notes

- Backend requires `DATABASE_URL` for database connection in future deployments.
- The mobile app uses React Context and AsyncStorage for local state.
- The backend and admin apps are packaged as workspace packages and can be run independently.
