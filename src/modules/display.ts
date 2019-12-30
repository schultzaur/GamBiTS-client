import { CPU, Interrupts } from "./cpu";

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

const enum Color {
    WHITE = 0b00,
    LIGHT_GREY = 0b01,
    DARK_GREY = 0b10,
    BLACK = 0b11,
    TRANSPARENT = 0b100,
}

const COLORS: number[][] = [
    [0xAE, 0xDC, 0xC0, 0xFF],
    [0x7B, 0xD3, 0x89, 0xff],
    [0x26, 0x41, 0x3C, 0xff],
    [0x04, 0x15, 0x0D, 0xff],
    [0x00, 0x00, 0x00, 0x00],
];

class Palette {
    type: PaletteType;
    value: number;
    colors: Color[];

    constructor(type: PaletteType) {
        this.type = type;
        this.value = 9;
        this.colors = Array(4);

        this.update(0xFC);
    }    
    
    update = (value: number) => {
        this.value = value;

        for (let i = 0; i < 4; i++) {
            this.colors[i] = 
                i > 0 || this.type == PaletteType.BGP
                    ? value & 0b11
                    : Color.TRANSPARENT;

            value = value >> 2;
        }
    }
}

class LCDC {
    display: Display;
    value: number;
    lcdEnabled: boolean;
    windowTileMapSelect: boolean;
    windowEnable: boolean;
    bgWindowTileDataSelect: boolean;
    bgTileMapSelect: boolean;
    spriteHeight: number;
    spriteEnable: boolean;
    bgWindowPriority: boolean;

    constructor(display: Display) {
        this.display = display;

        this.update(0x91);
    }

    update = (value: number) => {
        this.value = value;

        if (this.lcdEnabled && (value & (1 << 7)) == 1 << 7) {
            this.display.LY = 0;
            this.display.timer = 0;
            this.display.stat.updateMode(Modes.HBlank);
        }

        this.lcdEnabled = value & (1 << 7) ? true : false;
        this.windowTileMapSelect = value & (1 << 6) ? true : false;
        this.windowEnable = value & (1 << 5) ? true : false;
        this.bgWindowTileDataSelect = value & (1 << 4) ? true : false;
        this.bgTileMapSelect = value & (1 << 3) ? true : false;
        this.spriteHeight = value & (1 << 2) ? 16 : 8;
        this.spriteEnable = value & (1 << 1) ? true : false;
        this.bgWindowPriority = value & (1 << 0) ? true : false;
    }
}

class STAT {
    static readonly SET_BITS: number = 1 << 7;
    static readonly WRITEABLE_BITS: number = 0b01111000;
    static readonly COINCIDENCE_BIT: number = 1 << 2;
    static readonly MODE_BITS: number = 0b11;

    display: Display;
    value: number;
    coincidenceInterrupt: boolean;
    oamInterrupt: boolean;
    vblankInterrupt: boolean;
    hblankInterrupt: boolean;
    bgWindowPriority: boolean;
    coincidence: boolean;
    mode: Modes;

    constructor(display: Display, coincidence: boolean, mode: Modes) {
        this.display = display;
        this.value = STAT.SET_BITS;
        this.update(0x00);
        this.updateCoincidence(coincidence);
        this.updateMode(mode);
    }

    update = (value: number) => {
        this.value &= ~STAT.WRITEABLE_BITS;
        this.value |= (value & STAT.WRITEABLE_BITS);
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

        if (mode == Modes.VBlank) {
            this.display.cpu.IF |= Interrupts.VBlank
        }
    }
}

class Tile {
    raw_values: number[];
    pixels: number[][];

    constructor() {
        this.raw_values = Array(16).fill(0);
        this.pixels = Array(8).fill(null).map(() => Array(8).fill(0));
    }

    update = (line: number, value: number) => {
        this.raw_values[line] = value;

        let row = line >> 1;
        
        let pixels_l = this.raw_values[row << 1];
        let pixels_h = this.raw_values[(row << 1) + 1];

        for (let x = 7; x >= 0; x--) {
            this.pixels[row][x] = (2 * (pixels_h & 0b1)) + (pixels_l & 0b1)

            pixels_h >>= 1;
            pixels_l >>= 1;
        }

    }
}

class TileMap {
    display: Display;
    tiles: Tile[];

    constructor(display: Display) {
        this.display = display;
        this.tiles = Array(384).fill(null).map(() => new Tile());
    }

    getBgTile = (tileIndex: number) => {
        if (!this.display.lcdc.bgWindowTileDataSelect && tileIndex < 0x80) {
            tileIndex += 0x100;
        }

        return this.tiles[tileIndex];
    }

