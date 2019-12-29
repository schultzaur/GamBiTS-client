import { CPU } from "./cpu";

const enum Modes {
    HBlank = 0b00,
    VBlank = 0b01,
    OAM = 0b10,
    VRam = 0b11,
}

const enum PaletteType {
    BGP = "BGP",
    OBP0 = "OBP0",
    OBP1 = "OBP1",
}

const COLORS: number[][] = [
    [0xAE, 0xDC, 0xC0, 0xFF],
    [0x7B, 0xD3, 0x89, 0xff],
    [0x26, 0x41, 0x3C, 0xff],
    [0x04, 0x15, 0x0D, 0xff],
];

const TRANSPARENT_COLOR: number[] = [0x00, 0x00, 0x00, 0x00];

class Palette {
    type: PaletteType;
    value: number;
    colors: number[][];

    constructor(type: PaletteType) {
        this.type = type;
        this.value = 9;
        this.colors = Array(4).fill(Array(4));

        this.update(0xFC);
    }    
    
    update = (value: number) => {
        this.value = value;

        for (let i = 0; i < 4; i++) {
            this.colors[i] = 
                i > 0 || this.type == PaletteType.BGP
                    ? COLORS[value & 0b11]
                    : TRANSPARENT_COLOR;

            value = value >> 2;
        }
    }
}

class LCDC {
    value: number;
    lcdEnabled: boolean;
    windowTileMapSelect: boolean;
    windowEnable: boolean;
    bgWindowtileDataSelect: boolean;
    bgTileMapSelect: boolean;
    spriteSize: boolean;
    spriteEnable: boolean;
    bgWindowPriority: boolean;
    
    constructor() {
        this.update(0x91);
    }

    update = (value: number) => {
        this.value = value;
        this.lcdEnabled = value & (1 << 7) ? true : false;
        this.windowTileMapSelect = value & (1 << 6) ? true : false;
        this.windowEnable = value & (1 << 5) ? true : false;
        this.bgWindowtileDataSelect = value & (1 << 4) ? true : false;
        this.bgTileMapSelect = value & (1 << 3) ? true : false;
        this.spriteSize = value & (1 << 2) ? true : false;
        this.spriteEnable = value & (1 << 1) ? true : false;
        this.bgWindowPriority = value & (1 << 0) ? true : false;
    }
}

class STAT {
    static readonly SET_BITS: number = 1 << 7;
    static readonly WRITEABLE_BITS: number = 0b01111000;
    static readonly COINCIDENCE_BIT: number = 1 << 2;
    static readonly MODE_BITS: number = 0b11;

    value: number;
    coincidenceInterrupt: boolean;
    oamInterrupt: boolean;
    vblankInterrupt: boolean;
    hblankInterrupt: boolean;
    bgWindowPriority: boolean;
    coincidence: boolean;
    mode: Modes;

    constructor(coincidence: boolean, mode: Modes) {
        this.value = STAT.SET_BITS;
        this.update(0x00);
        this.updateCoincidence(coincidence);
        this.updateMode(mode);
    }

    update = (value: number) => {
        this.value &= ~STAT.WRITEABLE_BITS;
        this.value |= value & STAT.WRITEABLE_BITS;
    };

    updateCoincidence = (coincidence: boolean) => {
        this.coincidence = coincidence;

        if (coincidence) {
            this.value |= STAT.COINCIDENCE_BIT;
        } else {
            this.value &= ~STAT.COINCIDENCE_BIT;
        }
    }

    updateMode = (mode: Modes) => {
        this.mode = mode;

        this.value &= ~STAT.MODE_BITS;
        this.value |= mode;
    }
}

export default class Display {
    cpu: CPU;

    timer: number;

    lcdc: LCDC;
    stat: STAT;

    SCY: number;
    SCX: number;
    LY: number;
    LYC: number;
    WY: number;
    WX: number;

    palettes: {
        [PaletteType.BGP]: Palette,
        [PaletteType.OBP0]: Palette,
        [PaletteType.OBP1]: Palette,
    }

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    imageData: ImageData;
    frameCount: number;

    constructor(cpu: CPU, canvas: HTMLCanvasElement) {
        this.cpu = cpu;

        if (canvas !== undefined) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
            this.imageData = this.context.createImageData(160, 144);
        }

