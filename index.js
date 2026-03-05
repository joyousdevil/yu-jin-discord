import 'dotenv/config';
import { Client, GatewayIntentBits, MessageFlags } from 'discord.js';
import { getConfig, setNotifyChannel, setMentionUser } from './config.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once('clientReady', () => {
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
  const mention = guildConfig.mentionUserId ? ` — <@${guildConfig.mentionUserId}>` : '';
  await notifyChannel.send(`**${username}** joined **#${voiceChannelName}**${mention}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'set-notify-channel') {
    const channel = interaction.options.getChannel('channel');
    await setNotifyChannel(interaction.guildId, channel.id);
    await interaction.reply({
      content: `Voice join notifications will be posted in <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  } else if (interaction.commandName === 'set-mention-user') {
    const user = interaction.options.getUser('user');
    await setMentionUser(interaction.guildId, user.id);
    await interaction.reply({
      content: `<@${user.id}> will be mentioned in voice join notifications.`,
      flags: MessageFlags.Ephemeral,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
