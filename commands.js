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

const ALL_COMMANDS = [SET_NOTIFY_CHANNEL];

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
