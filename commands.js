import 'dotenv/config';
import { fileURLToPath } from 'url';
import { REST, Routes, ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';

export const CMD_SET_NOTIFY_CHANNEL = 'set-notify-channel';
export const CMD_SET_MENTION_USER = 'set-mention-user';
export const CMD_SET_SCHEDULE = 'set-schedule';

export const SET_NOTIFY_CHANNEL = {
  name: CMD_SET_NOTIFY_CHANNEL,
  description: 'Set the channel where voice join notifications are posted.',
  default_member_permissions: String(PermissionFlagsBits.ManageGuild),
  options: [
    {
      type: ApplicationCommandOptionType.Channel,
      name: 'channel',
      description: 'The text channel to post notifications in.',
      required: true,
    },
  ],
};

export const SET_MENTION_USER = {
  name: CMD_SET_MENTION_USER,
  description: 'Set a user to mention in voice join notifications.',
  default_member_permissions: String(PermissionFlagsBits.ManageGuild),
  options: [
    {
      type: ApplicationCommandOptionType.User,
      name: 'user',
      description: 'The user to mention when someone joins a voice channel.',
      required: true,
    },
  ],
};

export const SET_SCHEDULE = {
  name: CMD_SET_SCHEDULE,
  description: 'Set how often Yu-Jin posts a random message to the notify channel. Use 0 to disable.',
  default_member_permissions: String(PermissionFlagsBits.ManageGuild),
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      name: 'interval',
      description: 'Minutes between messages (0 to disable).',
      required: true,
      min_value: 0,
    },
  ],
};

const ALL_COMMANDS = [SET_NOTIFY_CHANNEL, SET_MENTION_USER, SET_SCHEDULE];

async function installCommands() {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  const guildId = process.env.GUILD_ID;

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(process.env.APP_ID, guildId), {
      body: ALL_COMMANDS,
    });
    console.log(`Registered commands to guild ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(process.env.APP_ID), {
      body: ALL_COMMANDS,
    });
    console.log('Registered commands globally');
  }
}

// Only register when run directly (npm run register)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  installCommands().catch(console.error);
}
