# Tech Stack

## Bot

### Runtime
- **Node.js** (v22+) — ESM modules (`"type": "module"`). Uses `import ... with { type: 'json' }` syntax which requires Node v22+.

### Discord
- **discord.js v14** — Gateway API client (persistent WebSocket). No HTTP interaction endpoint — all events and slash commands are handled through the Gateway.
- **Intents used:** `Guilds`, `GuildVoiceStates` (non-privileged); `GuildMessages`, `MessageContent` (non-privileged and privileged respectively — required for @mention and reply-to-bot AI conversation)

### AI
- **@anthropic-ai/sdk** — Anthropic client used in `ai.js` to drive Yu-Jin's responses.
- **Model:** `claude-haiku-4-5-20251001` — used for both `/ask` slash command responses and scheduled message generation.
- **Conversation memory:** per-user message history kept in-memory (up to 20 messages / 10 exchanges); resets on bot restart.
- **Scheduled messages:** AI-generated when the API is available; falls back to the `messages.json` shuffle queue on error.

### Configuration
- **dotenv** — Loads environment variables from `.env` into `process.env` at startup.
- **guild-config.json** — Runtime-generated JSON file (gitignored) that stores all per-guild settings: notify channel, mention user, schedule interval, favor ledger, absence watches, and last-seen timestamps. Read once on first access and kept in an in-memory cache for the lifetime of the process.

### Testing
- **node:test** — Node's built-in test runner. No third-party test framework. Run with `npm test`.
- **node:assert/strict** — Built-in assertion library used in all tests.

### Dev Tooling
- **nodemon** — Watches `index.js` and restarts the process on file changes. Used via `npm run dev`.

---

## Website (`web/`)

### Framework
- **Next.js 15** — App Router. Configured with `output: 'export'` for fully static generation (no SSR, no server). Remove `output: 'export'` if SSR features are needed in the future.

### Language
- **TypeScript** — Used for all page and layout components under `web/app/`.

### Styling
- **Tailwind CSS** — Utility-first CSS. Dark cyberpunk theme: background `#080808`, accent `#00e5ff`.

### Content
- **MDX** — Markdown with JSX, used for content pages (guide, ToS, privacy policy).
  - Configured via `@next/mdx` + `remarkGfm`.
  - Do **not** add `@mdx-js/react` — it causes a `createContext` crash with React 19.
- Content files live in `web/content/*.mdx`. Page components in `web/app/` import and wrap them with `<MdxLayout>`.

### Deployment
- **Vercel** — Static site hosting. Root Directory set to `web` in the Vercel project settings. Deployed automatically on push to `main` (subject to Railway Watch Paths not blocking it).

---

## Infrastructure

### Bot Hosting
- **Railway** — Runs `npm start` in a persistent container. Redeploys automatically on every push to `main`.
- **Railway Volume** — Mounted at `/data` to persist `guild-config.json` across redeploys. Required because Railway containers are ephemeral. Set `DATA_DIR=/data` in the Railway dashboard.
- **Watch Paths** — Configured on the Railway service to only trigger redeploys when bot files change (e.g. `index.js`, `config.js`, `commands.js`, `*.json`). Pushes that only touch `web/` are ignored by Railway.

### Source Control
- **GitHub** — Both Railway and Vercel are connected to this repo and deploy on push to `main`.

---

## File Overview

| File / Directory | Purpose |
|---|---|
| `index.js` | Bot entry point — Discord client, event handlers, timers, absence checks, AI conversation |
| `ai.js` | Anthropic SDK wrapper — `askYuJin()` and `generateScheduledMessage()` |
| `config.js` | Config read/write with in-memory cache; all guild state lives here |
| `commands.js` | Slash command definitions; also registers commands when run directly |
| `utils.js` | Pure utility functions (`getNextMessage` shuffle queue logic) |
| `messages.json` | Scheduled message strings (fallback when AI is unavailable) |
| `join-messages.json` | Voice join notification strings (`{user}`, `{channel}` placeholders) |
| `guild-config.json` | Runtime config (gitignored; created on first run) |
| `test/` | Unit tests using `node:test` |
| `web/` | Next.js static website |
| `docs/` | Project documentation |