        this.reset();
    }

    reset = () => {
        this.timer = 0;

        this.lcdc = new LCDC();
        this.stat = new STAT(this.LY == this.LYC, Modes.HBlank);

        this.SCY = 0;
        this.SCX = 0;
        this.LY = 0;
        this.LYC = 0;
        this.WY = 0;
        this.WX = 0;
        
        this.palettes = {
            [PaletteType.BGP]: new Palette(PaletteType.BGP),
            [PaletteType.OBP0]: new Palette(PaletteType.OBP0),
            [PaletteType.OBP1]: new Palette(PaletteType.OBP1),
        }

        this.frameCount = 0;
    }

    updateCanvas = () => {
        this.context.putImageData(this.imageData, 0, 0);

        let width = this.context.measureText(this.frameCount.toString()).width;
        let height = parseInt(this.context.font, 10);
        this.context.fillStyle = "#FFF";
        this.context.fillRect(this.canvas.width - width, this.canvas.height - height, width, height);
        this.context.fillStyle = "#000";
        this.context.fillText(this.frameCount.toString(), this.canvas.width - width, this.canvas.height);

        this.frameCount++;
    }
  
    step = () => {
        this.timer += 4;

        switch(this.stat.mode) {
            case Modes.HBlank:
                if (this.timer >= 208) {
                    this.timer -= 208;

                    this.updateLine();

                    this.LY += 1;
                    
                    if (this.LY >= 144) {
                        this.updateCanvas();
                        this.stat.updateMode(Modes.VBlank);
                    } else {
                        this.stat.updateMode(Modes.OAM);
                    }
                }
                break;
            case Modes.VBlank:
                if (this.timer >= 456) {
                    this.timer -= 456;
                    this.LY += 1;

                    if (this.LY >= 154) {
                        this.LY = 0;
                        this.stat.updateMode(Modes.OAM);
                    }
                }
                break;
            case Modes.OAM:
                if (this.timer >= 80) {
                    this.timer -= 80;
                    this.stat.updateMode(Modes.VRam);
                }
                break;
            case Modes.VRam:
                if (this.timer >= 168) {
                    this.timer -= 168
                    this.stat.updateMode(Modes.HBlank);
                }
                break;
        }
    }

    updateLine = () => {
        let imageDataOffset = this.LY * 160 * 4;

        let tile_y = ((this.LY + this.SCY) & 0xff) >> 3;
        let tile_dy = (this.LY + this.SCY) & 0x7;

        for (var x = 0; x < 160; x++) {
            let tile_x = ((x + this.SCX) & 0xff) >> 3;
            let tile_dx = (x + this.SCX) & 0x7;

            // add 0x400 for bgmap1
            let tile = this.cpu.memory.videoRam[0x1800 + (0x20 * tile_y) + tile_x]
            
            let line_offset = 0x0000 + (0x10 * tile) + 2 * tile_dy;

            let bit_mask = 1 << (7 - tile_dx);
            let pixel_l = this.cpu.memory.videoRam[line_offset] & bit_mask;
            let pixel_h = this.cpu.memory.videoRam[line_offset+1] & bit_mask;
            let color = this.palettes[PaletteType.BGP].colors[(pixel_h ? 2 : 0) + (pixel_l ? 1 : 0)];

            this.imageData.data[imageDataOffset++] = color[0];
            this.imageData.data[imageDataOffset++] = color[1];
            this.imageData.data[imageDataOffset++] = color[2];
            this.imageData.data[imageDataOffset++] = color[3];
        }
    }

    read = (address: number) => {
        let value = 0;

        switch(address) {
            case 0xFF40:
                //LCDC
                break;
            case 0xFF41:
                //STAT
                break;
            case 0xFF42:
                value = this.SCY
                break;
            case 0xFF44:
                value = this.lcdc.lcdEnabled ? this.LY : 0;
                break;
            case 0xFF45:
                value = this.LYC;
                break;
            case 0xFF46:
                //OAM DMA
                break;
            case 0xFF47:
                value = this.palettes[PaletteType.BGP].value;
                break;
            case 0xFF48:
                value = this.palettes[PaletteType.OBP0].value;
                break;
            case 0xFF49:
                value = this.palettes[PaletteType.OBP1].value;
                break;
            case 0xFF4A:
                value = this.WY;
                break;
            case 0xFF4B:
                value = this.WX;
                break;
            case 0xFF51: break; //CGB HDMA1
            case 0xFF52: break; //CGB HDMA2
            case 0xFF53: break; //CGB HDMA3
            case 0xFF54: break; //CGB HDMA4
            case 0xFF55: break; //CGB HDMA5
            case 0xFF68: break; //CGB BCPS/BGPI
            case 0xFF69: break; //CGB BCPD/BGPD
            case 0xFF6A: break; //CGB OCPS
            case 0xFF6B: break; //CGB OCPI
        }

        return value;
    }

    write = (address: number, value: number) => {
        switch(address) {
            case 0xFF40:
                this.lcdc.update(value);
                break;
            case 0xFF41:
                this.stat.update(value);
                break;
            case 0xFF42:
                this.SCY = value;
                break;
            case 0xFF44:
                // LY, no-op
                break;
            case 0xFF45:
                this.LYC = value;
                break;
            case 0xFF46:
                //OAM DMA TODO
                break;
            case 0xFF47:
                this.palettes[PaletteType.BGP].update(value);
                break;
            case 0xFF48:
                this.palettes[PaletteType.OBP0].update(value);
                break;
            case 0xFF49:
                this.palettes[PaletteType.OBP1].update(value);
                break;
            case 0xFF4A:
                this.WY = value;
                break;
            case 0xFF4B:
                this.WX = value;
                break;
            case 0xFF51: break; //CGB HDMA1
            case 0xFF52: break; //CGB HDMA2
            case 0xFF53: break; //CGB HDMA3
            case 0xFF54: break; //CGB HDMA4
            case 0xFF55: break; //CGB HDMA5
            case 0xFF68: break; //CGB BCPS/BGPI
            case 0xFF69: break; //CGB BCPD/BGPD
            case 0xFF6A: break; //CGB OCPS
            case 0xFF6B: break; //CGB OCPI
        }
    }
}