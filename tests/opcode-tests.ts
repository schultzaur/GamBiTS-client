import { CPU, Flag, Register, Z_true, N_true, H_true, C_true, Flags } from './../src/modules/cpu.js';
import { assertEqual, assertState, setupTest } from './test-helpers.js';

// NOP test also servers as template for other tests.
suite('0x00 NOP');
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

suite('0x01 LD BC,d16');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x01, 0x10, 0xC0],
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
        { [Flag.Z]: false, [Flag.N]: true, [Flag.H]: false, },
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
        { [Flag.C]: true },
        {},
    );
});

suite('0x08 LD (a16),SP');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x08, 0x10, 0xC0],
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
        { [Flag.N]: false, [Flag.H]: true, [Flag.C]: false },
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
        { [Flag.Z]: false, [Flag.N]: true, [Flag.H]: false, },
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
        { [Flag.C]: true },
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
        { [Flag.C]: true },
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x85 },
        { [Flag.C]: true },
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
        { [Flag.C]: true },
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0xE1 },
        { [Flag.C]: false },
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
        { [Flag.Z]: false, [Flag.H]: false, [Flag.C]: true },
        {},
    )
});

suite('0x28 JR NZ,r8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x28, 0x10],
        {},
        { [Flag.Z]: true },
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
        { [Flag.H]: true, [Flag.N]: true },
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
        { [Flag.N]: false, [Flag.H]: false, [Flag.C]: true },
        {},
    )
});

suite('0x38 JR NZ,r8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x38, 0x10],
        {},
        { [Flag.C]: true },
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
        { [Flag.C]: true },
        {},
    );

    cpu.step();

    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        {},
        { [Flag.N]: false, [Flag.H]: false, [Flag.C]: false },
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
        { [Flag.Z]: false, [Flag.N]: false, [Flag.H]: true, [Flag.C]: true },
        {},
    )
});

suite('0x88 ADC A,B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x88],
        { [Register.A]: 0x3A, [Register.B]: 0xC7 },
        { [Flag.C]: true },
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x02 },
        { [Flag.Z]: false, [Flag.N]: false, [Flag.H]: true, [Flag.C]: true },
        {},
    )
});

suite('0x90 SUB B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x90],
        { [Register.A]: 0x3E, [Register.B]: 0x0F },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x2F },
        { [Flag.Z]: false, [Flag.N]: true, [Flag.H]: true, [Flag.C]: false },
        {},
    )
});

suite('0x98 SBC A,B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0x98],
        { [Register.A]: 0x3B, [Register.B]: 0x4F },
        { [Flag.C]: true },
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0xEB },
        { [Flag.Z]: false, [Flag.N]: true, [Flag.H]: true, [Flag.C]: true },
        {},
    )
});

suite('0xA0 AND B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xA0],
        { [Register.A]: 0x5A, [Register.B]: 0x3F },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x1A },
        { [Flag.Z]: false, [Flag.N]: false, [Flag.H]: true, [Flag.C]: false },
        {},
    )
});

suite('0xA8 XOR B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xA8],
        { [Register.A]: 0xFF, [Register.B]: 0x0F },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0xF0 },
        { [Flag.Z]: false, [Flag.N]: false, [Flag.H]: false, [Flag.C]: false },
        {},
    )
});

suite('0xB0 OR B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xB0],
        { [Register.A]: 0x5A, [Register.B]: 0x03 },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { [Register.A]: 0x5B },
        { [Flag.Z]: false, [Flag.N]: false, [Flag.H]: false, [Flag.C]: false },
        {},
    )
});

suite('0xB8 CP B');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xB8],
        { [Register.A]: 0x3C, [Register.B]: 0x2F },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        { },
        { [Flag.Z]: false, [Flag.N]: true, [Flag.H]: true, [Flag.C]: false },
        {},
    )
});

suite('0xC0 RET NZ');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xC0],
        { [Register.SP]: 0xFFFC, },
        { [Flag.Z]: false },
        { 0xFFFC: 0x5F, 0xFFFD: 0x3C },
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        0x3C5F,
        20,
        { [Register.SP]: 0xFFFE, },
        {},
        {},
    )
});

suite('0xC1 POP BC');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xC1],
        { [Register.SP]: 0xFFFC, },
        {},
        { 0xFFFC: 0x5F, 0xFFFD: 0x3C },
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        12,
        { [Register.SP]: 0xFFFE, [Register.B]: 0x3C, [Register.C]: 0x5F },
        {},
        {},
    )
});

suite('0xC2 JP NZ,a16');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xC2, 0x34, 0x12],
        {},
        { [Flag.Z]: false },
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        0x1234,
        16,
        {},
        {},
        {},
    )
});

suite('0xC3 JP a16');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xC3, 0x34, 0x12],
        {},
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        0x1234,
        16,
        {},
        {},
        {},
    )
});

suite('0xC4 CALL NZ,a16');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xC4, 0x34, 0x12],
        { [Register.SP]: 0xFFFE },
        { [Flag.Z]: false },
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        0x1234,
        24,
        { [Register.SP]: 0xFFFC, },
        {},
        { 0xFFFC: 0x03, 0xFFFD: 0x01 },
    )
});

