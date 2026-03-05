import 'dotenv/config';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { Client, GatewayIntentBits, MessageFlags } from 'discord.js';
import { getConfig, setNotifyChannel, setMentionUser, setScheduleInterval } from './config.js';
import { CMD_SET_NOTIFY_CHANNEL, CMD_SET_MENTION_USER, CMD_SET_SCHEDULE } from './commands.js';

const MESSAGES_PATH = fileURLToPath(new URL('./messages.json', import.meta.url));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// guildId -> intervalId
const scheduleTimers = new Map();
// guildId -> shuffled message queue
const messageQueues = new Map();

function getNextMessage(guildId, messages) {
  if (!messageQueues.has(guildId) || messageQueues.get(guildId).length === 0) {
    const shuffled = [...messages].sort(() => Math.random() - 0.5);
    messageQueues.set(guildId, shuffled);
  }
  return messageQueues.get(guildId).pop();
}

async function getMessages() {
  const raw = await readFile(MESSAGES_PATH, 'utf-8');
  return JSON.parse(raw);
}

function stopSchedule(guildId) {
  if (scheduleTimers.has(guildId)) {
    clearInterval(scheduleTimers.get(guildId));
    scheduleTimers.delete(guildId);
  }
}

function startSchedule(guild, notifyChannelId, intervalMinutes) {
  stopSchedule(guild.id);
  const ms = intervalMinutes * 60 * 1000;
  const timer = setInterval(async () => {
    const channel = guild.channels.cache.get(notifyChannelId);
    if (!channel) return;
    const messages = await getMessages();
    if (!messages.length) return;
    const msg = getNextMessage(guild.id, messages);
    try {
      await channel.send(msg);
    } catch (err) {
      console.error(`Failed to send scheduled message to guild ${guild.id}:`, err);
    }
  }, ms);
  scheduleTimers.set(guild.id, timer);
}

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  for (const guild of client.guilds.cache.values()) {
    const config = await getConfig(guild.id);
    if (config?.notifyChannelId && config?.scheduleIntervalMinutes) {
      startSchedule(guild, config.notifyChannelId, config.scheduleIntervalMinutes);
      console.log(`Scheduled messages every ${config.scheduleIntervalMinutes}m for guild ${guild.id}`);
    }
  }
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
  try {
    await notifyChannel.send(`**${username}** joined **#${voiceChannelName}**${mention}`);
  } catch (err) {
    console.error(`Failed to send voice notification to guild ${newState.guild.id}:`, err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === CMD_SET_NOTIFY_CHANNEL) {
    const channel = interaction.options.getChannel('channel');
    await setNotifyChannel(interaction.guildId, channel.id);
    await interaction.reply({
      content: `Voice join notifications will be posted in <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  } else if (interaction.commandName === CMD_SET_MENTION_USER) {
    const user = interaction.options.getUser('user');
    await setMentionUser(interaction.guildId, user.id);
    await interaction.reply({
      content: `<@${user.id}> will be mentioned in voice join notifications.`,
      flags: MessageFlags.Ephemeral,
    });
  } else if (interaction.commandName === CMD_SET_SCHEDULE) {
    const minutes = interaction.options.getInteger('interval');
    await setScheduleInterval(interaction.guildId, minutes);

    if (minutes === 0) {
      stopSchedule(interaction.guildId);
      await interaction.reply({
        content: 'Scheduled messages disabled.',
        flags: MessageFlags.Ephemeral,
      });
    } else {
      const guildConfig = await getConfig(interaction.guildId);
      if (!guildConfig?.notifyChannelId) {
        await interaction.reply({
          content: 'Set a notify channel first with `/set-notify-channel`.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      startSchedule(interaction.guild, guildConfig.notifyChannelId, minutes);
      await interaction.reply({
        content: `Scheduled messages will post every ${minutes} minute(s) in <#${guildConfig.notifyChannelId}>.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
