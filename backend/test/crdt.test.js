const { TextCRDT } = require('../src/crdt');

// Tiny manual test runner -- no need for a test framework yet.
function check(label, condition) {
  console.log(`${condition ? '✅ PASS' : '❌ FAIL'} - ${label}`);
  if (!condition) process.exitCode = 1;
}

console.log('--- Test 1: single user typing "hi" ---');
{
  const doc = new TextCRDT('user-1');
  const op1 = doc.insertLocal(null, 'h');
  const op2 = doc.insertLocal(op1.newChar.id, 'i');
  check('document reads "hi"', doc.toText() === 'hi');
}

console.log('\n--- Test 2: delete a character ---');
{
  const doc = new TextCRDT('user-1');
  const op1 = doc.insertLocal(null, 'h');
  const op2 = doc.insertLocal(op1.newChar.id, 'i');
  doc.deleteLocal(op1.newChar.id); // delete the "h"
  check('document reads "i" after deleting h', doc.toText() === 'i');
}

console.log('\n--- Test 3: THE REAL TEST ---');
console.log('Two users start with "The cat sat".');
console.log('User A inserts "black " before "cat".');
console.log('User B inserts "big " before "cat", at the same time.');
console.log('Both users receive each other\'s changes, but in OPPOSITE order.');
console.log('Do both documents end up identical anyway?\n');
{
  // Step 1: both users start with the same base document "The cat sat"
  const userA = new TextCRDT('userA');
  const userB = new TextCRDT('userB');

  const baseText = 'The cat sat';
  let afterId = null;
  const baseOps = [];
  for (const ch of baseText) {
    const op = userA.insertLocal(afterId, ch);
    baseOps.push(op);
    afterId = op.newChar.id;
  }
  // User B starts from the exact same base (simulating "document was
  // already synced before the simultaneous edits happened").
  for (const op of baseOps) {
    userB.applyRemote(op);
  }

  check('both start identical', userA.toText() === userB.toText());

  // Find the ID of the character right before "cat" (the space
  // before "c"), so we know where to insert "black "/"big ".
  const textSoFar = userA.toText();
  const catIndex = textSoFar.indexOf('cat'); // index in the *visible* text
  // Walk the CRDT list to find the ID of the visible character just
  // before "cat" starts.
  let visibleCount = 0;
  let insertAfterId = null;
  for (const c of userA.chars) {
    if (c.deleted) continue;
    if (visibleCount === catIndex) break;
    insertAfterId = c.id;
    visibleCount += 1;
  }

  // Step 2: User A inserts "black " (typed as individual characters)
  const wordA = 'black ';
  let aAfter = insertAfterId;
  const opsFromA = [];
  for (const ch of wordA) {
    const op = userA.insertLocal(aAfter, ch);
    opsFromA.push(op);
    aAfter = op.newChar.id;
  }

  // Step 3: User B inserts "big " -- from the SAME anchor point,
  // simulating a truly simultaneous edit neither of them knew about.
  const wordB = 'big ';
  let bAfter = insertAfterId;
  const opsFromB = [];
  for (const ch of wordB) {
    const op = userB.insertLocal(bAfter, ch);
    opsFromB.push(op);
    bAfter = op.newChar.id;
  }

  console.log(`User A's doc right now: "${userA.toText()}"`);
  console.log(`User B's doc right now: "${userB.toText()}"`);

  // Step 4: sync them up, but in OPPOSITE arrival order on purpose,
  // to prove order doesn't matter.
  for (const op of opsFromB) userA.applyRemote(op); // A receives B's ops
  for (const op of opsFromA) userB.applyRemote(op); // B receives A's ops (reverse order overall)

  console.log(`\nAfter syncing:`);
  console.log(`User A's final doc: "${userA.toText()}"`);
  console.log(`User B's final doc: "${userB.toText()}"`);

  check(
    'both documents converged to the exact same text',
    userA.toText() === userB.toText()
  );
  check(
    'both edits survived (contains "black" and "big")',
    userA.toText().includes('black') && userA.toText().includes('big')
  );
}
