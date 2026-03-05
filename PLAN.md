# Voice Channel Join Notifier — Plan

## Goal

A Discord bot that posts a message in a designated text channel whenever a human user joins a voice channel. The notification channel is configurable per-guild via a slash command.

---

## Architecture

This is a **separate project** from the boilerplate. The boilerplate uses the HTTP Interactions model (Express + webhooks). This bot requires the **Gateway API** (persistent WebSocket), because voice state changes are pushed as real-time events — they cannot be polled or received via HTTP interactions.

**Two concurrent responsibilities:**
1. **Gateway client** — maintains a WebSocket connection to Discord, receives `VOICE_STATE_UPDATE` events, and calls the REST API to post notifications.
2. **Slash command handler** — registers and handles `/set-notify-channel`, which can be done either via the same Gateway client or a thin Express server (discord.js can handle both natively without Express).

Since discord.js handles slash command interactions through the Gateway as well, **no Express server is needed** in this project.

---

## Technology Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js 18+ (ESM modules, matching boilerplate) |
| Discord library | `discord.js` v14 |
| Config persistence | `guild-config.json` (flat file, keyed by guild ID) |
| Environment | `dotenv` |

---

## Required Bot Permissions & Intents

**Gateway Intents** (set in Discord Developer Portal and in code):
- `GUILDS` — needed to resolve channel names and guild info
- `GUILD_VOICE_STATES` — required to receive `VOICE_STATE_UPDATE` events

**Bot Permissions** (OAuth2 invite scope):
- `Send Messages` — to post notifications
- `View Channel` — to access the target text channel
- `Use Slash Commands` / `applications.commands` scope — to register `/set-notify-channel`

**Privileged intents:** `GUILD_VOICE_STATES` is **not** privileged — no special approval needed in the Developer Portal.

---

## Key Discord Concept: Detecting a Join

`VOICE_STATE_UPDATE` fires for joins, leaves, moves, mutes, deafens, etc. Distinguishing a **join** from other events:

```
oldState.channelId === null && newState.channelId !== null  →  user joined
oldState.channelId !== null && newState.channelId === null  →  user left
oldState.channelId !== null && newState.channelId !== null  →  user moved / muted / etc.
```

discord.js exposes this via `voiceStateUpdate` event with `(oldState, newState)` parameters.

---

## Notification Message Format

Plain text, posted to the configured channel:

```
**<username>** joined **#<voice-channel-name>**
```

Example: `**Alice** joined **#Gaming**`

No embeds, no pings.

---

## Configuration Storage

A `guild-config.json` file at the project root, mapping guild ID → notification channel ID:

```json
{
  "123456789012345678": {
    "notifyChannelId": "987654321098765432"
  }
}
```

Read on startup, written whenever `/set-notify-channel` is used. This is intentionally simple — swap for SQLite or a DB if multi-guild scale requires it.

---

## Slash Command: `/set-notify-channel`

- **Name:** `set-notify-channel`
- **Description:** Set the channel where voice join notifications are posted.
- **Option:** `channel` (type: CHANNEL, required) — the target text channel
- **Permission:** Restrict to users with `ManageGuild` permission (`defaultMemberPermissions`)

On use: save `{ guildId → channelId }` to `guild-config.json`, reply ephemerally with confirmation.

---

## File Structure

```
voice-notifier/
├── index.js          # Entry point: creates discord.js Client, registers events
├── commands.js       # /set-notify-channel definition + InstallGlobalCommands helper
├── config.js         # Read/write guild-config.json
├── package.json
├── .env.sample
└── guild-config.json # Created at runtime, gitignored
```

---

## Environment Variables (`.env`)

```
DISCORD_TOKEN=        # Bot token
APP_ID=               # Application ID (for registering commands)
PUBLIC_KEY=           # Not needed for Gateway-only bot, but keep for consistency
```

---

## Implementation Steps

1. **Project setup** — `npm init`, install `discord.js` and `dotenv`, configure ESM (`"type": "module"`).
2. **`config.js`** — `getConfig(guildId)` and `setNotifyChannel(guildId, channelId)` using `fs/promises` to read/write JSON.
3. **`commands.js`** — define the `SET_NOTIFY_CHANNEL` command object and an `installCommands()` function (mirrors the boilerplate pattern).
4. **`index.js`** — create `Client` with `GatewayIntentBits.Guilds` and `GatewayIntentBits.GuildVoiceStates`, attach:
   - `voiceStateUpdate` event → detect join, look up config, post message
   - `interactionCreate` event → handle `/set-notify-channel`
   - `ready` event → log bot is online
5. **Register commands** — run `node commands.js` once (same pattern as boilerplate).
6. **Test** — join a voice channel in a server where the bot is present and the notify channel is set.

---

## Notes & Gotchas

- **Bot must be in the guild** with the correct permissions before the notify channel can be set.
- **`oldState` fields may be null/incomplete** for the very first event after bot startup — check for null `channelId` defensively.
- **Bot joins** — filter with `newState.member.user.bot === true` → skip.
- **Moving between channels** fires `VOICE_STATE_UPDATE` with both `oldState.channelId` and `newState.channelId` non-null — the current plan ignores this (not in scope), but it's easy to add later.
- **Global vs guild commands** — global commands take up to 1 hour to propagate. During development, register as guild-specific commands (add `GUILD_ID` to `.env` and register to that guild) for instant updates.
