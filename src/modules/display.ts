import { CPU } from "./cpu";

const enum Modes {
    HBlank = 0b00,
    VBlank = 0b01,
    OAM = 0b10,
    VRam = 0b11,
}

export default class Display {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    cpu: CPU;
    timer: number;
    mode: number;
    scanline: number;

    frameCount: number;

    constructor(cpu: CPU, canvas: HTMLCanvasElement) {
        this.cpu = cpu;
        this.timer = 0;
        this.mode = Modes.HBlank;
        this.scanline = 0;

        this.frameCount = 0;

        if (canvas !== undefined) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
        }
    }

    updateCanvas = () => {
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

        switch(this.mode) {
            case Modes.HBlank:
                if (this.timer >= 208) {
                    this.timer -= 208;
                    this.scanline += 1;
                    
                    if (this.scanline >= 144) {
                        this.updateCanvas();
                        this.mode = Modes.VBlank;
                    } else {
                        this.mode = Modes.OAM;
                    }
                }
                break;
            case Modes.VBlank:
                if (this.timer >= 456) {
                    this.timer -= 456;
                    this.scanline += 1;

                    if (this.scanline >= 154) {
                        this.scanline = 0;
                        this.mode = Modes.OAM;
                    }
                }
                break;
            case Modes.OAM:
                if (this.timer >= 80) {
                    this.timer -= 80;
                    this.mode = Modes.VRam;
                }
                break;
            case Modes.VRam:
                if (this.timer >= 168) {
                    this.timer -= 168
                    this.mode = Modes.HBlank;
                }
                break;

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
                //SCY
                break;
            case 0xFF44:
                //LCDY
                value = this.scanline;
                break;
            case 0xFF45:
                //LCY
                break;
            case 0xFF46:
                //OAM DMA
                break;
            case 0xFF47:
                //DMG BGP
                break;
            case 0xFF48:
                //DMG OBP0
                break;
            case 0xFF49:
                //DMG OBP1
                break;
            case 0xFF4A:
                //WY
                break;
            case 0xFF4B:
                //WX
                break;
            case 0xFF51:
                //CGB HDMA1
                break;
            case 0xFF52:
                //CGB HDMA2
                break;
            case 0xFF53:
                //CGB HDMA3
                break;
            case 0xFF54:
                //CGB HDMA4
                break;
            case 0xFF55:
                //CGB HDMA5
                break;
            case 0xFF68:
                //CGB BCPS/BGPI
                break;
            case 0xFF69:
                //CGB BCPD/BGPD
                break;
            case 0xFF6A:
                //CGB OCPS
                break;
            case 0xFF6B:
                //CGB OCPI
                break;
        }

        return value;
    }

    write = (address: number, value: number) => {
        switch(address) {
            case 0xFF40:
                //LCDC
                break;
            case 0xFF41:
                //STAT
                break;
            case 0xFF42:
                //SCY
                break;
            case 0xFF44:
                //LCDY
                break;
            case 0xFF45:
                //LCY
                break;
            case 0xFF46:
                //OAM DMA
                break;
            case 0xFF47:
                //DMG BGP
                break;
            case 0xFF48:
                //DMG OBP0
                break;
            case 0xFF49:
                //DMG OBP1
                break;
            case 0xFF4A:
                //WY
                break;
            case 0xFF4B:
                //WX
                break;
            case 0xFF51:
                //CGB HDMA1
                break;
            case 0xFF52:
                //CGB HDMA2
                break;
            case 0xFF53:
                //CGB HDMA3
                break;
            case 0xFF54:
                //CGB HDMA4
                break;
            case 0xFF55:
                //CGB HDMA5
                break;
            case 0xFF68:
                //CGB BCPS/BGPI
                break;
            case 0xFF69:
                //CGB BCPD/BGPD
                break;
            case 0xFF6A:
                //CGB OCPS
                break;
            case 0xFF6B:
                //CGB OCPI
                break;
        }
    }
}