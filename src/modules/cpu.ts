// Define: registers, clock, etc.
import Memory from './memory.js';

export const enum Register {
    A = "A", F = "F",
    B = "B", C = "C",
    D = "D", E = "E",
    H = "H", L = "L",
    PC = "PC",
    SP = "SP"
}

export const Registers: Register[] = [
    Register.A, Register.F,
    Register.B, Register.C,
    Register.D, Register.E,
    Register.H, Register.L,
    Register.PC,
    Register.SP,
]

// 7 6 5 4 3 2 1 0
// Z N H C 0 0 0 0
export const Z_true: number = 0x80;
export const N_true: number = 0x40;
export const H_true: number = 0x20;
export const C_true: number = 0x10;
export const F_mask: number = Z_true | N_true | H_true | C_true;

export const enum Flag {
    Z = "Z", // Zero
    N = "N", // Subtract
    H = "H", // Half-carry
    C = "C", // Carry
    IME = "IME", // Interupt Master Enable
}

export const Flags: Flag[] = [
    Flag.Z,
    Flag.N,
    Flag.H,
    Flag.C,
    Flag.IME,
]

const flag_mask = {
    [Flag.Z]: Z_true,
    [Flag.N]: H_true,
    [Flag.H]: N_true,
    [Flag.C]: C_true,
}

type Target = Register | "(HL)";
const byte_to_target: Target[] = [
    Register.B,
    Register.C,
    Register.D,
    Register.E,
    Register.H,
    Register.L, 
    "(HL)",
    Register.A
];

export class CPU {
    memory: Memory;
    registers: { -readonly [key in keyof typeof Register]: number }
    timer: number;
    ime: boolean;
    halted: boolean;
    stopped: boolean;

    enable_ime: boolean;
    constructor()
    {
        this.memory = new Memory();

        this.registers = {} as any;
        this.timer = 0;
        this.enable_ime = false;
        this.ime = false;
        this.halted = false;
        this.stopped = false;

        for (var register of Registers) {
            this.registers[register] = 0;
        }
    }

    snapshot(): CPU
    {
        let cpu = new CPU();

        for (var register of Registers) {
            cpu.registers[register] = this.registers[register];
        }

        cpu.timer = this.timer;
        cpu.ime = this.ime;
        cpu.enable_ime = this.enable_ime;
        cpu.halted = this.halted;
        cpu.stopped = this.stopped;

        // TODO: Memory/etc?

        return cpu;
    }

    step: () => void = () => {
        if (this.stopped) {
            return;
        }

        if (this.halted) {
            this.timer += 4;
            // todo: handle interrupts
            return;
        }
        
        let opcode: number = this.read_inc_pc();

        if (this.enable_ime) {
            // TODO: figure out how tf EI/DI/etc work. Possible different for CGB.
            this.ime = true;
            this.enable_ime = false;
        }

        this.opcode_map[opcode](opcode);
    }

    inc_8 = (register: Register) => {
        return this.registers[register] = (this.registers[register] + 1) & 0xFF;
    }

    dec_8 = (register: Register) => {
        return this.registers[register] = (this.registers[register] - 1) & 0xFF;
    }

    inc_16 = (register: Register) => {
        return this.registers[register] = (this.registers[register] + 1) & 0xFFFF;
    }

    dec_16 = (register: Register) => {
        return this.registers[register] = (this.registers[register] - 1) & 0xFFFF;
    }

    read_inc_pc = () => {
        let value = this.memory.read(this.registers.PC);
        this.inc_16(Register.PC);
        this.timer += 4;
        return value;
    }

    push_sp = (value: number) => {
        this.dec_16(Register.SP);
        this.memory.write(this.registers.SP, value);
        this.timer += 4;
    }

    pop_sp = () => {
        let value = this.memory.read(this.registers.SP);
        this.inc_16(Register.SP);
        this.timer += 4;
        return value;
    }

    inc_wrap = (registerH: Register, registerL: Register) => {
        if (this.inc_8(registerL) === 0) {
            this.inc_8(registerH);
        }
    }

    dec_wrap = (registerH: Register, registerL: Register) => {
        if (this.dec_8(registerL) === 0xFF) { 
            this.dec_8(registerH)
        }
    }
    
