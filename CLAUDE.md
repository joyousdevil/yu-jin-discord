# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm start            # Run the bot (node index.js)
npm run dev          # Run with auto-reload via nodemon
npm run register     # Register slash commands with Discord API
```

No test or lint scripts are configured.

### Website (`web/`)

```bash
cd web
npm install
npm run dev    # localhost:3000
npm run build  # static export → out/
```

## Environment Setup

Copy `.env.sample` to `.env` and populate:
- `DISCORD_TOKEN` — Bot token
- `APP_ID` — Discord application ID
- `PUBLIC_KEY` — App public key
- `GUILD_ID` — *(Optional)* Guild ID for instant command registration during development

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
- `index.js` — Entry point: creates `Client` with `Guilds` + `GuildVoiceStates` intents, attaches all event handlers, manages `scheduleTimers` (guildId → intervalId) and `messageQueues` (guildId → shuffled message array) in memory; contains `checkAbsences()` logic
- `commands.js` — Exports command name constants and command definition objects; registers commands via Discord REST API when run directly (`npm run register`)
- `config.js` — All config read/write functions; reads and writes `guild-config.json` with an in-memory cache (disk read only on first access)

**Config persistence:** `guild-config.json` at the project root maps guild ID → guild config object. Created at runtime, gitignored.

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

**Join messages:** `join-messages.json` is a JSON array of strings with `{user}` and `{channel}` placeholders. One is picked at random on each voice join (no shuffle queue — joins are infrequent).

**Scheduled messages:** `messages.json` is a JSON array of strings. Messages are shuffled per-guild into a queue; the queue refills when exhausted (no repeats until all messages have been sent).

**Absence alerts:** `ABSENCE_MESSAGES` array inline in `index.js`. One picked at random per alert. Uses `<@userId>` ping format.

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
