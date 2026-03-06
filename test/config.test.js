import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Set DATA_DIR before config.js is imported so CONFIG_PATH resolves to the temp dir
const tmpDir = await mkdtemp(join(tmpdir(), 'yu-jin-test-'));
process.env.DATA_DIR = tmpDir;

const { getFavors, settleFavor, logFavor } = await import('../config.js');

after(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// Each test uses a unique guild ID to avoid configCache cross-contamination
let guildCounter = 0;
const nextGuild = () => `guild-${guildCounter++}`;

// --- getFavors ---

test('getFavors returns empty array when no favors exist', async () => {
  const favors = await getFavors(nextGuild());
  assert.deepEqual(favors, []);
});

test('getFavors returns only unsettled favors', async () => {
  const guildId = nextGuild();
  await logFavor(guildId, 'user1', 'user2', 'a reason');
  await settleFavor(guildId, 'user1', 'user2');
  const favors = await getFavors(guildId);
  assert.deepEqual(favors, []);
});

test('getFavors without userId returns all unsettled', async () => {
  const guildId = nextGuild();
  await logFavor(guildId, 'user1', 'user2', 'favor1');
  await logFavor(guildId, 'user3', 'user4', 'favor2');
  const favors = await getFavors(guildId);
  assert.equal(favors.length, 2);
});

test('getFavors with userId filters to favors where user is debtor', async () => {
  const guildId = nextGuild();
  await logFavor(guildId, 'user1', 'user2', 'favor1');
  await logFavor(guildId, 'user3', 'user4', 'favor2');
  const favors = await getFavors(guildId, 'user1');
  assert.equal(favors.length, 1);
  assert.equal(favors[0].fromUserId, 'user1');
});

test('getFavors with userId includes favors where user is creditor', async () => {
  const guildId = nextGuild();
  await logFavor(guildId, 'user1', 'user2', 'favor1');
  const favors = await getFavors(guildId, 'user2');
  assert.equal(favors.length, 1);
  assert.equal(favors[0].toUserId, 'user2');
});

// --- settleFavor ---

test('settleFavor marks the favor as settled', async () => {
  const guildId = nextGuild();
  await logFavor(guildId, 'user1', 'user2', 'a reason');
  const settled = await settleFavor(guildId, 'user1', 'user2');
  assert.ok(settled);
  assert.equal(settled.settled, true);
});

test('settleFavor works bidirectionally', async () => {
  const guildId = nextGuild();
  await logFavor(guildId, 'user1', 'user2', 'a reason');
  // Settle with reversed argument order
  const settled = await settleFavor(guildId, 'user2', 'user1');
  assert.ok(settled);
  assert.equal(settled.settled, true);
});

test('settleFavor returns null when no matching favor exists', async () => {
  const result = await settleFavor(nextGuild(), 'user1', 'user2');
  assert.equal(result, null);
});

test('settleFavor does not match an already-settled favor', async () => {
  const guildId = nextGuild();
  await logFavor(guildId, 'user1', 'user2', 'a reason');
  await settleFavor(guildId, 'user1', 'user2');
  const second = await settleFavor(guildId, 'user1', 'user2');
  assert.equal(second, null);
});
