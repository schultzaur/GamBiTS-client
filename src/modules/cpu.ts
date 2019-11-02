// Define: registers, clock, etc.

export default class CPU {
    reg = {
        A: 0, F: 0,
        B: 0, C: 0,
        D: 0, E: 0,
        H: 0, L: 0,
        PC: 0,
        SP: 0,
    }

    flag =
    {
        Z: 0, // Zero
        N: 0, // Subtract
        H: 0, // Half-carry
        C: 0, // Carry
    }
    
    byte_to_reg = ["B", "C", "D", "E", "H", "L", "(HL)", "A"]

    // resource: https://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html
    opcode_map = [
        this.NOP,  this.LD,   this.LD,   this.INC,  this.INC,  this.DEC,  this.LD,   this.RLCA, //0x00-0x07
        this.LD,   this.ADD,  this.LD,   this.DEC,  this.INC,  this.DEC,  this.LD,   this.RRCA, //0x08-0x0F
 
        this.STOP, this.LD,   this.LD,   this.INC,  this.INC,  this.DEC,  this.LD,   this.RLC,  //0x10-0x17
        this.JR,   this.ADD,  this.LD,   this.DEC,  this.INC,  this.DEC,  this.LD,   this.RRC,  //0x18-0x1F
 
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

        this.LDH,  this.POP,  this.LD,  this.IDK,   this.IDK,  this.PUSH, this.AND,  this.RST,   //0xE0-0xE7
        this.ADD,  this.JP,   this.LD,  this.IDK,   this.IDK,  this.IDK,  this.XOR,  this.RST,   //0xE8-0xEF

        this.LDH,  this.POP,  this.LD,  this.DI,    this.IDK,  this.PUSH, this.OR,   this.RST,   //0xF0-0xF7
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

    exec(opcode)
    {
        
    }

    /* gb cpu manual - by DP */
    CB() {}

    IDK() {}

    NOP() {}
    
    HALT() {}
    STOP() {}
    DI() {}
    EI() {}

    LD() {}
    LDD() {}
    LDI() {}
    LDH() {}
    PUSH() {}
    POP() {}

    ADD() {}
    ADC() {}
    SUB() {}
    SBC() {}

    AND() {}
    OR() {}
    XOR() {}
    CP() {}

    INC() {}
    DEC() {}
    SWAP() {}
    DAA() {}
    CPL() {}
    CCF() {}
    SCF() {}

    RL() {}
    RLC() {}
    RLCA() {}
    RR() {}
    RRC() {}
    RRCA() {}
    SLA() {}
    SRA() {}
    SRL() {}

    BIT() {}
    SET() {}
    RES() {}

    JP() {}
    JR() {}
    CALL() {}
    RST() {}
    RET() {}
    RETI() {}
}