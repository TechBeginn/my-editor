const { DocumentManager } = require('../src/documentRoom');
const { TextCRDT } = require('../src/crdt');

function check(label, condition) {
  console.log(`${condition ? '✅ PASS' : '❌ FAIL'} - ${label}`);
  if (!condition) process.exitCode = 1;
}

console.log('--- Simulating 2 clients typing into the same room ---\n');

const manager = new DocumentManager();
const room = manager.getOrCreateRoom('doc-1');

room.addClient('client-A');
room.addClient('client-B');

const clientADoc = new TextCRDT('client-A');
const op1 = clientADoc.insertLocal(null, 'h');
const op2 = clientADoc.insertLocal(op1.newChar.id, 'i');

const recipients1 = room.applyOperation('client-A', op1);
const recipients2 = room.applyOperation('client-A', op2);

check('server document now reads "hi"', room.currentText() === 'hi');
check('only client-B should receive the broadcast',
  recipients1.length === 1 && recipients1[0] === 'client-B');

const clientBDoc = new TextCRDT('client-B');
clientBDoc.applyRemote(op1);
clientBDoc.applyRemote(op2);

check('client B\'s local copy also reads "hi"', clientBDoc.toText() === 'hi');
check('server and client B now match', room.currentText() === clientBDoc.toText());

console.log('\n--- A client disconnecting shouldn\'t break anything ---');
room.removeClient('client-A');
check('client-A no longer receives future broadcasts',
  room.applyOperation('client-B', clientBDoc.insertLocal(op2.newChar.id, '!')).length === 0);
