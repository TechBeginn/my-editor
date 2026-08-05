const fs = require('fs');
const path = require('path');

// Where we'll save documents. One JSON file per room.
const DATA_DIR = path.join(__dirname, '..', 'data');

// Make sure the data folder exists before we try to write to it.
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePathForRoom(roomId) {
  return path.join(DATA_DIR, `${roomId}.json`);
}

// Save a room's character array to disk.
function saveRoom(roomId, chars) {
  ensureDataDir();
  const filePath = filePathForRoom(roomId);
  fs.writeFileSync(filePath, JSON.stringify(chars));
}

// Load a room's character array from disk.
// Returns an empty array if no saved file exists yet.
function loadRoom(roomId) {
  const filePath = filePathForRoom(roomId);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

module.exports = { saveRoom, loadRoom };