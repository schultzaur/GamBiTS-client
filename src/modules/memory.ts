import { CPU } from "./cpu";

// implement functions to read/write bytes, and the arrays of memory, and also load a rom

// Rom from: https://gbdev.gg8.se/wiki/articles/Gameboy_Bootstrap_ROM#Contents_of_the_ROM
// Format-Hex "C:\Users\thom\Downloads\DMG_ROM.bin" | % { ($_.Bytes | %{ "0x{0:x2}," -f $_ }) -join " " } | clip
const BootRom: number[] = [
    0x31, 0xfe, 0xff, 0xaf, 0x21, 0xff, 0x9f, 0x32, 0xcb, 0x7c, 0x20, 0xfb, 0x21, 0x26, 0xff, 0x0e,
    0x11, 0x3e, 0x80, 0x32, 0xe2, 0x0c, 0x3e, 0xf3, 0xe2, 0x32, 0x3e, 0x77, 0x77, 0x3e, 0xfc, 0xe0,
    0x47, 0x11, 0x04, 0x01, 0x21, 0x10, 0x80, 0x1a, 0xcd, 0x95, 0x00, 0xcd, 0x96, 0x00, 0x13, 0x7b,
    0xfe, 0x34, 0x20, 0xf3, 0x11, 0xd8, 0x00, 0x06, 0x08, 0x1a, 0x13, 0x22, 0x23, 0x05, 0x20, 0xf9,
    0x3e, 0x19, 0xea, 0x10, 0x99, 0x21, 0x2f, 0x99, 0x0e, 0x0c, 0x3d, 0x28, 0x08, 0x32, 0x0d, 0x20,
    0xf9, 0x2e, 0x0f, 0x18, 0xf3, 0x67, 0x3e, 0x64, 0x57, 0xe0, 0x42, 0x3e, 0x91, 0xe0, 0x40, 0x04,
    0x1e, 0x02, 0x0e, 0x0c, 0xf0, 0x44, 0xfe, 0x90, 0x20, 0xfa, 0x0d, 0x20, 0xf7, 0x1d, 0x20, 0xf2,
    0x0e, 0x13, 0x24, 0x7c, 0x1e, 0x83, 0xfe, 0x62, 0x28, 0x06, 0x1e, 0xc1, 0xfe, 0x64, 0x20, 0x06,
    0x7b, 0xe2, 0x0c, 0x3e, 0x87, 0xe2, 0xf0, 0x42, 0x90, 0xe0, 0x42, 0x15, 0x20, 0xd2, 0x05, 0x20,
    0x4f, 0x16, 0x20, 0x18, 0xcb, 0x4f, 0x06, 0x04, 0xc5, 0xcb, 0x11, 0x17, 0xc1, 0xcb, 0x11, 0x17,
    0x05, 0x20, 0xf5, 0x22, 0x23, 0x22, 0x23, 0xc9, 0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b,
    0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d, 0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e,
    0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99, 0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc,
    0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e, 0x3c, 0x42, 0xb9, 0xa5, 0xb9, 0xa5, 0x42, 0x3c,
    0x21, 0x04, 0x01, 0x11, 0xa8, 0x00, 0x1a, 0x13, 0xbe, 0x20, 0xfe, 0x23, 0x7d, 0xfe, 0x34, 0x20,
    0xf5, 0x06, 0x19, 0x78, 0x86, 0x23, 0x05, 0x20, 0xfb, 0x86, 0x20, 0xfe, 0x3e, 0x01, 0xe0, 0x50,
]

const enum MBCType {
    NONE = "None",
    MBC1 = "MBC1",
    MBC2 = "MBC2",
    MBC3 = "MBC3",
    MBC5 = "MBC5",
    MBC6 = "MBC6",
    MBC7 = "MBC7",
    MMM01 = "MMM01",
}

const enum MBCMode {
    ROM = "ROM",
    RAM = "RAM",
}

export default class Memory {
    cpu: CPU;
    hasBoot: boolean;
    workRam: number[];
    videoRam: number[];
    oam: number[];
    externalRom: Int8Array;
    externalRomBank: number;
    externalRam: number[];
    externalRamBank: number;
    externalRamEnabled: boolean;
    highRam: number[];
    mbcMode: MBCMode;

