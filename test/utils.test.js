import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getNextMessage } from '../utils.js';

test('returns a message from the array', () => {
  const map = new Map();
  const messages = ['a', 'b', 'c'];
  const result = getNextMessage(map, 'guild1', messages);
  assert.ok(messages.includes(result));
});

test('returns all messages before repeating', () => {
  const map = new Map();
  const messages = ['a', 'b', 'c'];
  const seen = new Set();
  for (let i = 0; i < 3; i++) {
    seen.add(getNextMessage(map, 'guild1', messages));
  }
  assert.deepEqual(seen, new Set(['a', 'b', 'c']));
});

test('refills queue when exhausted', () => {
  const map = new Map();
  const messages = ['a', 'b'];
  getNextMessage(map, 'guild1', messages);
  getNextMessage(map, 'guild1', messages);
  // Queue exhausted — next call should refill
  const result = getNextMessage(map, 'guild1', messages);
  assert.ok(messages.includes(result));
});

test('different guilds maintain separate queues', () => {
  const map = new Map();
  const messages = ['a'];
  getNextMessage(map, 'guild1', messages);
  getNextMessage(map, 'guild2', messages);
  assert.equal(map.get('guild1').length, 0);
  assert.equal(map.get('guild2').length, 0);
});

test('does not mutate the original messages array', () => {
  const map = new Map();
  const messages = ['a', 'b', 'c'];
  const original = [...messages];
  for (let i = 0; i < 3; i++) {
    getNextMessage(map, 'guild1', messages);
  }
  assert.deepEqual(messages, original);
});
