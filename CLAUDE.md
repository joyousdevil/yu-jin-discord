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

**Responsibilities handled by the Gateway client:**
1. `voiceStateUpdate` event — detects voice joins and posts notifications to the configured channel
2. `interactionCreate` event — handles `/set-notify-channel`, `/set-mention-user`, and `/set-schedule` slash commands
3. Scheduled interval timers — per-guild timers that post random messages from `messages.json` to the notify channel

**Detecting a join:**
```
oldState.channelId === null && newState.channelId !== null  →  user joined
```
Bots are filtered out via `newState.member.user.bot`.

**Module responsibilities:**
- `index.js` — Entry point: creates `Client` with `Guilds` + `GuildVoiceStates` intents, attaches all event handlers, manages `scheduleTimers` (guildId → intervalId) and `messageQueues` (guildId → shuffled message array) in memory
- `commands.js` — Exports command name constants (`CMD_SET_NOTIFY_CHANNEL`, etc.) and command definition objects; registers commands via Discord REST API when run directly (`npm run register`)
- `config.js` — `getConfig` / `setNotifyChannel` / `setMentionUser` / `setScheduleInterval` — reads and writes `guild-config.json` with an in-memory cache (disk read only on first access)

**Config persistence:** `guild-config.json` at the project root maps guild ID → `{ notifyChannelId, mentionUserId?, scheduleIntervalMinutes? }`. Created at runtime, gitignored.

**Scheduled messages:** `messages.json` at the project root is a JSON array of strings. Messages are shuffled per-guild into a queue; the queue refills when exhausted (no repeats until all messages have been sent).

**Notification format:** Plain text, no embeds. Mention is appended if configured:
```
**<username>** joined **#<voice-channel-name>**
**<username>** joined **#<voice-channel-name>** — <@mentionUserId>
```

**Required Gateway intents:** `Guilds`, `GuildVoiceStates` (neither is privileged).
