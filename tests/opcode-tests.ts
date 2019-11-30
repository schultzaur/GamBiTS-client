import { CPU, Flag, Register, Z_true, N_true, H_true, C_true, Flags } from './../src/modules/cpu.js';
import { assertEqual, assertState, setupTest } from './test-helpers.js';

// NOP test also servers as template for other tests.
suite('0x00 NOP');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x00, 0xC0, 0x10],
        { [Register.A]: 0x12, [Register.B]: 0xC0, [Register.C]: 0x10 },
        { [Flag.Z]: Z_true },
        { 0xC010: 0x12 }
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x12, [Register.B]: 0xC0, [Register.C]: 0x10 },
        { [Flag.Z]: Z_true },
        { 0xC010: 0x12 }
    );
});

suite('0x01 LD BC,d16');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x01, 0xC0, 0x10],
        {},
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 3,
        12,
        { [Register.B]: 0xC0, [Register.C]: 0x10, },
        {},
        {},
    );
});

suite('0x02 LD (BC),A');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x02],
        { [Register.A]: 0x12, [Register.B]: 0xC0, [Register.C]: 0x10 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        8,
        {},
        {},
        { 0xC010: 0x12 },
    );
});

suite('0x03 INC BC');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x03],
        { [Register.B]: 0x12, [Register.C]: 0x34 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        8,
        { [Register.B]: 0x12, [Register.C]: 0x35 },
        {},
        {},
    )
});

suite('0x04 INC B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x04],
        { [Register.B]: 0x12 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.B]: 0x13 },
        {},
        {},
    )
});

suite('0x05 DEC B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x05],
        { [Register.B]: 0x12 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.B]: 0x11 },
        { [Flag.N]: N_true, [Flag.H]: H_true, },
        {},
    )
});

suite('0x06 LD B,d8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x06, 0x12],
        {},
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.B]: 0x12 },
        {},
        {},
    );
});

suite('0x07 RLCA');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x07],
        { [Register.A]: 0x84 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x09 },
        { [Flag.C]: C_true },
        {},
    );
});

suite('0x08 LD (a16),SP');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x08, 0xC0, 0x10],
        { [Register.SP]: 0xFFFE },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 3,
        20,
        {},
        {},
        { 0xC010: 0xFE, 0xC011: 0xFF },
    );
});

suite('0x09 ADD HL,BC');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x09],
        { [Register.H]: 0x8A, [Register.L]: 0x23, [Register.B]: 0x06, [Register.C]: 0x05, },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        8,
        { [Register.H]: 0x90, [Register.L]: 0x28, },
        { [Flag.N]: 0, [Flag.H]: H_true, [Flag.C]: 0 },
        {},
    );
});

suite('0x0A LD A,(BC)');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x0A],
        { [Register.B]: 0xC0, [Register.C]: 0x10 },
        {},
        { 0xC010: 0x12 },
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        8,
        { [Register.A]: 0x12 },
        {},
        {},
    );
});

suite('0x0B DEC BC');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x0B],
        { [Register.B]: 0x12, [Register.C]: 0x34 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        8,
        { [Register.B]: 0x12, [Register.C]: 0x33 },
        {},
        {},
    )
});

suite('0x0C INC C');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x0C],
        { [Register.C]: 0x12 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.C]: 0x13 },
        {},
        {},
    )
});

suite('0x0D DEC C');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x0D],
        { [Register.C]: 0x12 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.C]: 0x11 },
        { [Flag.N]: N_true, [Flag.H]: H_true, },
        {},
    )
});

suite('0x0E LD C,d8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x0E, 0x12],
        {},
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.C]: 0x12 },
        {},
        {},
    );
});

suite('0x0F RRCA');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x0F],
        { [Register.A]: 0x21 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x90 },
        { [Flag.C]: C_true },
        {},
    );
});

suite('0x10 STOP');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x10],
        {},
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        {},
        {},
        {},
    );

    assertEqual(true, cpu.stopped, "stopped");
});

suite('0x17 RLA');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x17],
        { [Register.A]: 0xC2 },
        { [Flag.C]: C_true },
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x85 },
        { [Flag.C]: C_true },
        {},
    );
});

suite('0x18 JR r8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x18, 0x10],
        {},
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2 + 0x10,
        12,
        {},
        {},
        {},
    );
});

suite('0x1F RRA');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x1F],
        { [Register.A]: 0xC2 },
        { [Flag.C]: C_true },
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0xE1 },
        { [Flag.C]: 0 },
        {},
    );
});

suite('0x20 JR NZ,r8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x20, 0x10],
        {},
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2 + 0x10,
        12,
        {},
        {},
        {},
    );
});

suite('0x27 DAA');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x27],
        { [Register.A]: 0x9C },
        {},
        {},
    );

    cpu.step();

    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x02, },
        { [Flag.Z]: 0, [Flag.H]: 0, [Flag.C]: C_true},
        {},
    )
});

suite('0x28 JR NZ,r8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x28, 0x10],
        {},
        { [Flag.Z]: Z_true },
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2 + 0x10,
        12,
        {},
        {},
        {},
    );
});

suite('0x2F CPL');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x2F],
        { [Register.A]: 0x12 },
        {},
        {},
    );

    cpu.step();

    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0xED, },
        { [Flag.H]: H_true, [Flag.N]: N_true},
        {},
    )
});

suite('0x30 JR NZ,r8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x30, 0x10],
        {},
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2 + 0x10,
        12,
        {},
        {},
        {},
    );
});

