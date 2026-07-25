/**
 * A simple text CRDT (Conflict-free Replicated Data Type).
 *
 * PLAIN-ENGLISH SUMMARY:
 * The document is a list of character objects. Each character has:
 *   - the letter itself
 *   - a unique ID (so we never confuse two different characters)
 *   - a POSITION KEY (see position.js) that determines where it sits
 *     in the document, relative to every other character
 *
 * To insert a new letter "after character X", we look at X's
 * position key and the position key of whatever currently comes
 * right after X, then generate a brand new key that sits strictly
 * between the two. Because that key is baked into the character
 * forever, every other user's copy can figure out exactly where it
 * belongs just by sorting -- no negotiating with neighbors needed,
 * and the order this document assembles a batch of operations in
 * never changes the final result.
 */

const { compareKeys, generateKeyBetween } = require('./position');

// Compare two characters for sort order. We compare position keys
// first. If two characters end up with the EXACT same position key
// (this genuinely happens: two users typing "at the same spot" at
// the same time can independently compute the same midpoint), we
// fall back to comparing their unique IDs. Since IDs never change
// and are embedded in the character forever, this fallback gives
// every replica the same answer regardless of which order the
// operations happened to arrive in -- which is the whole point.
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

    // chars is always kept SORTED by position key. We don't need
    // START/END sentinel objects anymore -- "nothing before the
    // first character" and "nothing after the last" are just
    // represented as `null` when generating keys.
    this.chars = [];
  }

  toText() {
    return this.chars
      .filter((c) => !c.deleted)
      .map((c) => c.char)
      .join('');
  }

  _findIndexById(id) {
    const index = this.chars.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Character with id ${id} not found`);
    return index;
  }

  // Find the correct sorted position to insert a character with the
  // given position key (binary search, since chars is always sorted).
  _findInsertionIndex(newChar) {
    let lo = 0;
    let hi = this.chars.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (compareChars(this.chars[mid], newChar) < 0) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  /**
   * Insert `char` right after the character with id = afterId.
   * Pass afterId = null to insert at the very start of the document.
   */
  insertLocal(afterId, char) {
    const leftIndex = afterId === null ? -1 : this._findIndexById(afterId);
    const leftPos = leftIndex === -1 ? null : this.chars[leftIndex].pos;
    const rightPos =
      leftIndex + 1 < this.chars.length ? this.chars[leftIndex + 1].pos : null;

    const pos = generateKeyBetween(leftPos, rightPos);

    this.counter += 1;
    const newChar = {
      id: makeId(this.userId, this.counter),
      char,
      deleted: false,
      pos,
    };

    const insertAt = this._findInsertionIndex(newChar);
    this.chars.splice(insertAt, 0, newChar);

    // This is what gets sent to other users. Notice it carries the
    // position key directly -- other replicas don't need to know
    // "afterId" at all, they just sort by pos.
    return { type: 'insert', newChar };
  }

  deleteLocal(id) {
    const index = this._findIndexById(id);
    this.chars[index].deleted = true;
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
}

module.exports = { TextCRDT };
