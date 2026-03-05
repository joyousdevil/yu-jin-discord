import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { getConfig, setNotifyChannel } from './config.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  // Only handle joins (was not in a channel, now is)
  if (oldState.channelId !== null || newState.channelId === null) return;
  // Skip bots
  if (newState.member?.user.bot) return;

  const guildConfig = await getConfig(newState.guild.id);
  if (!guildConfig?.notifyChannelId) return;

  const notifyChannel = newState.guild.channels.cache.get(guildConfig.notifyChannelId);
  if (!notifyChannel) return;

  const username = newState.member.user.username;
  const voiceChannelName = newState.channel.name;
  await notifyChannel.send(`**${username}** joined **#${voiceChannelName}**`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'set-notify-channel') return;

  const channel = interaction.options.getChannel('channel');
  await setNotifyChannel(interaction.guildId, channel.id);

  await interaction.reply({
    content: `Voice join notifications will be posted in <#${channel.id}>.`,
    ephemeral: true,
  });
});

client.login(process.env.DISCORD_TOKEN);
