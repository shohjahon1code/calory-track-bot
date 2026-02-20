# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Oshpaz AI — a Telegram Mini App for calorie tracking with AI-powered features. Monorepo with separate backend and frontend.

## Commands

### Backend (`backend/`)
```bash
npm run dev          # Dev server with hot reload (tsx watch)
npm run build        # Compile TypeScript to dist/
npm run type-check   # tsc --noEmit
npm start            # Run compiled dist/server.js
```

### Frontend (`mini-app/`)
```bash
npm run dev          # Vite dev server on port 5173
npm run build        # TypeScript check + Vite production build
npm run type-check   # tsc --noEmit
```

No root package.json — run `npm install` separately in `backend/` and `mini-app/`.

## Architecture

### Backend (Node.js + Express + TypeScript + MongoDB + grammY + OpenAI)

**Pattern: Model → Service → Route**
- **Models** (`src/models/*.ts`): Mongoose schemas with `IXDocument` interfaces extending `Document`
- **Services** (`src/services/*.service.ts`): Singleton classes exported as `export default new XService()`
- **Routes** (`src/routes/*.routes.ts`): Express routers calling services, returning JSON
- **Types** (`src/types/index.ts`): Shared `IUser`, `IMeal`, etc. interfaces

**ESM module system** — all imports use `.js` extensions (e.g., `import userService from "./services/user.service.js"`).

**Entry point**: `src/server.ts` initializes Express, MongoDB, Telegram bot (grammY), and reminder service (60s cron interval).

**Bot** (`src/bot/bot.ts`): Handles Telegram commands and photo messages. Uses grammY `Context`. Admin commands gated by hardcoded `adminId`.

### Frontend (React 18 + Vite + TypeScript + Tailwind CSS v4)

**Tab-based routing** in `App.tsx` — no React Router. `activeTab` state switches components. Heavy tabs lazy-loaded with `React.lazy()`.

**API layer**: Singleton `ApiService` in `services/api.ts` wraps Axios. Base URL from `VITE_API_URL` env var.

**Telegram SDK**: Singleton `telegramService` in `utils/telegram.ts` wraps `@twa-dev/sdk`. Provides `getUserId()`, `haptic()`, `showAlert()`, `showConfirm()`, `close()`.

**i18n**: Two languages — English (`en`) and Uzbek (`uz`) in `locales/{en,uz}/translation.json`. Uses `react-i18next` with `useTranslation()` hook. Fallback language: `uz`.

**Styling**: Tailwind CSS v4 with custom theme in `tailwind.config.js`. Uses `@import "tailwindcss"` + `@config "../tailwind.config.js"` in CSS. Framer Motion for animations. Icons from `lucide-react`.

## Key Conventions

- Backend services are singletons — never instantiate with `new`, import the default export
- Backend uses `tgId` (Telegram user ID as string) as the primary user identifier across all APIs
- Frontend components fetch data in `useEffect` with `telegramService.getUserId()` for the tgId
- Premium check: `Subscription.findOne({ userId: user._id, status: "active" })` then verify `endDate > now`
- All API routes prefixed with `/api/` (e.g., `/api/user/:tgId`, `/api/meals/:tgId/today`)
- OpenAI calls go through `openaiService` methods which return `{ success, data/response, error }` pattern

## Tailwind v4 Gotchas

- Must use `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- Must add `@config "../tailwind.config.js"` after the import for config to be recognized
- Cannot use `@apply` with custom component class names — inline utilities instead

## Environment Variables

Backend: `TELEGRAM_BOT_TOKEN`, `OPENAI_API_KEY`, `MONGODB_URI`, `PORT` (3000), `MINI_APP_URL`
Frontend: `VITE_API_URL` (e.g., `http://localhost:3000/api`)
