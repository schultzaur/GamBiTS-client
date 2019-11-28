import { CPU, Flag, Register } from './../src/modules/cpu.js';
import { assertEqual, assertState, setupTest } from './test-helpers.js';

suite('0x00 NOP');
test("Basic", function() {
    var [cpu, snapshot] = setupTest([0x00]);

    cpu.step();

    assertState(
        cpu,
        snapshot,
        4,
        { [Register.PC]: snapshot.registers.PC + 1 },
        {},
        {}
    )
});

suite('0x2F CPL');
test('Basic', function() {
    var [cpu, snapshot] = setupTest([0x2F], { [Register.A]: 0x12 });

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        4,
        { [Register.A]: 0xED, [Register.PC]: snapshot.registers.PC + 1 },
        { [Flag.H]: 1, [Flag.N]: 1},
        {},
    )
});


suite('0x3C INC A');
test('Basic', function() {
    var [cpu, snapshot] = setupTest([0x3C], { [Register.A]: 0x12 });

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        4,
        { [Register.A]: 0x13, [Register.PC]: snapshot.registers.PC + 1 },
        {},
        {},
    )
});

suite('0x46 LD B,(HL)');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x46],
        { [Register.H]: 0xC0, [Register.L]: 0x10 },
        { 0xC010: 0x23 },
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        8,
        { [Register.B]: 0x23, [Register.PC]: snapshot.registers.PC + 1 },
        {},
        {},
    );
});

suite('0x77 LD (HL),A');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x77],
        { [Register.A]: 0x23, [Register.H]: 0xC0, [Register.L]: 0x10 },
    );
    
    cpu.step();

    assertState(
        cpu,
        snapshot,
        8,
        { [Register.PC]: snapshot.registers.PC + 1 },
        {},
        { 0xC010: 0x23 },
    )
});