    constructor(cpu: CPU)
    {
        this.cpu = cpu;
        this.hasBoot = false;
        this.workRam = [];
        this.videoRam = [];
        this.oam = [];
        this.externalRom = new Int8Array(2 ** 15);
        this.externalRomBank = 1;
        this.externalRam = [];
        this.externalRamBank = 0;
        this.externalRamEnabled = false;
        this.highRam = [];

        this.mbcMode = MBCMode.ROM;
    }

    // https://gbdev.gg8.se/wiki/articles/Memory_Bank_Controllers
    read(address: number): number
    {
        let value: number;

        if (address < 0x4000) {
            if (!this.hasBoot && address < 0x100) {
                value = BootRom[address];
            } else {
                value = this.externalRom[address];
            }
        } else if (address < 0x8000) {
            value = this.externalRom[address - 0x4000 + (0x4000 * this.externalRomBank)];
        } else if (address < 0xA000) {
            value = this.videoRam[address - 0x8000];
        } else if (address < 0xC000) {
            if (this.externalRamEnabled) {
                value = this.externalRam[address - 0xA000 + (0x2000 * this.externalRamBank)];
            } else {
                value = 0xff; // random online sources tell me so.
            }
        } else if (address < 0xE000) {
            value = this.workRam[address - 0xC000];
        } else if (address < 0xFE00) {
            value = this.workRam[address - 0xE000];
        } else if (address < 0xFEA0) {
            value = this.oam[address - 0xFE00];
        } else if (address < 0xFF00) {
            // Undocumented
            value = 0;
        } else if (address < 0xFF80) {
            switch (address) {
                case 0xFF00:
                    value = this.cpu.joypad.read(address);
                    break;

                case 0xFF01: case 0xFF02:
                    value = this.cpu.serial.read(address);
                    break;

                case 0xFF04: case 0xFF05: case 0xFF06: case 0xFF07:
                    value = this.cpu.timer.read(address);
                    break;

                case 0xFF0F:
                    value = this.cpu.IF & 0x1F;
                    break;

                case 0xFF4D:
                    // Speed switch.
                    value = 0xFF;
                    break;

                case 0xFF10: case 0xFF11: case 0xFF12: case 0xFF13: case 0xFF14:
                case 0xFF16: case 0xFF17: case 0xFF18: case 0xFF19:
                case 0xFF1A: case 0xFF1B: case 0xFF1C: case 0xFF1D: case 0xFF1E:
                case 0xFF20: case 0xFF21: case 0xFF22: case 0xFF23:
                case 0xFF24: case 0xFF25: case 0xFF26:
                case 0xFF30: case 0xFF31: case 0xFF32: case 0xFF33: case 0xFF34: case 0xFF35: case 0xFF36: case 0xFF37:
                case 0xFF38: case 0xFF39: case 0xFF3A: case 0xFF3B: case 0xFF3C: case 0xFF3D: case 0xFF3E: case 0xFF3F:
                    value = this.cpu.sound.read(address);
                    break;
                
                case 0xFF40: case 0xFF41: case 0xFF42: case 0xFF43:
                case 0xFF44: case 0xFF45: case 0xFF46: case 0xFF47:
                case 0xFF48: case 0xFF49: case 0xFF4A: case 0xFF4B:
                case 0xFF4F:
                case 0xFF51: case 0xFF52: case 0xFF53: case 0xFF54: case 0xFF55:
                case 0xFF56:
                case 0xFF68: case 0xFF69: case 0xFF6A: case 0xFF6B: case 0xFF70:
                    value = this.cpu.display.read(address);
                    break;

                case 0xFF70: case 0xFF72: case 0xFF73: case 0xFF74:  
                case 0xFF75: case 0xFF76: case 0xFF77:
                    // Undocumented?
                    break;
                default:
                    value = 0xFF;
            }
        } else if (address < 0xFFFF) {
            value = this.highRam[address - 0xFF80];
        } else if (address == 0xFFFF) {
            value = this.cpu.IE & 0x1F;
        }

        return (value || 0) & 0xff;
    }

