// Simple in-memory SSE hub for realtime notifications.
const clients = new Map(); // userId -> Set<res>

export function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
  res.on("close", () => {
    const set = clients.get(userId);
    if (set) { set.delete(res); if (!set.size) clients.delete(userId); }
  });
}

export function pushNotification(userId, payload) {
  const set = clients.get(userId);
  if (!set) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) { try { res.write(data); } catch {} }
}