    getSprite = (tileIndex: number, spriteHeight: number, row: number) => {
        if (spriteHeight == 8) {
            return this.tiles[tileIndex];
        } else {
            // TODO: Probably too smart and a bug.
            return this.tiles[(tileIndex & ~1) | (row >>3)];
        }
    }

    updateTile = (address: number, value: number) => {
        this.tiles[address >> 4].update(address & 0xf, value);
    }
}

class Sprite {
    static readonly PRIORITY_BIT = 1 << 7
    static readonly Y_FLIP_BIT = 1 << 6
    static readonly X_FLIP_BIT = 1 << 5
    static readonly PALETTE_BIT = 1 << 4

    y_pos: number;
    x_pos: number;
    tileIndex: number;

    priority: boolean;
    y_flip: boolean;
    x_flip: boolean;
    paletteType: PaletteType;
    // CGB Tile VRAM-Bank
    // Palette number

    constructor() {
        this.y_pos = 0;
        this.x_pos = 0;
        this.tileIndex = 0;
        this.priority = false;
        this.y_flip = false;
        this.x_flip = false;
        this.paletteType = PaletteType.OBP0;
    }

    overlapsRow = (y: number, spriteHeight: number) => {
        let first_row = this.y_pos - 16;
        return first_row <= y && y < first_row + spriteHeight;
    }

    update = (byte: number, value: number) => {
        switch(byte) {
            case 0b00:
                this.y_pos = value;
                break;
            case 0b01:
                this.x_pos = value;
                break;
            case 0b10:
                this.tileIndex = value;
                break;
            case 0b11:
                this.priority = (value & Sprite.PRIORITY_BIT) == Sprite.PRIORITY_BIT;
                this.y_flip = (value & Sprite.Y_FLIP_BIT) == Sprite.Y_FLIP_BIT;
                this.x_flip = (value & Sprite.X_FLIP_BIT) == Sprite.X_FLIP_BIT;
                this.paletteType = (value & Sprite.PALETTE_BIT) == Sprite.PALETTE_BIT
                    ? PaletteType.OBP1 : PaletteType.OBP0;
                break;
        }
    }
}

class SpriteAttributeTable {
    display: Display;
    sprites: Sprite[];

    constructor(display: Display) {
        this.display = display;
        this.sprites = Array(40).fill(null).map(() => new Sprite());
    }

    getSprites = (y: number) => {
        // todo: cgb vs dmg conflict resolution. do cgb (oam order) for now.
        // return them in order of increasing x_pos.

        let sprites: Sprite[] = [];

        for (let i = 0; i < 40; i++) {
            if (this.sprites[i].overlapsRow(y, this.display.lcdc.spriteHeight)) {
                sprites.push(this.sprites[i]);
                if (sprites.length >= 10) {
                    break;
                }
            }
        }

        sprites = sprites.sort((a: Sprite, b: Sprite) => b.x_pos - a.x_pos);

        return sprites;
    }

    update = (address: number, value: number) => {
        this.sprites[address >> 2].update(address & 0b11, value);
    }
}

class OamDma {
    cpu: CPU;
    display: Display;

    running; boolean;
    high: number;
    low: number;

    constructor(display: Display) {
        this.cpu = display.cpu;
        this.display = display;
        this.high = 0;
        this.low = 0;
    }

    step = () => {
        if (this.running) {
            let value = this.cpu.memory.read((this.high << 8) + this.low);
            this.display.oam[this.low] = value;
            this.cpu.display.spriteAttributeTable.update(this.low, value);

            this.low++;

            if (this.low == 0xA0) {
                this.running = false;
            }
        }
    }

    start = (value: number) => {
        this.high = value;
        this.low = 0;
        this.running = true;
    }
}

export default class Display {
    cpu: CPU;
    videoRam: number[];
    oam: number[];

    oamDma: OamDma;

    timer: number;

    lcdc: LCDC;
    stat: STAT;

    tileMap: TileMap;
    spriteAttributeTable: SpriteAttributeTable;

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

    bgBuffer: Color[];
    spriteBuffer: Color[];

    constructor(cpu: CPU, canvas: HTMLCanvasElement) {
        this.cpu = cpu;

        this.oam = [];
        this.videoRam = [];

        if (canvas !== undefined) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
            this.imageData = this.context.createImageData(160, 144);
        }