    get_flag = (flag: Flag): boolean => {
        if (flag == Flag.IME) {
            return this.ime;
        } else {
            return (this.registers.F & flag_mask[flag]) == flag_mask[flag]
        }
    }
    
    set_flag = (flag: Flag, value: boolean) => {
        if (flag == Flag.IME) {
            this.ime = value;
        } else {
            if (value) {
                this.registers.F |= flag_mask[flag];
            } else {
                this.registers.F &= (0xFF ^ flag_mask[flag]);
            }
        }
    }

    set_flag_z = (a: number) => {
        this.set_flag(Flag.Z, a == 0);
    }

    calc_flag = (mask: number, a: number, b: number, c?: boolean) => {
        return (a & mask) + (b & mask) + (c ? 1 : 0) > mask;
    }
    
    set_flag_h_8 = (a: number, b: number, c?: boolean) => {
        this.set_flag(Flag.H, this.calc_flag(0xF, a, b, c));
    }

    set_flag_c_8 = (a: number, b: number, c?: boolean) => {
        this.set_flag(Flag.C, this.calc_flag(0xFF, a, b, c));
    }

    set_flag_h_16 = (a: number, b: number, c?: boolean) => {
        // ((a ^ b ^ sum) & 0x10) >> 4
        this.set_flag(Flag.H, this.calc_flag(0xFFF, a, b, c));
    }

    set_flag_c_16 = (a: number, b: number, c?: boolean) => {
        this.set_flag(Flag.C, this.calc_flag(0xFFFF, a, b, c));
    }

    read_target = (target: Target) => {
        let value: number;

        if (target == "(HL)") {
            value = this.memory.read((this.registers[Register.H] << 8) + this.registers[Register.L]);
            this.timer += 4;
        } else {
            value = this.registers[target];
        }         

        return value;           
    }

    write_target = (target: Target, value: number) => {
        if (target == "(HL)") {
            this.memory.write((this.registers[Register.H] << 8) + this.registers[Register.L], value);
            this.timer += 4;
        } else if (target == Register.F) {
            this.registers[target] = value & F_mask;
        } else {
            this.registers[target] = value;
        }                    
    }

    /* gb cpu manual - by DP */
    CB = (opcode: number) => {
        let extended_opcode: number = this.read_inc_pc();
        this.cb_map[extended_opcode >> 3](extended_opcode);
    }

    IDK = (opcode: number) => {
        // TODO - implement invalid instructions. Just halt?
    }

    NOP = (opcode: number) => { }
    
    HALT = (opcode: number) => {
        if (!this.ime && (this.memory.IE & this.memory.IF) > 0) {
            // weird halt bug... don't increment PC.
            let opcode = this.memory.read(this.registers.PC);
            this.timer += 4; 
            this.opcode_map[opcode](opcode);
        } else {
            this.halted = true;
        }
    }

    STOP = (opcode: number) => {
        this.stopped = true;
    }

    DI = (opcode: number) => {
        this.ime = false;
    }

    EI = (opcode: number) => {
        this.enable_ime = true;
    }

