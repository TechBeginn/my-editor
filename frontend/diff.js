/**
 * PLAIN-ENGLISH IDEA:
 * A plain <textarea> doesn't tell us "user typed the letter x at
 * position 5" -- it just gives us the WHOLE new text every time
 * something changes. So we compare the old text to the new text
 * ourselves and figure out what actually changed.
 *
 * The trick: find how many characters match at the START (the
 * "common prefix") and how many match at the END (the "common
 * suffix"). Whatever's left in the middle is the actual change.
 *
 * Example:
 *   old: "The cat sat"
 *   new: "The black cat sat"
 *   common prefix: "The " (4 chars)
 *   common suffix: "cat sat" (7 chars)
 *   what's left in the middle: "black" was INSERTED
 */
function diffText(oldText, newText) {
  let prefixLen = 0;
  const maxPrefix = Math.min(oldText.length, newText.length);
  while (prefixLen < maxPrefix && oldText[prefixLen] === newText[prefixLen]) {
    prefixLen += 1;
  }

  let suffixLen = 0;
  const maxSuffix = Math.min(oldText.length, newText.length) - prefixLen;
  while (
    suffixLen < maxSuffix &&
    oldText[oldText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]
  ) {
    suffixLen += 1;
  }

  const deletedText = oldText.slice(prefixLen, oldText.length - suffixLen);
  const insertedText = newText.slice(prefixLen, newText.length - suffixLen);

  return {
    prefixLen,       // how many chars, from the start, stayed the same
    deletedText,      // what got removed (could be empty)
    insertedText,     // what got added (could be empty)
  };
}

// Works in both Node (for testing) and the browser (no imports needed
// in the browser since we'll load this as a plain <script> tag).
if (typeof module !== 'undefined') {
  module.exports = { diffText };
}
