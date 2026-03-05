import 'dotenv/config';
import { REST, Routes, ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';

export const SET_NOTIFY_CHANNEL = {
  name: 'set-notify-channel',
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
  name: 'set-mention-user',
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

const ALL_COMMANDS = [SET_NOTIFY_CHANNEL, SET_MENTION_USER];

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

installCommands().catch(console.error);