    write(address: number, value: number): void
    {
        address = address & 0xFFFF;
        value = value & 0xFF;

        if (address < 0x2000) {
            this.externalRamEnabled = (value & 0xF) == 0xA;
        } else if (address < 0x4000) {
            // only MMC
            let bank = value & 0b11111;
            
            if (bank == 0) {
                bank = 1;
            }

            this.externalRomBank = this.externalRomBank & 0b1100000 + bank;
        } else if (address < 0x6000) {
            let bank = value & 0b11;
            switch(this.mbcMode) {
                case MBCMode.ROM:
                    this.externalRomBank = (bank << 5) + this.externalRomBank & 0b11111;
                    break;
                case MBCMode.RAM:
                    this.externalRamBank = bank;
                    break;
                default:
                    break;
            }
        } else if (address < 0x8000) {
            this.mbcMode = (value & 0b1) == 0b1 ? MBCMode.RAM : MBCMode.ROM;
        } else if (address < 0xA000) {
            let vramAddress = address - 0x8000;

            this.videoRam[vramAddress] = value;

            if (vramAddress < 0x1800) {
                this.cpu.display.tileMap.updateTile(vramAddress, value);
            }
        } else if (address < 0xC000) {
            if (this.externalRamEnabled) {
                this.externalRam[address - 0xA000 + (0x2000 * this.externalRamBank)] = value;
            }
        } else if (address < 0xE000) {
            this.workRam[address - 0xC000] = value;
        } else if (address < 0xFE00) {
            this.workRam[address - 0xE000] = value;
        } else if (address < 0xFEA0) {
            this.oam[address - 0xFE00] = value;
        } else if (address < 0xFF00) {
            // Undocumented
        } else if (address < 0xFF80) {
            switch (address) {
                case 0xFF00:
                    this.cpu.joypad.write(address, value);
                    break;

                case 0xFF01: case 0xFF02:
                    this.cpu.serial.write(address, value);
                    break;

                case 0xFF04: case 0xFF05: case 0xFF06: case 0xFF07:
                    this.cpu.timer.write(address, value);
                    break;

                case 0xFF0F:
                    this.cpu.IF = value;
                    break;

                case 0xFF4D:
                    break;

                case 0xFF50:
                    this.hasBoot = true;
                    break;

                case 0xFF10: case 0xFF11: case 0xFF12: case 0xFF13: case 0xFF14:
                case 0xFF16: case 0xFF17: case 0xFF18: case 0xFF19:
                case 0xFF1A: case 0xFF1B: case 0xFF1C: case 0xFF1D: case 0xFF1E:
                case 0xFF20: case 0xFF21: case 0xFF22: case 0xFF23:
                case 0xFF24: case 0xFF25: case 0xFF26:
                case 0xFF30: case 0xFF31: case 0xFF32: case 0xFF33: case 0xFF34: case 0xFF35: case 0xFF36: case 0xFF37:
                case 0xFF38: case 0xFF39: case 0xFF3A: case 0xFF3B: case 0xFF3C: case 0xFF3D: case 0xFF3E: case 0xFF3F:
                    this.cpu.sound.write(address, value);
                    break;
                
                case 0xFF40: case 0xFF41: case 0xFF42: case 0xFF43:
                case 0xFF44: case 0xFF45: case 0xFF46: case 0xFF47:
                case 0xFF48: case 0xFF49: case 0xFF4A: case 0xFF4B:
                case 0xFF4F:
                case 0xFF51: case 0xFF52: case 0xFF53: case 0xFF54: case 0xFF55:
                case 0xFF56:
                case 0xFF68: case 0xFF69: case 0xFF6A: case 0xFF6B: case 0xFF70:
                    this.cpu.display.write(address, value);
                    break;

                case 0xFF70: case 0xFF72: case 0xFF73: case 0xFF74:  
                case 0xFF75: case 0xFF76: case 0xFF77:
                    // Undocumented?
                    break;
            }
        } else if (address < 0xFFFF) {
            this.highRam[address - 0xFF80] = value;
        } else if (address == 0xFFFF) {
            this.cpu.IE = value;
        }
    }

    loadRom = (rom: Int8Array) => {
        this.externalRom = rom;
    }
}