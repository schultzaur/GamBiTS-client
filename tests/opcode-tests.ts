import { CPU, Flag, Flags, Register, Registers } from '../src/modules/cpu';
import { assertState } from './test-helpers';

suite('NOP');

test('0x00 NOP', function() {
    var cpu = new CPU();
    var snapshot = cpu.snapshot();

    cpu.NOP();
    
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

    cpu.CPL();
    
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

    cpu.INC();
    
    assertState(
        cpu,
        snapshot,
        { [Register.A]: 1},
        {},
        {},
    )
});
