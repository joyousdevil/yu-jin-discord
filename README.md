# Yu-Jin

A Discord bot that posts a notification when a user joins a voice channel, and periodically sends random messages to a configured channel. All settings are configurable per-guild via slash commands.

## Setup

```bash
cp .env.sample .env   # then fill in your credentials
npm install
npm run register      # one-time: register slash commands with Discord
npm start
```

## Environment Variables

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Bot token from the Discord Developer Portal |
| `APP_ID` | Application ID |
| `PUBLIC_KEY` | App public key |
| `GUILD_ID` | *(Optional)* Register commands to a specific guild for instant updates during development |

## Commands

| Script | Description |
|---|---|
| `npm start` | Run the bot |
| `npm run dev` | Run with auto-reload via nodemon |
| `npm run register` | Register slash commands with Discord |

## Slash Commands

### `/set-notify-channel`
Sets the text channel where voice join notifications and scheduled messages are posted. Requires **Manage Guild** permission.

### `/set-mention-user`
Sets a user to mention in every voice join notification. Requires **Manage Guild** permission. Optional — omit to post notifications without a mention.

### `/set-schedule`
Sets how often Yu-Jin posts a random message to the notify channel. Pass an interval in minutes, or `0` to disable. Requires **Manage Guild** permission.

## How It Works

Yu-Jin connects to Discord via the Gateway API (WebSocket) and listens for `VOICE_STATE_UPDATE` events. When a human user joins a voice channel, it posts a message to the configured notification channel:

```
**Alice** joined **#Gaming**
**Alice** joined **#Gaming** — @Bob
```

It also supports posting periodic random messages (sourced from `messages.json`) on a configurable interval per guild.

Guild preferences are stored in `guild-config.json` (created at runtime, gitignored).
