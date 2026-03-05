import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const CONFIG_PATH = new URL('./guild-config.json', import.meta.url).pathname;

async function readConfig() {
  if (!existsSync(CONFIG_PATH)) return {};
  const raw = await readFile(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

export async function getConfig(guildId) {
  const config = await readConfig();
  return config[guildId] ?? null;
}

export async function setNotifyChannel(guildId, channelId) {
  const config = await readConfig();
  config[guildId] = { notifyChannelId: channelId };
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}
