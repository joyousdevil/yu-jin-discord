export function getNextMessage(map, guildId, messages) {
  if (!map.has(guildId) || map.get(guildId).length === 0) {
    const shuffled = [...messages].sort(() => Math.random() - 0.5);
    map.set(guildId, shuffled);
  }
  return map.get(guildId).pop();
}
