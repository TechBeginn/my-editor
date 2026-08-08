const { WebSocketServer } = require('ws');
const { DocumentManager } = require('./documentRoom');

const PORT = process.env.PORT || 8080;
const manager = new DocumentManager();

let nextClientId = 1;
const socketsByClientId = new Map();

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws, req) => {
  const clientId = `client-${nextClientId}`;
  nextClientId += 1;
  socketsByClientId.set(clientId, ws);

  const roomId = 'default';
  const room = manager.getOrCreateRoom(roomId);
  room.addClient(clientId);

  console.log(`${clientId} connected. Room now has ${room.clients.size} client(s).`);

  ws.send(
    JSON.stringify({
      type: 'init',
      chars: room.doc.chars,
      yourClientId: clientId,
    })
  );

  ws.on('message', (rawMessage) => {
    let op;
    try {
      op = JSON.parse(rawMessage.toString());
    } catch (err) {
      console.error(`Bad message from ${clientId}:`, err.message);
      return;
    }

    const recipients = room.applyOperation(clientId, op);

    const outgoing = JSON.stringify({ type: 'op', op });
    for (const recipientId of recipients) {
      const recipientSocket = socketsByClientId.get(recipientId);
      if (recipientSocket && recipientSocket.readyState === recipientSocket.OPEN) {
        recipientSocket.send(outgoing);
      }
    }
  });

  ws.on('close', () => {
    room.removeClient(clientId);
    socketsByClientId.delete(clientId);
    console.log(`${clientId} disconnected. Room now has ${room.clients.size} client(s).`);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