suite('0x37 SCF');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x37],
        {},
        {},
        {},
    );

    cpu.step();

    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        {},
        { [Flag.N]: 0, [Flag.H]: 0, [Flag.C]: C_true },
        {},
    )
});

suite('0x38 JR NZ,r8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x38, 0x10],
        {},
        { [Flag.C]: C_true },
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2 + 0x10,
        12,
        {},
        {},
        {},
    );
});

suite('0x3F CCF');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x3F],
        {},
        { [Flag.C]: C_true },
        {},
    );

    cpu.step();

    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        {},
        { [Flag.N]: 0, [Flag.H]: 0, [Flag.C]: 0 },
        {},
    )
});

suite('0x46 LD B,(HL)');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x46],
        { [Register.H]: 0xC0, [Register.L]: 0x10 },
        {},
        { 0xC010: 0x23 },
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        8,
        { [Register.B]: 0x23, },
        {},
        {},
    );
});

suite('0x76 HALT');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x76],
        {},
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        {},
        {},
        {},
    );

    assertEqual(true, cpu.halted, "halted");
});
test('Duplicate Instruction Bug', function() {
    var [cpu, snapshot] = setupTest(
        [0x76, 0x3C /* INC A */],
        {},
        {},
        { 0xFF0F: 0x01, 0xFFFF: 0x01 },
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        8,
        { [Register.A]: 1 },
        {},
        {},
    );

    snapshot = cpu.snapshot();
    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 2 },
        {},
        {},
    );
});

suite('0x77 LD (HL),A');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x77],
        { [Register.A]: 0x23, [Register.H]: 0xC0, [Register.L]: 0x10 },
        {},
        {},
    );
    
    cpu.step();

    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        8,
        {},
        {},
        { 0xC010: 0x23 },
    )
});

suite('0x80 ADD A,B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x80],
        { [Register.A]: 0x3A, [Register.B]: 0xC7 },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x01 },
        { [Flag.Z]: 0, [Flag.N]: 0, [Flag.H]: H_true, [Flag.C]: C_true},
        {},
    )
});

suite('0x88 ADC A,B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x88],
        { [Register.A]: 0x3A, [Register.B]: 0xC7 },
        { [Flag.C]: C_true },
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x02 },
        { [Flag.Z]: 0, [Flag.N]: 0, [Flag.H]: H_true, [Flag.C]: C_true},
        {},
    )
});

suite('0xC6 ADD A,d8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xC6, 0xC7],
        { [Register.A]: 0x3A, },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.A]: 0x01 },
        { [Flag.Z]: 0, [Flag.N]: 0, [Flag.H]: H_true, [Flag.C]: C_true},
        {},
    )
});

suite('0xCE ADC A,d8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCE, 0xC7],
        { [Register.A]: 0x3A, },
        { [Flag.C]: C_true },
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.A]: 0x02 },
        { [Flag.Z]: 0, [Flag.N]: 0, [Flag.H]: H_true, [Flag.C]: C_true},
        {},
    )
});

suite('0xE0 LDH (a8),A');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xE0, 0x90],
        { [Register.A]: 0x12, },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        12,
        {},
        {},
        { 0xFF90: 0x12 }
    );
});

suite('0xE2 LD (C),A');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xE2],
        { [Register.A]: 0x12, [Register.C]: 0x90, },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        8,
        {},
        {},
        { 0xFF90: 0x12 }
    );
});

suite('0xEA LD (a16),A');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xEA, 0xC0, 0x10],
        { [Register.A]: 0x12 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 3,
        16,
        {},
        {},
        { 0xC010: 0x12 }
    );
});

suite('0xF0 LDH A,(a8)');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xF0, 0x90],
        {},
        {},
        { 0xFF90: 0x12 }
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        12,
        { [Register.A]: 0x12 },
        {},
        {},
    );
});

suite('0xF2 LD A,(C)');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xF2],
        { [Register.C]: 0x90 },
        {},
        { 0xFF90: 0x12 }
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        8,
        { [Register.A]: 0x12 },
        {},
        {},
    );
});

suite('0xF3 DI');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xF3],
        {},
        { [Flag.IME]: 1 },
        {}
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        {},
        { [Flag.IME]: 1 },
        {},
    );
});

suite('0xF8 LD HL,SP+r8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xF8, 0x10],
        { [Register.SP]: 0xC010 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        12,
        { [Register.H]: 0xC0, [Register.L]: 0x20 },
        {},
        {},
    );
});
test('Subtract', function() {
    var [cpu, snapshot] = setupTest(
        [0xF8, 0xf0],
        { [Register.SP]: 0xC020 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        12,
        { [Register.H]: 0xC0, [Register.L]: 0x10 },
        { [Flag.C]: C_true },
        {},
    );
});

suite('0xF9 SP,HL');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xF9],
        { [Register.H]: 0xC0, [Register.L]: 0x10 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        8,
        { [Register.SP]: 0xC010 },
        {},
        {},
    );
});

suite('0xFA LD A,(a16)');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xFA, 0xC0, 0x10],
        {},
        {},
        { 0xC010: 0x12 },
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 3,
        16,
        { [Register.A]: 0x12 },
        {},
        {},
    );
});
suite('0xFB EI');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xFB, 0x00],
        {},
        { [Flag.IME]: 0},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        {},
        { [Flag.IME]: 0 },
        {},
    );

    assertEqual(true, cpu.enable_ime, "enable_ime");

    snapshot = cpu.snapshot();
    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        {},
        { [Flag.IME]: 1 },
        {},
    );

    assertEqual(false, cpu.enable_ime, "enable_ime");
});