    LD = (opcode: number) => {
        let row: number = opcode & 0xF0;
        let col: number = opcode & 0x0F;

        let high: number = 0;
        let low: number = 0;
        if (opcode < 0x40) {
            switch(col) {
                case 0x1: // LD xx,d16
                    high = this.read_inc_pc();
                    low = this.read_inc_pc();

                    switch(row) {
                        case 0x0: 
                            this.registers.B = high;
                            this.registers.C = low;
                            break;
                        case 0x1:
                            this.registers.D = high;
                            this.registers.E = low;
                            break;
                        case 0x2:
                            this.registers.H = high;
                            this.registers.L = low;
                            break;
                        case 0x3:                  
                            this.registers.SP = ((high << 8) + low);
                            break;
                    }
                    break;
                case 0x2: // LD (xx),A
                    switch(row) {
                        case 0x0: 
                            high = this.registers.B;
                            low =  this.registers.C;
                            break;
                        case 0x1:
                            high = this.registers.D;
                            low = this.registers.E;
                            break;
                        case 0x2:
                        case 0x3:
                            high = this.registers.H;
                            low = this.registers.L;
                            break;
                    }

                    this.memory.write((high << 8) + low, this.registers.A);
                    this.timer += 4;

                    if (opcode == 0x22) {
                        this.inc_wrap(Register.H, Register.L);
                    } else if (opcode == 0x23) {
                        this.dec_wrap(Register.H, Register.L);
                    }
                    break;
                case 0x6:
                case 0xE: // LD x,d8
                    let value = this.read_inc_pc();

                    let target: Target = byte_to_target[opcode >> 3];

                    if (target == "(HL)") {
                        this.memory.write((this.registers[Register.H] << 8) + this.registers[Register.L], value);
                        this.timer += 4;
                    } else {
                        this.registers[target] = value;
                    }                    
                    break;
                case 0x8: // LD (a16),SP
                    high = this.read_inc_pc();
                    low = this.read_inc_pc();
                    let addr = (high << 8) + low;
                    
                    this.memory.write(addr++, this.registers.SP & 0xFF);
                    this.timer += 4;
                    this.memory.write(addr++, this.registers.SP >> 8);
                    this.timer += 4;
                    break;
                case 0xA: // LD A,(xx)
                    switch(row) {
                        case 0x0:
                            high = this.registers.B;
                            low =  this.registers.C;
                            break;
                        case 0x1:
                            high = this.registers.D;
                            low = this.registers.E;
                            break;
                        case 0x2:
                        case 0x3:
                            high = this.registers.H;
                            low = this.registers.L;
                            break;
                    }

                    this.registers.A = this.memory.read((high << 8) + low);
                    this.timer += 4;

                    if (opcode == 0xA2) {
                        this.inc_wrap(Register.H, Register.L);
                    } else if (opcode == 0xA3) {
                        this.dec_wrap(Register.H, Register.L);
                    }
                    break;
            }
        } else if (opcode < 0x80) {
            let source: Target = byte_to_target[opcode & 0x7];
            let target: Target = byte_to_target[(opcode - 0x40) >> 3];

            let value: number;
            
            if (source == "(HL)") {
                value = this.memory.read((this.registers[Register.H] << 8) + this.registers[Register.L])
                this.timer += 4;
            } else {
                value = this.registers[source];
            }

            if (target == "(HL)") {
                this.memory.write((this.registers[Register.H] << 8) + this.registers[Register.L], value);
                this.timer += 4;
            } else {
                this.registers[target] = value;
            }
        } else if (opcode == 0xF8) {
            let value = this.read_inc_pc();

            let signed = (value & 0x7F) - (value & 0x80);
            
            this.set_flag(Flag.Z, false);
            this.set_flag(Flag.N, false);
            this.set_flag_h_8(this.registers.SP, signed);
            this.set_flag_c_8(this.registers.SP, signed);

            let addr = this.registers.SP + signed;
            this.registers.H = (addr >> 8) & 0xFF;
            this.registers.L = addr & 0xFF;

            // extra internal delay
            // see: (https://github.com/Gekkio/mooneye-gb/blob/9e4ba5e40ca0513edb04d8c9f2b1ca03620ac40b/docs/accuracy.markdown)
            this.timer += 4;
        } else if (opcode == 0xF9) {
            this.registers.SP = ((this.registers.H << 8) + this.registers.L) & 0xFFFF;

            // extra internal delay?
            this.timer += 4;
        } else {
            if (col == 0x0 || col == 0x2) {
                high = 0xFF;
            } else if (col = 0xA) {
                high = this.read_inc_pc();
            }

            if (col == 0x0 || col == 0xA) {
                low = this.read_inc_pc();
            } else if (col == 0x02) {
                low = this.registers.C;
            }

            if (row == 0xE0) {
                this.memory.write((high << 8) + low, this.registers.A)
                this.timer += 4;
            } else {
                this.registers.A = this.memory.read((high << 8) + low)
                this.timer += 4;
            }
        }
    }

