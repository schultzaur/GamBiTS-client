import { CPU, Flag, Register } from './../src/modules/cpu.js';
import { assertState, assertEqual } from './test-helpers.js';

suite('NOP');

test('0x00 NOP', function() {
    var cpu = new CPU();
    var snapshot = cpu.snapshot();

    cpu.NOP(0x00);
    
    assertState(
        cpu,
        snapshot,
        { [Register.A]: 0},
        { [Flag.C]: 0 },
        {},
    )
});

suite('CPL');

test('0x2F CPL', function() {
    var cpu = new CPU();
    var snapshot = cpu.snapshot();

    cpu.CPL(0x2F);
    
    assertState(
        cpu,
        snapshot,
        { [Register.A]: 255},
        { [Flag.H]: 1, [Flag.N]: 1},
        {},
    )
});


suite('INC');

test('0x3C INC A', function() {
    var cpu = new CPU();
    var snapshot = cpu.snapshot();

    cpu.INC(0x3C);
    
    assertState(
        cpu,
        snapshot,
        { [Register.A]: 1},
        {},
        {},
    )
});

suite('LD');

test('0x46 LD B, (HL)', function() {
    var cpu = new CPU();

    cpu.memory.write(0xC010, 0x23);
    cpu.registers[Register.H] = 0xC0;
    cpu.registers[Register.L] = 0x10;
    
    var snapshot = cpu.snapshot();

    cpu.LD(0x46);
    
    assertState(
        cpu,
        snapshot,
        { [Register.B]: 0x23},
        {},
        {},
    )
});

test('0x77 LD (HL), A', function() {
    var cpu = new CPU();

    cpu.registers[Register.A] = 0x23;
    cpu.registers[Register.H] = 0xC0;
    cpu.registers[Register.L] = 0x10;
    
    var snapshot = cpu.snapshot();

    cpu.LD(0x77);
    
    assertState(
        cpu,
        snapshot,
        {},
        {},
        {},
    )

    assertEqual(
        0x23,
        cpu.memory.read(0xC010),
        "memory 0xC010"
    );
});
