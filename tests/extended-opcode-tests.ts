import { CPU, Flag, Register, Z_true, N_true, H_true, C_true } from '../src/modules/cpu.js';
import { assertEqual, assertState, setupTest } from './test-helpers.js';

// NOP test also servers as template for other tests.

suite('0xCB00 RLC B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCB, 0x00],
        { [Register.B]: 0x84 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.B]: 0x09 },
        { [Flag.C]: true },
        {},
    );
});

suite('0xCB08 RRC B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCB, 0x08],
        { [Register.B]: 0x21 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.B]: 0x90 },
        { [Flag.C]: true },
        {},
    );
});

suite('0xCB10 RL B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCB, 0x10],
        { [Register.B]: 0xC2 },
        { [Flag.C]: true },
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.B]: 0x85 },
        { [Flag.C]: true },
        {},
    );
});

suite('0xCB18 RR B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCB, 0x18],
        { [Register.B]: 0xC2 },
        { [Flag.C]: true },
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8
        { [Register.B]: 0xE1 },
        { [Flag.C]: false },
        {},
    );
});

suite('0xCB20 SLA B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCB, 0x20],
        { [Register.B]: 0x80 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.B]: 0x00 },
        { [Flag.Z]: true, [Flag.C]: true },
        {},
    );
});

suite('0xCB28 SRA B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCB, 0x28],
        { [Register.B]: 0x8A },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.B]: 0xC5 },
        { [Flag.Z]: false, [Flag.C]: false },
        {},
    );
});

suite('0xCB30 SWAP B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCB, 0x30],
        { [Register.B]: 0x0F0 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.B]: 0x0F },
        {},
        {},
    );
});

suite('0xCB38 SRL B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCB, 0x38],
        { [Register.B]: 0x0FF },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.B]: 0x7F },
        { [Flag.Z]: false, [Flag.C]: true },
        {},
    );
});

suite('0xCB40 BIT 0,B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCB, 0x40],
        { [Register.B]: 0x01, },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        {},
        { [Flag.Z]: false, [Flag.N]: false, [Flag.H]: true },
        {},
    );
});

suite('0xCB80 RES 0,B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCB, 0x80],
        { [Register.B]: 0x01, },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.B]: 0x00 },
        {},
        {},
    );
});

suite('0xCBC0 SET 0, B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCB, 0xC0],
        { [Register.B]: 0x00, },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.B]: 0x01 },
        {},
        {},
    );
});