        this.reset();
    }

    reset = () => {
        this.timer = 0;
        this.oamDma = new OamDma(this);

        this.lcdc = new LCDC(this);
        this.stat = new STAT(this, this.LY == this.LYC, Modes.HBlank);

        this.tileMap = new TileMap(this);
        this.spriteAttributeTable = new SpriteAttributeTable(this);
        
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
        this.bgBuffer = Array(160).fill(Color.WHITE);
        this.spriteBuffer = Array(160).fill(Color.TRANSPARENT);
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
        this.oamDma.step();

        if (!this.lcdc.lcdEnabled) {
            return;
        }

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

    getBgTileIndex = (tile_y: number, tile_x: number) => {
        let baseAddress: number = this.lcdc.bgTileMapSelect ? 0x1C00 : 0x1800;
        return this.videoRam[baseAddress + (0x20 * tile_y) + tile_x] || 0;
    }

    getWindowTileIndex = (tile_y: number, tile_x: number) => {
        let baseAddress: number = this.lcdc.windowTileMapSelect ? 0x1C00 : 0x1800;
        return this.videoRam[baseAddress + (0x20 * tile_y) + tile_x] || 0;
    }
    
    updateLine = () => {
        let bgp_colors: Color[] = this.palettes[PaletteType.BGP].colors;

        if (this.lcdc.bgWindowPriority) {

            let tile_y = ((this.LY + this.SCY) & 0xff) >> 3;
            let tile_dy = (this.LY + this.SCY) & 0x7;
    
            let tile_x = (this.SCX & 0xff) >> 3;
            let tile_dx = this.SCX & 0x7;
            
            let tileIndex = this.getBgTileIndex(tile_y, tile_x);
            let pixels = this.tileMap.getBgTile(tileIndex).pixels[tile_dy];
    
            let windowStart = this.lcdc.windowEnable && this.WY <= this.LY
                ? this.WX-7
                : 160;
    
            for (var x = 0; x < windowStart; x++) {
                this.bgBuffer[x] = bgp_colors[pixels[tile_dx]];
    
                tile_dx += 1;
                if (tile_dx == 8) {
                    tile_dx -= 8;
                    tile_x += 1
                    tileIndex = this.getBgTileIndex(tile_y, tile_x);
                    pixels = this.tileMap.getBgTile(tileIndex).pixels[tile_dy];
                }
            }

            tile_y = (this.LY - this.WY) >> 3;
            tile_dy = (this.LY - this.WY) & 0x7;

            tile_x = (x - windowStart) >> 3;
            tile_dx = (x - windowStart) & 0x7;

            tileIndex = this.getWindowTileIndex(tile_y, tile_x);
            pixels = this.tileMap.getBgTile(tileIndex).pixels[tile_dy];

            for (; x < 160; x++) {
                this.bgBuffer[x] = bgp_colors[pixels[tile_dx]];

                tile_dx += 1;
                if (tile_dx == 8) {
                    tile_dx -= 8;
                    tile_x += 1
                    tileIndex = this.getWindowTileIndex(tile_y, tile_x);
                    pixels = this.tileMap.getBgTile(tileIndex).pixels[tile_dy];
                }
            }
        } else {
            this.bgBuffer.fill(Color.WHITE);
        }

        this.spriteBuffer.fill(Color.TRANSPARENT);
        if (this.lcdc.spriteEnable) {
            let sprites: Sprite[] = this.spriteAttributeTable.getSprites(this.LY);
            let spriteHeight = this.lcdc.spriteHeight;

            for (let i = sprites.length - 1; i >= 0; i--) {
                let sprite: Sprite = sprites[i];
                let row = this.LY - (sprite.y_pos - 16);

                if (sprite.y_flip) {
                    row = (spriteHeight-1) - row;
                }

                let tile: Tile = this.tileMap.getSprite(sprite.tileIndex, spriteHeight, row);
                let pixels: number[] = tile.pixels[row % 8];

                for (let dx = 0; dx < 8; dx++) {
                    let x = sprite.x_pos - 8 + dx;

                    if (x >= 0 && x < 160) {
                        if (!sprite.priority || this.bgBuffer[x] == bgp_colors[0]) {
                            this.spriteBuffer[x] = this.palettes[sprite.paletteType].colors[pixels[dx]]
                        }
                    }
                }
            }
        }

        let imageDataOffset = this.LY * 160 * 4;

        for (var x = 0; x < 160; x++) {
            let color: number[] =
                this.spriteBuffer[x] == Color.TRANSPARENT
                    ? COLORS[this.bgBuffer[x]]
                    : COLORS[this.spriteBuffer[x]];

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
                value = this.lcdc.value;
                break;
            case 0xFF41:
                value = this.stat.value;
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
                value = this.oamDma.high;
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
                // if (value == 3) {
                //     this.cpu.break = true;
                // }
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
                this.oamDma.start(value);
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