    ADD = (opcode: number) => {
        if (opcode < 0x40) {
            let hl = (this.registers.H << 8) + this.registers.L;

            let value;
            switch(opcode) {
                case 0x09:
                    value = (this.registers.B << 8) + this.registers.C;
                    break;
                case 0x19:
                    value = (this.registers.D << 8) + this.registers.E;
                    break;
                case 0x29:
                    value = (this.registers.H << 8) + this.registers.L;
                    break;
                case 0x39:
                    value = this.registers.SP;
                    break;
            }

            this.set_flag(Flag.N, false);
            this.set_flag_h_16(hl, value);
            this.set_flag_c_16(hl, value);

            hl = (hl + value) & 0xFFFF;

            this.registers.H = hl >> 8;
            this.registers.L = hl & 0xFF;
            this.timer += 4;
        } else if (opcode < 0xD0) {
            let carry = ((opcode & 0xF) >= 0x8) && this.get_flag(Flag.C);
            let value;

            if (opcode < 0x90) {
                let target: Target = byte_to_target[(opcode - 0x80) % 8];
                value = this.read_target(target);
            } else {
                value = this.read_inc_pc();
            }
            
            this.set_flag(Flag.N, false);
            this.set_flag_h_8(this.registers.A, value, carry);
            this.set_flag_c_8(this.registers.A, value, carry);

            this.registers.A = (this.registers.A + value + (carry ? 1 : 0)) & 0xFF;

            this.set_flag_z(this.registers.A);
        } else {
            let value = this.read_inc_pc();

            let signed = (value & 0x7F) - (value & 0x80);
            
            this.set_flag(Flag.Z, false);
            this.set_flag(Flag.N, false);
            this.set_flag_h_8(this.registers.SP, signed);
            this.set_flag_c_8(this.registers.SP, signed);

            this.registers.SP = this.registers.SP + signed;

            // extra internal delay
            // see: (https://github.com/Gekkio/mooneye-gb/blob/9e4ba5e40ca0513edb04d8c9f2b1ca03620ac40b/docs/accuracy.markdown)
            this.timer += 4;
            this.timer += 4;
        }
    }

    SUB = (opcode: number) => {
        let carry = (opcode & 0xF) >= 0x8 && this.get_flag(Flag.C) ? 1 : 0;
        let value;

        if (opcode < 0xA0) {
            let target: Target = byte_to_target[(opcode - 0x80) % 8];
            value = this.read_target(target);
        } else {
            value = this.read_inc_pc();
        }
        
        this.set_flag(Flag.N, true);
        this.set_flag(Flag.H, ((value & 0xF) + carry) > (this.registers.A & 0xF));
        this.set_flag(Flag.C, (value + carry) > this.registers.A);

        this.registers.A = (this.registers.A - value - carry) & 0xFF;

        this.set_flag_z(this.registers.A);
    }

    AND = (opcode: number) => {
        let value: number;

        if (opcode < 0xB0) {
            let target: Target = byte_to_target[opcode - 0xA0];
            value = this.read_target(target);
        } else {
            value = this.read_inc_pc();
        }
        
        this.registers.A &= value;

        this.set_flag_z(this.registers.A);
        this.set_flag(Flag.N, false);
        this.set_flag(Flag.H, true);
        this.set_flag(Flag.C, false);
    }
    
    XOR = (opcode: number) => {
        let value: number;

        if (opcode < 0xB0) {
            let target: Target = byte_to_target[opcode - 0xA8];
            value = this.read_target(target);
        } else {
            value = this.read_inc_pc();
        }
        
        this.registers.A ^= value;

        this.set_flag_z(this.registers.A);
        this.set_flag(Flag.N, false);
        this.set_flag(Flag.H, false);
        this.set_flag(Flag.C, false);
    }
    
    OR = (opcode: number) => {
        let value: number;

        if (opcode < 0xC0) {
            let target: Target = byte_to_target[opcode - 0xB0];
            value = this.read_target(target);
        } else {
            value = this.read_inc_pc();
        }
        
        this.registers.A |= value;

        this.set_flag_z(this.registers.A);
        this.set_flag(Flag.N, false);
        this.set_flag(Flag.H, false);
        this.set_flag(Flag.C, false);
    }

    CP = (opcode: number) => {
        let value: number;

        if (opcode < 0xC0) {
            let target: Target = byte_to_target[opcode - 0xB8];
            value = this.read_target(target);
        } else {
            value = this.read_inc_pc();
        }
        
        this.set_flag_z(this.registers.A - value);
        this.set_flag(Flag.N, true);
        this.set_flag(Flag.H, (value & 0xF) > (this.registers.A & 0xF));
        this.set_flag(Flag.C, value > this.registers.A);
    }

