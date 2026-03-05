import 'dotenv/config';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { Client, GatewayIntentBits, MessageFlags } from 'discord.js';
import {
  getConfig, setNotifyChannel, setMentionUser, setScheduleInterval,
  logFavor, getFavors, settleFavor,
  updateLastSeen, setAbsenceWatch, removeAbsenceWatch, getAbsenceWatches, updateLastAlerted,
} from './config.js';
import {
  CMD_SET_NOTIFY_CHANNEL, CMD_SET_MENTION_USER, CMD_SET_SCHEDULE,
  CMD_FAVOR, CMD_ABSENCE,
} from './commands.js';
import JOIN_MESSAGES from './join-messages.json' with { type: 'json' };

const MESSAGES_PATH = fileURLToPath(new URL('./messages.json', import.meta.url));

const ABSENCE_MESSAGES = [
  "<@{user}> hasn't come through in a while. Everything okay?",
  "Haven't seen <@{user}> around lately. Noted.",
  "<@{user}>. It's been a few days. I'm not asking. I'm noting.",
  "The ledger shows <@{user}> hasn't checked in. Just an observation.",
];

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

async function checkAbsences() {
  for (const guild of client.guilds.cache.values()) {
    const config = await getConfig(guild.id);
    if (!config?.notifyChannelId) continue;
    const notifyChannel = guild.channels.cache.get(config.notifyChannelId);
    if (!notifyChannel) continue;

    const watches = await getAbsenceWatches(guild.id);
    const lastSeen = config.lastSeen ?? {};
    const now = Date.now();

    for (const [userId, watch] of Object.entries(watches)) {
      const seen = lastSeen[userId];
      if (!seen) continue;
      const thresholdMs = watch.thresholdDays * 86400000;
      if (now - seen < thresholdMs) continue;
      if (watch.lastAlerted && now - watch.lastAlerted < thresholdMs) continue;

      const template = ABSENCE_MESSAGES[Math.floor(Math.random() * ABSENCE_MESSAGES.length)];
      const msg = template.replace('{user}', userId);
      try {
        await notifyChannel.send(msg);
        await updateLastAlerted(guild.id, userId);
      } catch (err) {
        console.error(`Failed to send absence alert to guild ${guild.id}:`, err);
      }
    }
  }
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
  checkAbsences();
  setInterval(checkAbsences, 24 * 60 * 60 * 1000);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  // Only handle joins (was not in a channel, now is)
  if (oldState.channelId !== null || newState.channelId === null) return;
  // Skip bots
  if (newState.member?.user.bot) return;

  const guildId = newState.guild.id;
  const userId = newState.member.user.id;

  await updateLastSeen(guildId, userId);

  const guildConfig = await getConfig(guildId);
  if (!guildConfig?.notifyChannelId) return;

  const notifyChannel = newState.guild.channels.cache.get(guildConfig.notifyChannelId);
  if (!notifyChannel) return;

  const username = newState.member.user.username;
  const voiceChannelName = newState.channel.name;
  const mention = guildConfig.mentionUserId ? ` — <@${guildConfig.mentionUserId}>` : '';

  const template = JOIN_MESSAGES[Math.floor(Math.random() * JOIN_MESSAGES.length)];
  const msg = template.replace('{user}', username).replace('{channel}', voiceChannelName);

  try {
    await notifyChannel.send(msg + mention);
  } catch (err) {
    console.error(`Failed to send voice notification to guild ${guildId}:`, err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, guildId } = interaction;

  if (commandName === CMD_SET_NOTIFY_CHANNEL) {
    const channel = interaction.options.getChannel('channel');
    await setNotifyChannel(guildId, channel.id);
    await interaction.reply({
      content: `Voice join notifications will be posted in <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });

  } else if (commandName === CMD_SET_MENTION_USER) {
    const user = interaction.options.getUser('user');
    await setMentionUser(guildId, user.id);
    await interaction.reply({
      content: `<@${user.id}> will be mentioned in voice join notifications.`,
      flags: MessageFlags.Ephemeral,
    });

  } else if (commandName === CMD_SET_SCHEDULE) {
    const minutes = interaction.options.getInteger('interval');
    await setScheduleInterval(guildId, minutes);

    if (minutes === 0) {
      stopSchedule(guildId);
      await interaction.reply({
        content: 'Scheduled messages disabled.',
        flags: MessageFlags.Ephemeral,
      });
    } else {
      const guildConfig = await getConfig(guildId);
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

  } else if (commandName === CMD_FAVOR) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'log') {
      const target = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');
      const direction = interaction.options.getString('direction');
      const fromId = direction === 'i-owe' ? interaction.user.id : target.id;
      const toId = direction === 'i-owe' ? target.id : interaction.user.id;
      await logFavor(guildId, fromId, toId, reason);
      await interaction.reply({
        content: `Logged. I don't forget.`,
        flags: MessageFlags.Ephemeral,
      });

    } else if (sub === 'list') {
      const filterUser = interaction.options.getUser('user');
      const userId = filterUser?.id ?? interaction.user.id;
      const favors = await getFavors(guildId, userId);

      if (!favors.length) {
        await interaction.reply({ content: 'The ledger is clear. For now.', flags: MessageFlags.Ephemeral });
        return;
      }

      const lines = favors.map(f => {
        const date = new Date(f.timestamp).toLocaleDateString();
        if (f.fromUserId === interaction.user.id) {
          return `→ You owe <@${f.toUserId}>: ${f.reason} *(${date})*`;
        } else {
          return `← <@${f.fromUserId}> owes you: ${f.reason} *(${date})*`;
        }
      });
      await interaction.reply({ content: lines.join('\n'), flags: MessageFlags.Ephemeral });

    } else if (sub === 'settle') {
      const target = interaction.options.getUser('user');
      const settled = await settleFavor(guildId, interaction.user.id, target.id);
      if (settled) {
        await interaction.reply({
          content: `Settled: ${settled.reason}. Noted in the ledger.`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: `No unsettled favors between you and **${target.username}**.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

  } else if (commandName === CMD_ABSENCE) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'watch') {
      const user = interaction.options.getUser('user');
      const days = interaction.options.getInteger('days');
      await setAbsenceWatch(guildId, user.id, days);
      await interaction.reply({
        content: `Watching **${user.username}**. I'll say something if they go quiet for ${days} day(s).`,
        flags: MessageFlags.Ephemeral,
      });

    } else if (sub === 'unwatch') {
      const user = interaction.options.getUser('user');
      await removeAbsenceWatch(guildId, user.id);
      await interaction.reply({
        content: `Removed **${user.username}** from the watch list.`,
        flags: MessageFlags.Ephemeral,
      });

    } else if (sub === 'list') {
      const watches = await getAbsenceWatches(guildId);
      const config = await getConfig(guildId);
      const lastSeen = config?.lastSeen ?? {};
      const entries = Object.entries(watches);

      if (!entries.length) {
        await interaction.reply({ content: "Nobody on the watch list.", flags: MessageFlags.Ephemeral });
        return;
      }

      const lines = entries.map(([userId, watch]) => {
        const ts = lastSeen[userId];
        const seenStr = ts ? new Date(ts).toLocaleDateString() : 'never';
        return `<@${userId}> — alert after ${watch.thresholdDays} day(s), last seen ${seenStr}`;
      });
      await interaction.reply({ content: lines.join('\n'), flags: MessageFlags.Ephemeral });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
