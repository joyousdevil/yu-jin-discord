import "dotenv/config";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  ActivityType,
  PermissionFlagsBits,
} from "discord.js";
import { askYuJin } from "./ai.js";
import {
  getConfig,
  setNotifyChannel,
  clearNotifyChannel,
  setMentionUser,
  clearMentionUser,
  setScheduleInterval,
  logFavor,
  getFavors,
  settleFavor,
  updateLastSeen,
  setAbsenceWatch,
  removeAbsenceWatch,
  getAbsenceWatches,
  updateLastAlerted,
  addQuest,
  getQuests,
  updateQuestStatus,
  removeQuest,
} from "./config.js";
import {
  CMD_SET_NOTIFY_CHANNEL,
  CMD_SET_MENTION_USER,
  CMD_CLEAR_MENTION_USER,
  CMD_SET_SCHEDULE,
  CMD_STOP_SCHEDULE,
  CMD_DISABLE_VOICE_NOTIFIER,
  CMD_FAVOR,
  CMD_ABSENCE,
  CMD_QUEST,
  CMD_ASK,
} from "./commands.js";
import JOIN_MESSAGES from "./join-messages.json" with { type: "json" };
import { getNextMessage } from "./utils.js";

const MESSAGES_PATH = fileURLToPath(
  new URL("./messages.json", import.meta.url),
);

const QUEST_STATUS_LABEL = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};
const QUEST_STATUS_EMOJI = {
  not_started: '⬜',
  in_progress: '🔵',
  completed: '✅',
};

const ABSENCE_MESSAGES = [
  "<@{user}> hasn't come through in a while. Everything okay?",
  "Haven't seen <@{user}> around lately. Noted.",
  "<@{user}>. It's been a few days. I'm not asking. I'm noting.",
  "The ledger shows <@{user}> hasn't checked in. Just an observation.",
  "<@{user}>. The ledger shows a gap. I'm not lecturing. Just noting.",
  "It's been a while since we've heard from <@{user}>. Door's still open.",
  "<@{user}> has been quiet. I have soup if that helps.",
  "Friendly check-in for <@{user}>. No pressure. Just making sure the lines are still good.",
  "<@{user}>. I don't chase. But I do keep records. Come back when you can.",
  "The network misses <@{user}>. I said what I said.",
  "<@{user}> hasn't been around. Noted it three times now. Starting to feel like a pattern.",
  "Checking in on <@{user}>. Not because I'm worried. I'm definitely a little worried.",
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// guildId -> intervalId
const scheduleTimers = new Map();
// Per-type shuffle queues: guildId -> remaining messages
const messageQueues = new Map();
const joinMessageQueues = new Map();
const absenceMessageQueues = new Map();

async function getMessages() {
  const raw = await readFile(MESSAGES_PATH, "utf-8");
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
    const msg = getNextMessage(messageQueues, guild.id, messages);
    try {
      await channel.send(msg);
    } catch (err) {
      console.error(
        `Failed to send scheduled message to guild ${guild.id}:`,
        err,
      );
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

      const template = getNextMessage(
        absenceMessageQueues,
        guild.id,
        ABSENCE_MESSAGES,
      );
      const msg = template.replace("{user}", userId);
      try {
        await notifyChannel.send(msg);
        await updateLastAlerted(guild.id, userId);
      } catch (err) {
        console.error(
          `Failed to send absence alert to guild ${guild.id}:`,
          err,
        );
      }
    }
  }
}

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity("Project Zomboid", {
    type: ActivityType.Playing,
    start: Date.now(),
  });
  for (const guild of client.guilds.cache.values()) {
    const config = await getConfig(guild.id);
    if (config?.notifyChannelId && config?.scheduleIntervalMinutes) {
      startSchedule(
        guild,
        config.notifyChannelId,
        config.scheduleIntervalMinutes,
      );
      console.log(
        `Scheduled messages every ${config.scheduleIntervalMinutes}m for guild ${guild.id}`,
      );
    }
  }
  checkAbsences();
  setInterval(checkAbsences, 24 * 60 * 60 * 1000);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  // Only handle joins (was not in a channel, now is)
  if (oldState.channelId !== null || newState.channelId === null) return;
  // Skip bots
  if (newState.member?.user.bot) return;

  const guildId = newState.guild.id;
  const userId = newState.member.user.id;

  await updateLastSeen(guildId, userId);

  const guildConfig = await getConfig(guildId);
  if (!guildConfig?.notifyChannelId) return;

  const notifyChannel = newState.guild.channels.cache.get(
    guildConfig.notifyChannelId,
  );
  if (!notifyChannel) return;

  const username = newState.member.user.username;
  const voiceChannelName = newState.channel.name;
  const mention = guildConfig.mentionUserId
    ? ` — <@${guildConfig.mentionUserId}>`
    : "";

  const template = getNextMessage(joinMessageQueues, guildId, JOIN_MESSAGES);
  const msg = template
    .replace("{user}", username)
    .replace("{channel}", voiceChannelName);

  try {
    await notifyChannel.send(msg + mention);
  } catch (err) {
    console.error(
      `Failed to send voice notification to guild ${guildId}:`,
      err,
    );
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const isMention = message.mentions.has(client.user);
  let isReplyToBot = false;
  if (message.reference?.messageId) {
    const referenced = await message.channel.messages
      .fetch(message.reference.messageId)
      .catch(() => null);
    isReplyToBot = referenced?.author?.id === client.user.id;
  }

  if (!isMention && !isReplyToBot) return;

  const userText = message.content.replace(/<@!?\d+>/g, '').trim();
  if (!userText) return;

  await message.channel.sendTyping();
  try {
    const reply = await askYuJin(userText);
    await message.reply(reply);
  } catch (err) {
    console.error('[AI] Error calling Haiku:', err);
  }
});