    INC = (opcode: number) => {
        let col = opcode & 0xF;

        if (col == 0x3) {
            switch(opcode)
            {
                case 0x03:
                    this.inc_wrap(Register.B, Register.C);
                    break;
                case 0x13:
                    this.inc_wrap(Register.D, Register.E);
                    break;
                case 0x23:
                    this.inc_wrap(Register.H, Register.L);
                    break;
                case 0x33:
                    this.inc_16(Register.SP);
                    break;
            }
            this.timer += 4;
        } else {
            let target: Target = byte_to_target[opcode >> 3];

            let value;
            if (target == "(HL)") {
                let addr = (this.registers[Register.H] << 8) + this.registers[Register.L];
                let value = this.memory.read(addr);
                this.timer += 4;

                this.set_flag_h_8(value, 1);
                value = (value + 1) & 0xFF;
                this.set_flag_z(value);
                
                this.memory.write(addr, value);
                this.timer += 4;
            } else {
                this.set_flag_h_8(this.registers[target], 1);
                this.inc_8(target)
                this.set_flag_z(this.registers[target]);
            }

            this.set_flag(Flag.N, false);
        }
    }

    DEC = (opcode: number) => {
        let col = opcode & 0xF;

        if (col == 0xB) {
            switch(opcode)
            {
                case 0x0B:
                    this.dec_wrap(Register.B, Register.C);
                    break;
                case 0x1B:
                    this.dec_wrap(Register.D, Register.E);
                    break;
                case 0x2B:
                    this.dec_wrap(Register.H, Register.L);
                    break;
                case 0x3B:
                    this.dec_16(Register.SP);
                    break;
            }
            this.timer += 4;
        } else {
            let target: Target = byte_to_target[opcode >> 3];

            let value;
            if (target == "(HL)") {
                let addr = (this.registers[Register.H] << 8) + this.registers[Register.L];
                let value = this.memory.read(addr);
                this.timer += 4;

                this.set_flag_h_8(value, -1);
                value = (value - 1) & 0xFF;
                this.set_flag_z(value);
                
                this.memory.write(addr, value);
                this.timer += 4;
            } else {
                this.set_flag_h_8(this.registers[target], -1);
                this.dec_8(target)
                this.set_flag_z(this.registers[target]);
            }

            this.set_flag(Flag.N, true);
        }
    }

    SWAP = (opcode: number) => {}

    DAA = (opcode: number) => {
        if (!this.get_flag(Flag.N)){
            if (this.registers.A > 0x99 || this.get_flag(Flag.C)) {
                this.registers.A = (this.registers.A + 0x60) & 0xFF;
                this.set_flag(Flag.C, true);
            }
            if ((this.registers.A & 0xF) > 0x9 || this.get_flag(Flag.H)) {
                this.registers.A = (this.registers.A + 0x6) & 0xFF;
            }
        } else {
            if (this.get_flag(Flag.C)) {
                this.registers.A = (this.registers.A - 0x60) & 0xFF;
            }
            if (this.get_flag(Flag.H)) {
                this.registers.A = (this.registers.A - 0x6) & 0xFF;
            }
        }

        this.set_flag_z(this.registers.A);
        this.set_flag(Flag.H, false);
    }

    CPL = (opcode: number) => {
        this.registers[Register.A] ^= 0xFF;
        this.set_flag(Flag.N, true);
        this.set_flag(Flag.H, true);
    }

    CCF = (opcode: number) => {
        this.set_flag(Flag.N, false);
        this.set_flag(Flag.H, false);
        this.set_flag(Flag.C, !this.get_flag(Flag.C));
    }

    SCF = (opcode: number) => {
        this.set_flag(Flag.N, false);
        this.set_flag(Flag.H, false);
        this.set_flag(Flag.C, true);
    }

    RLCA = (opcode: number) => {
        let c = this.registers.A >> 7;
        this.registers.A = ((this.registers.A & 0x7F) << 1) + c;

        this.set_flag(Flag.Z, false);
        this.set_flag(Flag.N, false);
        this.set_flag(Flag.H, false);
        this.set_flag(Flag.C, c == 1);
    }

