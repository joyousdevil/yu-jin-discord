import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const CONFIG_PATH = fileURLToPath(new URL('./guild-config.json', import.meta.url));

let configCache = null;

async function readConfig() {
  if (configCache) return configCache;
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    configCache = JSON.parse(raw);
  } catch {
    configCache = {};
  }
  return configCache;
}

async function writeConfig(config) {
  configCache = config;
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function getConfig(guildId) {
  const config = await readConfig();
  return config[guildId] ?? null;
}

export async function setNotifyChannel(guildId, channelId) {
  const config = await readConfig();
  config[guildId] = { ...config[guildId], notifyChannelId: channelId };
  await writeConfig(config);
}

export async function setMentionUser(guildId, userId) {
  const config = await readConfig();
  config[guildId] = { ...config[guildId], mentionUserId: userId };
  await writeConfig(config);
}

export async function setScheduleInterval(guildId, minutes) {
  const config = await readConfig();
  config[guildId] = { ...config[guildId], scheduleIntervalMinutes: minutes };
  await writeConfig(config);
}

export async function logFavor(guildId, fromUserId, toUserId, reason) {
  const config = await readConfig();
  if (!config[guildId]) config[guildId] = {};
  if (!config[guildId].favors) config[guildId].favors = [];
  const favor = { id: randomUUID(), fromUserId, toUserId, reason, timestamp: Date.now(), settled: false };
  config[guildId].favors.push(favor);
  await writeConfig(config);
  return favor;
}

export async function getFavors(guildId, userId) {
  const config = await readConfig();
  const favors = config[guildId]?.favors ?? [];
  const unsettled = favors.filter(f => !f.settled);
  if (!userId) return unsettled;
  return unsettled.filter(f => f.fromUserId === userId || f.toUserId === userId);
}

export async function settleFavor(guildId, fromUserId, toUserId) {
  const config = await readConfig();
  const favors = config[guildId]?.favors ?? [];
  const favor = favors.find(
    f => !f.settled && (
      (f.fromUserId === fromUserId && f.toUserId === toUserId) ||
      (f.fromUserId === toUserId && f.toUserId === fromUserId)
    )
  );
  if (!favor) return null;
  favor.settled = true;
  await writeConfig(config);
  return favor;
}

export async function updateLastSeen(guildId, userId) {
  const config = await readConfig();
  if (!config[guildId]) config[guildId] = {};
  if (!config[guildId].lastSeen) config[guildId].lastSeen = {};
  config[guildId].lastSeen[userId] = Date.now();
  await writeConfig(config);
}

export async function setAbsenceWatch(guildId, userId, thresholdDays) {
  const config = await readConfig();
  if (!config[guildId]) config[guildId] = {};
  if (!config[guildId].absenceWatches) config[guildId].absenceWatches = {};
  config[guildId].absenceWatches[userId] = {
    thresholdDays,
    lastAlerted: config[guildId].absenceWatches[userId]?.lastAlerted ?? null,
  };
  await writeConfig(config);
}

export async function removeAbsenceWatch(guildId, userId) {
  const config = await readConfig();
  if (!config[guildId]?.absenceWatches) return;
  delete config[guildId].absenceWatches[userId];
  await writeConfig(config);
}

export async function getAbsenceWatches(guildId) {
  const config = await readConfig();
  return config[guildId]?.absenceWatches ?? {};
}

export async function updateLastAlerted(guildId, userId) {
  const config = await readConfig();
  if (!config[guildId]?.absenceWatches?.[userId]) return;
  config[guildId].absenceWatches[userId].lastAlerted = Date.now();
  await writeConfig(config);
}
