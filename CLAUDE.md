# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm start            # Run the bot (node index.js)
npm run dev          # Run with auto-reload via nodemon
npm run register     # Register slash commands with Discord API (run locally, not by Railway)
npm test             # Run unit tests (node:test, no extra dependencies)
```

**`npm run register` must be run manually from your local machine whenever slash commands are added, removed, or modified.** Railway only runs `npm start` — it never registers commands.

### Website (`web/`)

```bash
cd web
npm install
npm run dev    # localhost:3000
npm run build  # static export → out/
```

## Hosting

The bot is hosted on **Railway**, connected to this GitHub repo. Railway runs `npm start` and redeploys on every push to `main`. Environment variables are set in the Railway dashboard — do not commit `.env` to the repo.

**Watch Paths** are configured on the Railway service to only watch bot files, so pushes that only touch `web/` do not trigger a redeploy.

## Environment Setup

Copy `.env.sample` to `.env` and populate:
- `DISCORD_TOKEN` — Bot token
- `APP_ID` — Discord application ID
- `PUBLIC_KEY` — App public key
- `GUILD_ID` — *(Optional)* Guild ID for instant command registration during development
- `DATA_DIR` — *(Optional)* Directory for `guild-config.json`. Set to `/data` on Railway (with a Volume mounted there) to persist config across redeploys. Falls back to project root if unset.

## Architecture

Yu-Jin is a Node.js (ESM, `"type": "module"`) Discord bot using **discord.js v14** and the **Gateway API** (persistent WebSocket). There is no Express server — all interaction handling goes through the Gateway.

**Responsibilities handled by the Gateway client:**
1. `voiceStateUpdate` event — detects voice joins, records `lastSeen`, and posts a randomized notification to the configured channel
2. `interactionCreate` event — handles all slash commands
3. Scheduled interval timers — per-guild timers that post random messages from `messages.json` to the notify channel
4. Daily absence check — runs on startup and every 24h; alerts for watched users who haven't joined voice within their threshold

**Detecting a join:**
```
oldState.channelId === null && newState.channelId !== null  →  user joined
```
Bots are filtered out via `newState.member.user.bot`.

**Module responsibilities:**
- `index.js` — Entry point: creates `Client` with `Guilds` + `GuildVoiceStates` intents, attaches all event handlers, manages `scheduleTimers` (guildId → intervalId) and three shuffle-queue maps (`messageQueues`, `joinMessageQueues`, `absenceMessageQueues`) in memory; contains `checkAbsences()` logic
- `commands.js` — Exports command name constants and command definition objects; registers commands via Discord REST API when run directly (`npm run register`)
- `config.js` — All config read/write functions; reads and writes `guild-config.json` with an in-memory cache (disk read only on first access)
- `utils.js` — Pure utility functions: `getNextMessage(map, guildId, messages)` manages per-guild shuffle queues

**Config persistence:** `guild-config.json` maps guild ID → guild config object. Created at runtime, gitignored. Path is `$DATA_DIR/guild-config.json` when `DATA_DIR` is set, otherwise project root. On Railway, `DATA_DIR=/data` with a Volume mounted at `/data` is required to survive redeploys.

```json
{
  "guildId": {
    "notifyChannelId": "...",
    "mentionUserId": "...",
    "scheduleIntervalMinutes": 60,
    "favors": [
      { "id": "uuid", "fromUserId": "...", "toUserId": "...", "reason": "...", "timestamp": 0, "settled": false }
    ],
    "absenceWatches": {
      "userId": { "thresholdDays": 7, "lastAlerted": null }
    },
    "lastSeen": {
      "userId": 1234567890
    }
  }
}
```

**Join messages:** `join-messages.json` is a JSON array of strings with `{user}` and `{channel}` placeholders. Drawn from a per-guild shuffle queue; refills when exhausted (no repeats until all messages have been sent).

**Scheduled messages:** `messages.json` is a JSON array of strings. Drawn from a per-guild shuffle queue; refills when exhausted.

**Absence alerts:** `ABSENCE_MESSAGES` array inline in `index.js`. Drawn from a per-guild shuffle queue; refills when exhausted. Uses `<@userId>` ping format.

**Required Gateway intents:** `Guilds`, `GuildVoiceStates` (neither is privileged).

**Node version note:** Uses `import ... with { type: 'json' }` syntax (Node v22+). The `assert` keyword is not used.

## Website Architecture (`web/`)

Next.js 15 App Router, Tailwind CSS, MDX. Deployed to Vercel with Root Directory set to `web` in the Vercel project settings.

**Stack decisions:**
- `output: 'export'` — fully static site, no SSR. Remove when SSR features are needed.
- MDX via `@next/mdx` + `remarkGfm`. Do **not** add `@mdx-js/react` — it causes a `createContext` crash with React 19.
- Content in `web/content/*.mdx`; page components in `web/app/` import and wrap with `<MdxLayout>`.
- `web/content/guide.mdx` mirrors `docs/USERGUIDE.md`. Update both files when guide content changes.

**Invite link:** `href="#"` placeholder in `web/app/page.tsx`. Replace with the real Discord OAuth URL from the Developer Portal when ready.