    RLA = (opcode: number) => {
        let c_old = this.get_flag(Flag.C) ? 1 : 0;
        let c_new = this.registers.A >> 7;
        this.registers.A = ((this.registers.A & 0x7F) << 1) + c_old;

        this.set_flag(Flag.Z, false);
        this.set_flag(Flag.N, false);
        this.set_flag(Flag.H, false);
        this.set_flag(Flag.C, c_new == 1);
    }

    RRCA = (opcode: number) => {
        let c = this.registers.A & 0x01;
        this.registers.A = ((this.registers.A & 0xFE) >> 1) + (c << 7);

        this.set_flag(Flag.Z, false);
        this.set_flag(Flag.N, false);
        this.set_flag(Flag.H, false);
        this.set_flag(Flag.C, c == 1);
    }

    RRA = (opcode: number) => {
        let c_old = this.get_flag(Flag.C) ? 1 : 0;
        let c_new = this.registers.A & 0x01;
        this.registers.A = ((this.registers.A & 0xFE) >> 1) + (c_old << 7);

        this.set_flag(Flag.Z, false);
        this.set_flag(Flag.N, false);
        this.set_flag(Flag.H, false);
        this.set_flag(Flag.C, c_new == 1);
    }

    RL = (extended_opcode: number) => {}
    RLC = (extended_opcode: number) => {}
    RR = (extended_opcode: number) => {}
    RRC = (extended_opcode: number) => {}
    SLA = (extended_opcode: number) => {}
    SRA = (extended_opcode: number) => {}
    SRL = (extended_opcode: number) => {}

    BIT = (extended_opcode: number) => {
        let bit = (extended_opcode - 0x40) >>> 3;
        let bit_mask = 1 << bit;
        let target: Target  = byte_to_target[extended_opcode & 0xF];
        let value = this.read_target(target)

        this.set_flag_z(value & bit_mask);
        this.set_flag(Flag.N, false);
        this.set_flag(Flag.H, true);
    }

    RES = (extended_opcode: number) => {
        let bit = (extended_opcode - 0x80) >>> 3;
        let bit_mask = 0xFF ^ (1 << bit);
        let target: Target  = byte_to_target[extended_opcode & 0xF];

        let value = this.read_target(target)
        value = value & bit_mask;
        this.write_target(target, value);
    }

    SET = (extended_opcode: number) => {
        let bit = (extended_opcode - 0xC0) >>> 3;
        let bit_mask = 1 << bit;
        let target: Target  = byte_to_target[extended_opcode & 0xF];
        
        let value = this.read_target(target)
        value = value | bit_mask;
        this.write_target(target, value);
    }

    JP = (opcode: number) => {
        let jump: boolean = false;

        switch(opcode) {
            case 0xC2:
                jump = !this.get_flag(Flag.Z);
                break;
            case 0xC3:
                jump = true;
                break;
            case 0xCA:
                jump = this.get_flag(Flag.Z);
                break;
            case 0xD2:
                jump = !this.get_flag(Flag.C);
                break;
            case 0xDA:
                jump = this.get_flag(Flag.C);
                break;                
            case 0xE9:
                jump = true;
                break;                
        }
        

        let addr_high: number;
        let addr_low: number;

        if (opcode == 0xE9) {
            addr_high = this.registers.H;
            addr_low = this.registers.L;
        } else {
            addr_high = this.read_inc_pc();
            addr_low = this.read_inc_pc();
        }


        if (jump) {
            if (opcode != 0xE9) {
                // extra internal delay?
                this.timer += 4;
            }
            
            this.registers.PC = (addr_high << 8) + addr_low;
        }
    }

    JR = (opcode: number) => {
        let jump: boolean = false;

        let value = this.read_inc_pc();

        switch(opcode) {
            case 0x18:
                jump = true;
                break;
            case 0x20:
                jump = !this.get_flag(Flag.Z);
                break;
            case 0x28:
                jump = this.get_flag(Flag.Z);
                break;
            case 0x30:
                jump = !this.get_flag(Flag.C);
                break;
            case 0x38:
                jump = this.get_flag(Flag.C);
                break;                
        }

        if (jump) {
            let signed = (value & 0x7F) - (value & 0x80);

            this.registers.PC = (this.registers.PC + signed) & 0xFFFF;
            this.timer += 4;
        }
    }

