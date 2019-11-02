import CPU from '../src/modules/cpu';
import { ok } from './test-helpers';

suite('NOP');

test('0x00', function() {
    var cpu = new CPU();
    cpu.NOP();
    ok(cpu.reg.A == 0, "Example test");
});
