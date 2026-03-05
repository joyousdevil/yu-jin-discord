import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';

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