    POP = (opcode: number) => {
        let registerH: Register;
        let registerL: Register;

        switch(opcode) {
            case 0xC1:
                registerH = Register.B;
                registerL = Register.C;
                break;
            case 0xD1:
                registerH = Register.D;
                registerL = Register.E;
                break;
            case 0xE1:
                registerH = Register.H;
                registerL = Register.L;
                break;
            case 0xF1:
                registerH = Register.A;
                registerL = Register.F;
                break;
        }

        this.write_target(registerL, this.pop_sp());
        this.write_target(registerH, this.pop_sp());
    }

    PUSH = (opcode: number) => {
        let registerH: Register;
        let registerL: Register;

        switch(opcode) {
            case 0xC5:
                registerH = Register.B;
                registerL = Register.C;
                break;
            case 0xD5:
                registerH = Register.D;
                registerL = Register.E;
                break;
            case 0xE5:
                registerH = Register.H;
                registerL = Register.L;
                break;
            case 0xF5:
                registerH = Register.A;
                registerL = Register.F;
                break;
        }

        // extra internal delay?
        this.timer += 4;

        this.push_sp(this.read_target(registerH));
        this.push_sp(this.read_target(registerL));
    }

    CALL = (opcode: number) => {
        let jump: boolean = false;

        let addr_high = this.read_inc_pc();
        let addr_low = this.read_inc_pc();

        switch(opcode) {
            case 0xC4:
                jump = !this.get_flag(Flag.Z);
                break;
            case 0xCC:
                jump = this.get_flag(Flag.Z);
                break;
            case 0xCD:
                jump = true;
                break;
            case 0xD4:
                jump = !this.get_flag(Flag.C);
                break;
            case 0xDC:
                jump = this.get_flag(Flag.C);
                break;                
        }

        if (jump) {
            // extra internal delay?
            this.timer += 4;

            this.push_sp(this.registers.PC >> 8);
            this.push_sp(this.registers.PC & 0xFF);
            
            this.registers.PC = (addr_high << 8) + addr_low;
        }

    }

    RST = (opcode: number) => {
        this.push_sp(this.registers.PC >> 8);
        this.push_sp(this.registers.PC & 0xFF);

        // extra internal delay?
        this.timer += 4;
        
        this.registers.PC = (opcode - 0xc7);
    }

    RET = (opcode: number) => {
        let jump: boolean = false;

        switch(opcode) {
            case 0xC0:
                this.timer += 4;
                jump = !this.get_flag(Flag.Z);
                break;
            case 0xC8:
                this.timer += 4;
                jump = this.get_flag(Flag.Z);
                break;
            case 0xC9:
                jump = true;
                break;
            case 0xD0:
                this.timer += 4;
                jump = !this.get_flag(Flag.C);
                break;
            case 0xD8:
                this.timer += 4;
                jump = this.get_flag(Flag.C);
                break;
            case 0xD9:
                this.set_flag(Flag.IME, true);
                jump = true;
                break;
        }
        
        // extra internal delay?

        if (jump) {
            let addr_low = this.pop_sp();
            let addr_high = this.pop_sp();
    
            // extra internal delay?
            this.timer += 4;
    
            this.registers.PC = (addr_high << 8) + addr_low;
        }
    }
    
