// This file connects everything: the textbox on screen, our local
// CRDT copy, and the WebSocket connection to the server.

const textarea = document.getElementById('editor');
const statusEl = document.getElementById('status');

let doc = null;          // will become a TextCRDT once we know our client id
let myClientId = null;
let previousText = '';   // what the textarea said last time, for diffing
let applyingRemoteChange = false; // guard so we don't diff our own remote-triggered updates

const ws = new WebSocket('wss://my-editor-production.up.railway.app');

ws.onopen = () => {
  statusEl.textContent = 'Connected';
};

ws.onclose = () => {
  statusEl.textContent = 'Disconnected (refresh to reconnect)';
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'init') {
    // First message we ever get: the server hands us the WHOLE
    // current document plus our own client id.
    myClientId = message.yourClientId;
    doc = new TextCRDT(myClientId);
    doc.loadFromChars(message.chars);
    renderFromDoc();
    statusEl.textContent = `Connected as ${myClientId}`;
  } else if (message.type === 'op') {
    // Someone else typed or deleted something -- apply it to our
    // local copy and refresh what's on screen.
    doc.applyRemote(message.op);
    renderFromDoc();
  }
};

function renderFromDoc() {
  applyingRemoteChange = true;
  const cursorPos = textarea.selectionStart;
  const text = doc.toText();
  textarea.value = text;
  previousText = text;
  // Best-effort: keep the cursor roughly where it was. Real editors
  // do this more carefully; good enough for our purposes here.
  textarea.selectionStart = textarea.selectionEnd = Math.min(cursorPos, text.length);
  applyingRemoteChange = false;
}

textarea.addEventListener('input', () => {
  if (applyingRemoteChange || !doc) return;

  const newText = textarea.value;
  const { prefixLen, deletedText, insertedText } = diffText(previousText, newText);

  // Handle a deletion: mark each deleted character as deleted, one
  // at a time, working from the position right after the prefix.
  if (deletedText.length > 0) {
    for (let i = 0; i < deletedText.length; i += 1) {
      const idToDelete = doc.idAtVisibleIndex(prefixLen + 1);
      if (idToDelete) {
        const op = doc.deleteLocal(idToDelete);
        ws.send(JSON.stringify(op));
      }
    }
  }

  // Handle an insertion: insert each new character right after the
  // previous one, walking forward from the end of the prefix.
  if (insertedText.length > 0) {
    let afterId = doc.idAtVisibleIndex(prefixLen);
    for (const ch of insertedText) {
      const op = doc.insertLocal(afterId, ch);
      ws.send(JSON.stringify(op));
      afterId = op.newChar.id;
    }
  }

  previousText = newText;
});