client.on("interactionCreate", async (interaction) => {
  const { guildId } = interaction;

  if (interaction.isAutocomplete()) {
    if (interaction.commandName === CMD_QUEST) {
      const sub = interaction.options.getSubcommand();
      if (sub === "update" || sub === "delete") {
        const focused = interaction.options.getFocused();
        const quests = await getQuests(guildId);
        const choices = quests
          .filter((q) => q.name.toLowerCase().includes(focused.toLowerCase()))
          .slice(0, 25)
          .map((q) => ({
            name: `${QUEST_STATUS_EMOJI[q.status]} ${q.name}`,
            value: q.id,
          }));
        await interaction.respond(choices);
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === CMD_SET_NOTIFY_CHANNEL) {
    const channel = interaction.options.getChannel("channel");
    await setNotifyChannel(guildId, channel.id);
    await interaction.reply({
      content: `Voice join notifications will be posted in <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  } else if (commandName === CMD_SET_MENTION_USER) {
    const user = interaction.options.getUser("user");
    await setMentionUser(guildId, user.id);
    await interaction.reply({
      content: `<@${user.id}> will be mentioned in voice join notifications.`,
      flags: MessageFlags.Ephemeral,
    });
  } else if (commandName === CMD_CLEAR_MENTION_USER) {
    await clearMentionUser(guildId);
    await interaction.reply({
      content:
        "Mention user removed. Notifications will no longer ping anyone.",
      flags: MessageFlags.Ephemeral,
    });
  } else if (commandName === CMD_SET_SCHEDULE) {
    const minutes = interaction.options.getInteger("minutes");
    await setScheduleInterval(guildId, minutes);

    if (minutes === 0) {
      stopSchedule(guildId);
      await interaction.reply({
        content: "Scheduled messages disabled.",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      const guildConfig = await getConfig(guildId);
      if (!guildConfig?.notifyChannelId) {
        await interaction.reply({
          content: "Set a notify channel first with `/set-notify-channel`.",
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
  } else if (commandName === CMD_STOP_SCHEDULE) {
    await setScheduleInterval(guildId, 0);
    stopSchedule(guildId);
    await interaction.reply({
      content: "Scheduled messages stopped.",
      flags: MessageFlags.Ephemeral,
    });
  } else if (commandName === CMD_DISABLE_VOICE_NOTIFIER) {
    await clearNotifyChannel(guildId);
    await interaction.reply({
      content: "Voice join notifications disabled.",
      flags: MessageFlags.Ephemeral,
    });
  } else if (commandName === CMD_FAVOR) {
    const sub = interaction.options.getSubcommand();

    if (sub === "log") {
      const target = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      const direction = interaction.options.getString("direction");
      const fromId = direction === "i-owe" ? interaction.user.id : target.id;
      const toId = direction === "i-owe" ? target.id : interaction.user.id;
      await logFavor(guildId, fromId, toId, reason);
      await interaction.reply({
        content: `Logged. I don't forget.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (sub === "list") {
      const filterUser = interaction.options.getUser("user");
      const userId = filterUser?.id ?? interaction.user.id;
      const favors = await getFavors(guildId, userId);

      if (!favors.length) {
        await interaction.reply({
          content: "The ledger is clear. For now.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const lines = favors.map((f) => {
        const date = new Date(f.timestamp).toLocaleDateString();
        if (f.fromUserId === interaction.user.id) {
          return `→ You owe <@${f.toUserId}>: ${f.reason} *(${date})*`;
        } else {
          return `← <@${f.fromUserId}> owes you: ${f.reason} *(${date})*`;
        }
      });
      await interaction.reply({
        content: lines.join("\n"),
        flags: MessageFlags.Ephemeral,
      });
    } else if (sub === "settle") {
      const target = interaction.options.getUser("user");
      const settled = await settleFavor(
        guildId,
        interaction.user.id,
        target.id,
      );
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

    if (sub === "watch") {
      const user = interaction.options.getUser("user");
      const days = interaction.options.getInteger("days");
      await setAbsenceWatch(guildId, user.id, days);
      await interaction.reply({
        content: `Watching **${user.username}**. I'll say something if they go quiet for ${days} day(s).`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (sub === "unwatch") {
      const user = interaction.options.getUser("user");
      await removeAbsenceWatch(guildId, user.id);
      await interaction.reply({
        content: `Removed **${user.username}** from the watch list.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (sub === "list") {
      const watches = await getAbsenceWatches(guildId);
      const config = await getConfig(guildId);
      const lastSeen = config?.lastSeen ?? {};
      const entries = Object.entries(watches);

      if (!entries.length) {
        await interaction.reply({
          content: "Nobody on the watch list.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const lines = entries.map(([userId, watch]) => {
        const ts = lastSeen[userId];
        const seenStr = ts ? new Date(ts).toLocaleDateString() : "never";
        return `<@${userId}> — alert after ${watch.thresholdDays} day(s), last seen ${seenStr}`;
      });
      await interaction.reply({
        content: lines.join("\n"),
        flags: MessageFlags.Ephemeral,
      });
    }
  } else if (commandName === CMD_QUEST) {
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const name = interaction.options.getString("name");
      const description = interaction.options.getString("description");
      await addQuest(guildId, { name, description, createdBy: interaction.user.id });
      await interaction.reply({
        content: `Quest added: **${name}**`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (sub === "list") {
      const statusFilter = interaction.options.getString("status") ?? "all";
      const quests = await getQuests(guildId);
      const filtered =
        statusFilter === "all"
          ? quests
          : quests.filter((q) => q.status === statusFilter);

      if (!filtered.length) {
        await interaction.reply({
          content:
            statusFilter === "all"
              ? "No quests yet. Add one with `/quest add`."
              : `No quests with status **${QUEST_STATUS_LABEL[statusFilter]}**.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const embed = new EmbedBuilder().setTitle("📜 Quest Board");

      const statusOrder = ["not_started", "in_progress", "completed"];
      const groups =
        statusFilter === "all"
          ? statusOrder
          : [statusFilter];

      for (const status of groups) {
        const items = filtered.filter((q) => q.status === status);
        if (!items.length) continue;
        const lines = items.map((q) => {
          const desc =
            q.description.length > 100
              ? q.description.slice(0, 97) + "…"
              : q.description;
          return `• **${q.name}** — ${desc}`;
        });
        embed.addFields({
          name: `${QUEST_STATUS_EMOJI[status]} ${QUEST_STATUS_LABEL[status]}`,
          value: lines.join("\n"),
        });
      }

      await interaction.reply({ embeds: [embed] });
    } else if (sub === "update") {
      const questId = interaction.options.getString("quest");
      const status = interaction.options.getString("status");
      const quests = await getQuests(guildId);
      const quest = quests.find((q) => q.id === questId);
      if (quest && quest.createdBy !== interaction.user.id && !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "Only the quest creator or an admin can update this quest.", flags: MessageFlags.Ephemeral });
        return;
      }
      const updated = await updateQuestStatus(guildId, questId, status);
      if (!updated) {
        await interaction.reply({
          content: "Quest not found.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await interaction.reply({
        content: `**${updated.name}** marked as ${QUEST_STATUS_EMOJI[status]} ${QUEST_STATUS_LABEL[status]}.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (sub === "delete") {
      const questId = interaction.options.getString("quest");
      const quests = await getQuests(guildId);
      const quest = quests.find((q) => q.id === questId);
      if (quest && quest.createdBy !== interaction.user.id && !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "Only the quest creator or an admin can delete this quest.", flags: MessageFlags.Ephemeral });
        return;
      }
      const deleted = await removeQuest(guildId, questId);
      await interaction.reply({
        content: deleted ? "Quest deleted." : "Quest not found.",
        flags: MessageFlags.Ephemeral,
      });
    }
  } else if (commandName === CMD_ASK) {
    const userText = interaction.options.getString('message');
    await interaction.deferReply();
    try {
      const reply = await askYuJin(userText);
      await interaction.editReply(reply);
    } catch (err) {
      console.error('[AI] Error calling Haiku:', err);
      await interaction.editReply("Something went wrong. Try again.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
