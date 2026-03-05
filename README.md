# Yu-Jin

A Discord bot built around a Cyberpunk TTRPG fixer character. Yu-Jin watches the door, keeps a favor ledger, and notices when people go quiet. All settings are configurable per-guild via slash commands.

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
Sets a user to mention in every voice join notification. Requires **Manage Guild** permission.

### `/set-schedule`
Sets how often Yu-Jin posts a random message to the notify channel. Pass an interval in minutes, or `0` to disable. Requires **Manage Guild** permission.

### `/favor`
Track favors between server members. Available to all members.

- `/favor log @user reason:... direction:i-owe|they-owe` — Log a new favor
- `/favor list [@user]` — List unsettled favors involving you (or another user)
- `/favor settle @user` — Mark the oldest unsettled favor between you and a user as settled

### `/absence`
Watch for users who have gone quiet. Requires **Manage Guild** permission.

- `/absence watch @user days:N` — Alert if a user hasn't joined voice in N days
- `/absence unwatch @user` — Stop watching a user
- `/absence list` — Show all watched users and their last-seen dates

## How It Works

Yu-Jin connects to Discord via the Gateway API (WebSocket) and listens for `VOICE_STATE_UPDATE` events. When a human user joins a voice channel, it picks a random message from `join-messages.json` and posts it to the configured notification channel.

It also supports:
- **Periodic random messages** sourced from `messages.json`, on a configurable interval per guild
- **Favor ledger** stored per-guild in `guild-config.json`
- **Absence detection** — a daily check that pings watched users who haven't joined voice within their configured threshold

Guild preferences are stored in `guild-config.json` (created at runtime, gitignored).

## Website (`web/`)

A static Next.js site (Tailwind CSS + MDX) with a home page, user guide, Terms of Service, and Privacy Policy. Deployed to Vercel with Root Directory set to `web` in the Vercel project settings.

```bash
cd web
npm install
npm run dev    # localhost:3000
npm run build  # generates out/
```

Content pages live in `web/content/`. `web/content/guide.mdx` mirrors `docs/USERGUIDE.md` — keep both in sync when updating.
