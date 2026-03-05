import 'dotenv/config';
import { fileURLToPath } from 'url';
import { REST, Routes, ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';

export const CMD_SET_NOTIFY_CHANNEL = 'set-notify-channel';
export const CMD_SET_MENTION_USER = 'set-mention-user';
export const CMD_SET_SCHEDULE = 'set-schedule';
export const CMD_FAVOR = 'favor';
export const CMD_ABSENCE = 'absence';

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

export const FAVOR = {
  name: CMD_FAVOR,
  description: 'Track favors between server members.',
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'log',
      description: 'Log a favor.',
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'The other person in the favor.',
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'reason',
          description: 'What the favor is for.',
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'direction',
          description: 'Who owes whom.',
          required: true,
          choices: [
            { name: 'I owe them', value: 'i-owe' },
            { name: 'They owe me', value: 'they-owe' },
          ],
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'list',
      description: 'List unsettled favors.',
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'Filter to favors involving this user (defaults to you).',
          required: false,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'settle',
      description: 'Mark the oldest unsettled favor between you and a user as settled.',
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'The other person in the favor.',
          required: true,
        },
      ],
    },
  ],
};

export const ABSENCE = {
  name: CMD_ABSENCE,
  description: 'Watch for users who have gone quiet.',
  default_member_permissions: String(PermissionFlagsBits.ManageGuild),
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'watch',
      description: 'Alert if a user hasn\'t joined voice in N days.',
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'The user to watch.',
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: 'days',
          description: 'Alert threshold in days.',
          required: true,
          min_value: 1,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'unwatch',
      description: 'Stop watching a user.',
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'The user to stop watching.',
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'list',
      description: 'List all watched users.',
    },
  ],
};

const ALL_COMMANDS = [SET_NOTIFY_CHANNEL, SET_MENTION_USER, SET_SCHEDULE, FAVOR, ABSENCE];

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
