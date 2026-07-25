/**
 * Fractional position keys.
 *
 * PLAIN-ENGLISH IDEA:
 * Give every character a "position number" that sits strictly
 * between its left and right neighbor's numbers -- like always being
 * able to find a decimal between any two other decimals (0.5 is
 * between 0.4 and 0.6; 0.45 is between 0.4 and 0.5; you can always
 * go deeper). Once every character has one of these numbers, sorting
 * the whole document is just "sort by this number" -- no scanning,
 * no arguing about siblings.
 *
 * We represent the number as an array of digits instead of a decimal,
 * because JavaScript numbers lose precision if you go too deep
 * (imagine 40 people inserting between the same two letters).
 */

const BASE = 1000000; // how many "slots" we have at each digit level

// Compare two position-key arrays. Missing digits count as 0
// (so [5] and [5, 0] are considered equal -- this matters below).
function compareKeys(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const av = a[i] !== undefined ? a[i] : 0;
    const bv = b[i] !== undefined ? b[i] : 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/**
 * Generate a brand new key that sits strictly between `before` and
 * `after`.
 *   - `before` = null means "there is nothing to the left" (-infinity)
 *   - `after` = null means "there is nothing to the right" (+infinity)
 */
function generateKeyBetween(before, after) {
  const b = before || [];
  const a = after || null;
  const result = [];
  let i = 0;

  // Safety valve so a bug can't infinite-loop; 100 digits deep is
  // already an absurd number of concurrent inserts at one spot.
  while (i < 100) {
    const bv = b[i] !== undefined ? b[i] : 0;
    const av = a && a[i] !== undefined ? a[i] : BASE;

    if (av - bv > 1) {
      // There's room for a brand new digit right here -- pick the
      // midpoint and we're done.
      result.push(bv + 1 + Math.floor((av - bv - 1) / 2));
      return result;
    }

    // No room at this digit (e.g. bv=5, av=6, nothing fits between
    // 5 and 6 at this level) -- match `before`'s digit here and go
    // one level deeper to find room.
    result.push(bv);
    i += 1;
  }

  // Astronomically unlikely fallback.
  result.push(0);
  return result;
}

module.exports = { compareKeys, generateKeyBetween };
