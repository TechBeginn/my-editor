const { TextCRDT } = require('./crdt');

class DocumentRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.doc = new TextCRDT('server');
    this.clients = new Set();
  }

  addClient(clientId) {
    this.clients.add(clientId);
  }

  removeClient(clientId) {
    this.clients.delete(clientId);
  }

  currentText() {
    return this.doc.toText();
  }

  applyOperation(fromClientId, op) {
    this.doc.applyRemote(op);
    const recipients = [];
    for (const clientId of this.clients) {
      if (clientId !== fromClientId) recipients.push(clientId);
    }
    return recipients;
  }
}

class DocumentManager {
  constructor() {
    this.rooms = new Map();
  }

  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new DocumentRoom(roomId));
    }
    return this.rooms.get(roomId);
  }
}

module.exports = { DocumentRoom, DocumentManager };