suite('0xC5 PUSH BC');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xC5],
        { [Register.SP]: 0xFFFE, [Register.B]: 0x3C, [Register.C]: 0x5F },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        16,
        { [Register.SP]: 0xFFFC },
        {},
        { 0xFFFC: 0x5F, 0xFFFD: 0x3C },
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
        { [Flag.Z]: false, [Flag.N]: false, [Flag.H]: true, [Flag.C]: true },
        {},
    )
});

suite('0xC7 RST 00H');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xC7],
        { [Register.SP]: 0xFFFE },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        0x00,
        16,
        { [Register.SP]: 0xFFFC, },
        {},
        { 0xFFFC: 0x01, 0xFFFD: 0x01 },
    )
});

suite('0xC8 RET Z');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xC8],
        { [Register.SP]: 0xFFFC, },
        { [Flag.Z]: false },
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
        {},
    )
});

suite('0xC9 RET');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xC9],
        { [Register.SP]: 0xFFFC, },
        {},
        { 0xFFFC: 0x5F, 0xFFFD: 0x3C },
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        0x3C5F,
        16,
        { [Register.SP]: 0xFFFE, },
        {},
        {},
    )
});

suite('0xCA JP Z,a16');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCA, 0x12, 0x34],
        {},
        { [Flag.Z]: false },
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 3,
        12,
        {},
        {},
        {},
    )
});

suite('0xCC CALL Z,a16');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCC, 0x12, 0x34],
        { [Register.SP]: 0xFFFE },
        { [Flag.Z]: false },
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 3,
        12,
        {},
        {},
        {},
    )
});

suite('0xCD CALL a16');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCD, 0x34, 0x12],
        { [Register.SP]: 0xFFFE },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        0x1234,
        24,
        { [Register.SP]: 0xFFFC, },
        {},
        { 0xFFFC: 0x03, 0xFFFD: 0x01 },
    )
});

suite('0xCE ADC A,d8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCE, 0xC7],
        { [Register.A]: 0x3A, },
        { [Flag.C]: true },
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.A]: 0x02 },
        { [Flag.Z]: false, [Flag.N]: false, [Flag.H]: true, [Flag.C]: true },
        {},
    )
});

suite('0xCF RST 08H');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xCF],
        { [Register.PC]: 0x101, [Register.SP]: 0xFFFE },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        0x08,
        16,
        { [Register.SP]: 0xFFFC, },
        {},
        { 0xFFFC: 0x02, 0xFFFD: 0x01 },
    )
});
suite('0xD6 SUB d8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xD6, 0x0F],
        { [Register.A]: 0x3E, },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.A]: 0x2F },
        { [Flag.Z]: false, [Flag.N]: true, [Flag.H]: true, [Flag.C]: false },
        {},
    )
});

suite('0xDE SBC A,d8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xDE, 0x4F],
        { [Register.A]: 0x3B },
        { [Flag.C]: true },
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.A]: 0xEB },
        { [Flag.Z]: false, [Flag.N]: true, [Flag.H]: true, [Flag.C]: true },
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

suite('0xE6 AND d8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xE6, 0x3F],
        { [Register.A]: 0x5A, },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.A]: 0x1A },
        { [Flag.Z]: false, [Flag.N]: false, [Flag.H]: true, [Flag.C]: false },
        {},
    )
});

suite('0xE8 ADD SP,r8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xE8, 0x10],
        { [Register.SP]: 0xC010 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        16,
        { [Register.SP]: 0xC020 },
        {},
        {},
    );
});
test('Subtract', function() {
    var [cpu, snapshot] = setupTest(
        [0xE8, 0xF0],
        { [Register.SP]: 0xC020 },
        {},
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        16,
        { [Register.SP]: 0xC010 },
        { [Flag.C]: true },
        {},
    );
});

suite('0xE9 JP (HL)');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xE9],
        { [Register.H]: 0x12, [Register.L]: 0x34 },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        0x1234,
        4,
        {},
        {},
        {},
    )
});

suite('0xEA LD (a16),A');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xEA, 0x10, 0xC0],
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

suite('0xEE XOR d8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xEE, 0x0F],
        { [Register.A]: 0xFF, },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.A]: 0xF0 },
        { [Flag.Z]: false, [Flag.N]: false, [Flag.H]: false, [Flag.C]: false },
        {},
    )
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
        { [Flag.IME]: true },
        {}
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        {},
        { [Flag.IME]: false },
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
        { [Flag.C]: true },
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
        [0xFA, 0x10, 0xC0],
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

suite('0xF6 OR d8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xF6, 0x03],
        { [Register.A]: 0x5A, },
        {},
        {},
    );
    
    cpu.step();
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 2,
        8,
        { [Register.A]: 0x5B },
        { [Flag.Z]: false, [Flag.N]: false, [Flag.H]: false, [Flag.C]: false },
        {},
    )
});

suite('0xFB EI');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xFB, 0x00],
        {},
        { [Flag.IME]: false },
        {},
    );

    cpu.step();
    
    assertState(
        cpu,
        snapshot,
        snapshot.registers.PC + 1,
        4,
        {},
        { [Flag.IME]: false },
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
        { [Flag.IME]: true },
        {},
    );

    assertEqual(false, cpu.enable_ime, "enable_ime");
});

suite('0xFE CP d8');
test('Basic', function() {
    var [cpu, snapshot] = setupTest(
        [0xFE,  0x2F],
        { [Register.A]: 0x3C, },
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
        { [Flag.Z]: false, [Flag.N]: true, [Flag.H]: true, [Flag.C]: false },
        {},
    )
});