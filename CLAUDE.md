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

## Environment Setup

Copy `.env.sample` to `.env` and populate:
- `DISCORD_TOKEN` — Bot token
- `APP_ID` — Discord application ID
- `PUBLIC_KEY` — App public key
- `GUILD_ID` — *(Optional)* Guild ID for instant command registration during development

## Architecture

Yu-Jin is a Node.js (ESM, `"type": "module"`) Discord bot using **discord.js v14** and the **Gateway API** (persistent WebSocket). There is no Express server — all interaction handling goes through the Gateway.

**Two responsibilities handled by the Gateway client:**
1. `voiceStateUpdate` event — detects voice joins and posts notifications to the configured channel
2. `interactionCreate` event — handles the `/set-notify-channel` slash command

**Detecting a join:**
```
oldState.channelId === null && newState.channelId !== null  →  user joined
```
Bots are filtered out via `newState.member.user.bot`.

**Module responsibilities:**
- `index.js` — Entry point: creates `Client` with `Guilds` + `GuildVoiceStates` intents, attaches all event handlers
- `commands.js` — Defines `SET_NOTIFY_CHANNEL` command and registers it via Discord REST API (globally or guild-scoped if `GUILD_ID` is set)
- `config.js` — `getConfig(guildId)` / `setNotifyChannel(guildId, channelId)` — reads and writes `guild-config.json`

**Config persistence:** `guild-config.json` at the project root maps guild ID → notification channel ID. Created at runtime, gitignored.

**Notification format:** Plain text, no embeds, no pings:
```
**<username>** joined **#<voice-channel-name>**
```

**Required Gateway intents:** `Guilds`, `GuildVoiceStates` (neither is privileged).
