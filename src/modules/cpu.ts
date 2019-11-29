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

export const enum Flag {
    Z = "Z", // Zero
    N = "N", // Subtract
    H = "H", // Half-carry
    C = "C" // Carry
}

export const Flags: Flag[] = [
    Flag.Z,
    Flag.N,
    Flag.H,
    Flag.C,
]

const byte_to_reg: (Register | "(HL)")[] = [
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
    flags: { -readonly [key in keyof typeof Flag]: number }
    timer: number;

    constructor()
    {
        this.memory = new Memory();

        this.registers = {} as any
        this.flags = {} as any
        this.timer = 0;

        for (var register of Registers) {
            this.registers[register] = 0;
        }

        for (var flag of Flags) {
            this.flags[flag] = 0;
        }
    }

    snapshot(): CPU
    {
        let cpu = new CPU();

        for (var register of Registers) {
            cpu.registers[register] = this.registers[register];
        }

        for (var flag of Flags) {
            cpu.flags[flag] = this.flags[flag];
        }
        
        cpu.timer = this.timer;

        // TODO: Memory/etc?

        return cpu;
    }

    step: () => void = () => {
        let opcode: number = this.read_inc_pc();
        this.timer += 4;
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
    
    set_flag_z = (a: number) => {
        this.flags.Z = a == 0 ? Z_true : 0;
    }

    set_flag_h_8 = (a: number, b: number) => {
        // ((a ^ b ^ sum) & 0x10) >> 4
        this.flags.H = (a & 0xF) + (b & 0xF) > 0xF ? H_true : 0;
    }

    set_flag_c = (a: number, b: number) => {
        this.flags.C = (a & 0xFF) + (b & 0xFF) > 0xFF ? C_true : 0;
    }

    /* gb cpu manual - by DP */
    CB = (opcode: number) => {
        let extended_opcode: number = this.read_inc_pc();
        this.timer += 4;
        this.cb_map[extended_opcode].bind(this)(extended_opcode);
    }

    IDK = (opcode: number) => {
        // TODO - implement invalid instructions. Just halt?
    }

    NOP = (opcode: number) => { }
    
    HALT = (opcode: number) => {
        // TODO - implement HALT
    }
    STOP = (opcode: number) => {
        // TODO - implement HALT
    }
    DI = (opcode: number) => {
        // TODO - implement interrupts
    }
    EI = (opcode: number) => {
        // TODO - implement interrupts
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
                    this.timer += 4;
                    low = this.read_inc_pc();
                    this.timer += 4;

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
                    this.timer += 4;

                    let target: Register | "(HL)" = byte_to_reg[opcode >> 3];

                    if (target == "(HL)") {
                        this.memory.write((this.registers[Register.H] << 8) + this.registers[Register.L], value);
                        this.timer += 4;
                    } else {
                        this.registers[target] = value;
                    }                    
                    break;
                case 0x8: // LD (a16),SP
                    high = this.read_inc_pc();
                    this.timer += 4;
                    low = this.read_inc_pc();
                    this.timer += 4;
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
            let source: Register | "(HL)" = byte_to_reg[opcode & 0x7];
            let target: Register | "(HL)" = byte_to_reg[(opcode - 0x40) >> 3];

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
            this.timer += 4;

            let signed = (value & 0x7F) - (value & 0x80);
            
            this.flags.Z = 0;
            this.flags.N = 0;
            this.set_flag_h_8(this.registers.SP, signed);
            this.set_flag_c(this.registers.SP, signed);

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
                this.timer += 4;
            }

            if (col == 0x0 || col == 0xA) {
                low = this.read_inc_pc();
                this.timer += 4;
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

    PUSH = (opcode: number) => {}
    POP = (opcode: number) => {}

    ADD = (opcode: number) => {}
    ADC = (opcode: number) => {}
    SUB = (opcode: number) => {}
    SBC = (opcode: number) => {}

    AND = (opcode: number) => {}
    OR = (opcode: number) => {}
    XOR = (opcode: number) => {}
    CP = (opcode: number) => {}

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
            let target: Register | "(HL)" = byte_to_reg[opcode >> 3];

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

            this.flags.N = 0;
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
            let target: Register | "(HL)" = byte_to_reg[opcode >> 3];

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

            this.flags.N = N_true;
        }
    }

    SWAP = (opcode: number) => {}

    DAA = (opcode: number) => {
        // TODO test this once ADD/SUB are implemented
        if (this.flags.N == 0){
            if (this.registers.A > 0x99 || this.flags.C == C_true) {
                this.registers.A = (this.registers.A + 0x60) & 0xFF;
                this.flags.C = C_true;
            }
            if ((this.registers.A & 0xF) > 0x9 || this.flags.H == H_true) {
                this.registers.A = (this.registers.A + 0x6) & 0xFF;
            }
        } else {
            if (this.flags.C == C_true) {
                this.registers.A = (this.registers.A - 0x60) & 0xFF;
            }
            if (this.flags.H == H_true) {
                this.registers.A = (this.registers.A - 0x6) & 0xFF;
            }
        }

        this.set_flag_z(this.registers.A);
        this.flags.H = 0;
    }

    CPL = (opcode: number) => {
        this.registers[Register.A] ^= 0xFF;
        this.flags.H = H_true;
        this.flags.N = N_true;
    }

    CCF = (opcode: number) => {
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = C_true - this.flags.C;
    }

    SCF = (opcode: number) => {
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = C_true;
    }

    RLCA = (opcode: number) => {
        let c = (this.registers.A & 0x80) >> 7;
        this.registers.A = ((this.registers.A & 0x7F) << 1) + c;

        this.flags.Z = 0;
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = c == 1 ? C_true : 0;
    }

    RLA = (opcode: number) => {
        let c_old = this.flags.C == C_true ? 1 : 0;
        let c_new = (this.registers.A & 0x80) >> 7;
        this.registers.A = ((this.registers.A & 0x7F) << 1) + c_old;

        this.flags.Z = 0;
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = c_new == 1 ? C_true : 0;
    }

    RRCA = (opcode: number) => {
        let c = this.registers.A & 0x01;
        this.registers.A = ((this.registers.A & 0xFE) >> 1) + (c << 7);

        this.flags.Z = 0;
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = c == 1 ? C_true : 0;
    }

    RRA = (opcode: number) => {
        let c_old = this.flags.C == C_true ? 1 : 0;
        let c_new = this.registers.A & 0x01;
        this.registers.A = ((this.registers.A & 0xFE) >> 1) + (c_old << 7);

        this.flags.Z = 0;
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = c_new == 1 ? C_true : 0;
    }

    RL = (extended_opcode: number) => {}
    RLC = (extended_opcode: number) => {}
    RR = (extended_opcode: number) => {}
    RRC = (extended_opcode: number) => {}
    SLA = (extended_opcode: number) => {}
    SRA = (extended_opcode: number) => {}
    SRL = (extended_opcode: number) => {}

    BIT = (extended_opcode: number) => {}
    SET = (extended_opcode: number) => {}
    RES = (extended_opcode: number) => {}

    JP = (opcode: number) => {}
    JR = (opcode: number) => {}
    CALL = (opcode: number) => {}
    RST = (opcode: number) => {}
    RET = (opcode: number) => {}
    RETI = (opcode: number) => {}
    
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
        this.SBC,  this.SBC,  this.SBC,  this.SBC,  this.SBC,  this.SBC,  this.SBC,  this.SBC,   //0x98-0x9F
 
        this.AND,  this.AND,  this.AND,  this.AND,  this.AND,  this.AND,  this.AND,  this.AND,   //0xA0-0xA7
        this.XOR,  this.XOR,  this.XOR,  this.XOR,  this.XOR,  this.XOR,  this.XOR,  this.XOR,   //0xA8-0xAF
 
        this.OR,   this.OR,   this.OR,   this.OR,   this.OR,   this.OR,   this.OR,   this.OR,    //0xB0-0xB7
        this.CP,   this.CP,   this.CP,   this.CP,   this.CP,   this.CP,   this.CP,   this.CP,    //0xB8-0xBF

        this.RET,  this.POP,  this.JP,  this.JP,    this.CALL, this.PUSH, this.ADD,  this.RST,   //0xC0-0xC7
        this.RET,  this.RET,  this.JP,  this.CB,    this.CALL, this.CALL, this.ADC,  this.RST,   //0xC8-0xCF

        this.RET,  this.POP,  this.JP,  this.IDK,   this.CALL, this.PUSH, this.SUB,  this.RST,   //0xD0-0xD7
        this.RET,  this.RETI, this.JP,  this.IDK,   this.CALL, this.IDK,  this.SBC,  this.RST,   //0xD8-0xDF

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