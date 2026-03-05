# Yu-Jin

A Discord bot that posts a message in a designated text channel whenever a user joins a voice channel. The notification channel is configurable per-guild via a slash command.

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
Sets the text channel where voice join notifications are posted. Requires **Manage Guild** permission.

## How It Works

Yu-Jin connects to Discord via the Gateway API (WebSocket) and listens for `VOICE_STATE_UPDATE` events. When a human user joins a voice channel, it posts a message to the configured notification channel:

```
**Alice** joined **#Gaming**
```

Guild notification channel preferences are stored in `guild-config.json` (created at runtime, gitignored).
