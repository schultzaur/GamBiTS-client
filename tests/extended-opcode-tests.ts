import { CPU, Flag, Register, Z_true, N_true, H_true, C_true } from '../src/modules/cpu.js';
import { assertEqual, assertState, setupTest } from './test-helpers.js';

// NOP test also servers as template for other tests.
suite('0xCB00 PLACEHOLDER');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x00, 0xC0, 0x10],
        { [Register.A]: 0x12, [Register.B]: 0xC0, [Register.C]: 0x10 },
        { [Flag.Z]: true },
        { 0xC010: 0x12 }
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x12, [Register.B]: 0xC0, [Register.C]: 0x10 },
        { [Flag.Z]: true },
        { 0xC010: 0x12 }
    );
});