    // resource: https://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html
    opcode_map = [
        this.NOP,  this.LD,   this.LD,   this.INC,  this.INC,  this.DEC,  this.LD,   this.RLCA, //0x00-0x07
        this.LD,   this.ADD,  this.LD,   this.DEC,  this.INC,  this.DEC,  this.LD,   this.RRCA, //0x08-0x0F
 
        this.STOP, this.LD,   this.LD,   this.INC,  this.INC,  this.DEC,  this.LD,   this.RLA,  //0x10-0x17
        this.JR,   this.ADD,  this.LD,   this.DEC,  this.INC,  this.DEC,  this.LD,   this.RRA,  //0x18-0x1F
 
        this.JR,   this.LD,   this.LD,   this.INC,  this.INC,  this.DEC,  this.LD,   this.DAA,  //0x20-0x27
        this.JR,   this.ADD,  this.LD,   this.DEC,  this.INC,  this.DEC,  this.LD,   this.CPL,  //0x28-0x2F
 
        this.JR,   this.LD,   this.LD,   this.INC,  this.INC,  this.DEC,  this.LD,   this.SCF,  //0x30-0x37
        this.JR,   this.ADD,  this.LD,   this.DEC,  this.INC,  this.DEC,  this.LD,   this.CCF,  //0x38-0x3F
 
        this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   //0x40-0x47
        this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   //0x48-0x4F
 
        this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   //0x50-0x57
        this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   //0x58-0x5F
 
        this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   //0x60-0x67
        this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   //0x68-0x6F

        this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.HALT, this.LD,   //0x70-0x77
        this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   this.LD,   //0x78-0x7F

        this.ADD,  this.ADD,  this.ADD,  this.ADD,  this.ADD,  this.ADD,  this.ADD,  this.ADD,   //0x80-0x87
        this.ADD,  this.ADD,  this.ADD,  this.ADD,  this.ADD,  this.ADD,  this.ADD,  this.ADD,   //0x88-0x8F
 
        this.SUB,  this.SUB,  this.SUB,  this.SUB,  this.SUB,  this.SUB,  this.SUB,  this.SUB,   //0x90-0x97
        this.SUB,  this.SUB,  this.SUB,  this.SUB,  this.SUB,  this.SUB,  this.SUB,  this.SUB,   //0x98-0x9F
 
        this.AND,  this.AND,  this.AND,  this.AND,  this.AND,  this.AND,  this.AND,  this.AND,   //0xA0-0xA7
        this.XOR,  this.XOR,  this.XOR,  this.XOR,  this.XOR,  this.XOR,  this.XOR,  this.XOR,   //0xA8-0xAF
 
        this.OR,   this.OR,   this.OR,   this.OR,   this.OR,   this.OR,   this.OR,   this.OR,    //0xB0-0xB7
        this.CP,   this.CP,   this.CP,   this.CP,   this.CP,   this.CP,   this.CP,   this.CP,    //0xB8-0xBF

        this.RET,  this.POP,  this.JP,  this.JP,    this.CALL, this.PUSH, this.ADD,  this.RST,   //0xC0-0xC7
        this.RET,  this.RET,  this.JP,  this.CB,    this.CALL, this.CALL, this.ADD,  this.RST,   //0xC8-0xCF

        this.RET,  this.POP,  this.JP,  this.IDK,   this.CALL, this.PUSH, this.SUB,  this.RST,   //0xD0-0xD7
        this.RET,  this.RET,  this.JP,  this.IDK,   this.CALL, this.IDK,  this.SUB,  this.RST,   //0xD8-0xDF

        this.LD,   this.POP,  this.LD,  this.IDK,   this.IDK,  this.PUSH, this.AND,  this.RST,   //0xE0-0xE7
        this.ADD,  this.JP,   this.LD,  this.IDK,   this.IDK,  this.IDK,  this.XOR,  this.RST,   //0xE8-0xEF

        this.LD,   this.POP,  this.LD,  this.DI,    this.IDK,  this.PUSH, this.OR,   this.RST,   //0xF0-0xF7
        this.LD,   this.LD,   this.LD,  this.EI,    this.IDK,  this.IDK,  this.CP,   this.RST,   //0xF8-0xFF
    ]

    cb_map = [
        this.RLC,  this.RRC,  //0x00-0x0F
        this.RL,   this.RR,  //0x10-0x1F
        this.SLA,  this.SRA, //0x20-0x2F
        this.SWAP, this.SRL, //0x30-0x3F
        this.BIT,  this.BIT, //0x40-0x4F
        this.BIT,  this.BIT, //0x50-0x5F
        this.BIT,  this.BIT, //0x60-0x6F
        this.BIT,  this.BIT, //0x70-0x7F
        this.RES,  this.RES, //0x80-0x8F
        this.RES,  this.RES, //0x90-0x9F
        this.RES,  this.RES, //0xA0-0xAF
        this.RES,  this.RES, //0xB0-0xBF
        this.SET,  this.SET, //0xC0-0xCF
        this.SET,  this.SET, //0xD0-0xDF
        this.SET,  this.SET, //0xE0-0xEF
        this.SET,  this.SET, //0xF0-0xFF
    ]
}