// Same CRDT logic from Day 1, adapted to run directly in a browser
// (no require/module.exports -- just plain scripts loaded via <script> tags).

const BASE = 1000000;

function compareKeys(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const av = a[i] !== undefined ? a[i] : 0;
    const bv = b[i] !== undefined ? b[i] : 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function generateKeyBetween(before, after) {
  const b = before || [];
  const a = after || null;
  const result = [];
  let i = 0;
  while (i < 100) {
    const bv = b[i] !== undefined ? b[i] : 0;
    const av = a && a[i] !== undefined ? a[i] : BASE;
    if (av - bv > 1) {
      result.push(bv + 1 + Math.floor((av - bv - 1) / 2));
      return result;
    }
    result.push(bv);
    i += 1;
  }
  result.push(0);
  return result;
}

function compareChars(a, b) {
  const byPos = compareKeys(a.pos, b.pos);
  if (byPos !== 0) return byPos;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

function makeId(userId, counter) {
  return `${userId}:${counter}`;
}

class TextCRDT {
  constructor(userId) {
    this.userId = userId;
    this.counter = 0;
    this.chars = [];
  }

  toText() {
    return this.chars.filter((c) => !c.deleted).map((c) => c.char).join('');
  }

  // Get the id of the character currently at visible position `index`
  // (index counts only non-deleted characters). Returns null if
  // index is 0 (meaning "insert at the very start").
  idAtVisibleIndex(index) {
    if (index === 0) return null;
    let seen = 0;
    for (const c of this.chars) {
      if (c.deleted) continue;
      seen += 1;
      if (seen === index) return c.id;
    }
    return null;
  }

  _findIndexById(id) {
    return this.chars.findIndex((c) => c.id === id);
  }

  _findInsertionIndex(newChar) {
    let lo = 0;
    let hi = this.chars.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (compareChars(this.chars[mid], newChar) < 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  insertLocal(afterId, char) {
    const leftIndex = afterId === null ? -1 : this._findIndexById(afterId);
    const leftPos = leftIndex === -1 ? null : this.chars[leftIndex].pos;
    const rightPos = leftIndex + 1 < this.chars.length ? this.chars[leftIndex + 1].pos : null;
    const pos = generateKeyBetween(leftPos, rightPos);

    this.counter += 1;
    const newChar = { id: makeId(this.userId, this.counter), char, deleted: false, pos };
    const insertAt = this._findInsertionIndex(newChar);
    this.chars.splice(insertAt, 0, newChar);
    return { type: 'insert', newChar };
  }

  deleteLocal(id) {
    const index = this._findIndexById(id);
    if (index !== -1) this.chars[index].deleted = true;
    return { type: 'delete', id };
  }

  applyRemote(op) {
    if (op.type === 'insert') {
      const exists = this.chars.some((c) => c.id === op.newChar.id);
      if (!exists) {
        const insertAt = this._findInsertionIndex(op.newChar);
        this.chars.splice(insertAt, 0, { ...op.newChar });
      }
    } else if (op.type === 'delete') {
      const index = this.chars.findIndex((c) => c.id === op.id);
      if (index !== -1) this.chars[index].deleted = true;
    }
  }

  // Rebuild this doc's state entirely from a raw chars array (used
  // when we first connect and the server sends us the full document).
  loadFromChars(chars) {
    this.chars = chars.map((c) => ({ ...c }));
  }
}
