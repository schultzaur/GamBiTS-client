import { CPU, Interrupts } from "./cpu";

class Control {
    static readonly WRITEABLE_BITS = 0b111;

    raw_value: number;
    enabled: boolean;
    counter_ratio: number;

    constructor() {
        this.update(0x00);
    }

    update = (value: number) => {
        this.raw_value = value & Control.WRITEABLE_BITS;

        this.enabled = this.raw_value & 0b100 ? true : false;

        switch(this.raw_value & 0b11) {
            case 0b00:
                this.counter_ratio = 1 << 8;
                break;
            case 0b01:
                this.counter_ratio = 1 << 2;
                break;
            case 0b10:
                this.counter_ratio = 1 << 4;
                break;
            case 0b11:
                this.counter_ratio = 1 << 6;
                break;
        }
    }
}

export default class Timer {
    cpu: CPU;

    // https://gbdev.gg8.se/wiki/articles/Timer_Obscure_Behaviour
    // Offset, since we increment every machine cycle:
    //     0bxx76543210765432
    //         | DIV  |
    internal_timer: number;

    control: Control;
    timer: number;
    modulo: number;

    constructor(cpu: CPU) {
        this.cpu = cpu;

        this.internal_timer = 0;

        this.control = new Control();

        this.timer = 0;
        this.modulo = 0;
    }

    step = () => {
        this.internal_timer++;

        // TODO: proper falling edge detection;

        if (this.control.enabled && (this.internal_timer & (this.control.counter_ratio - 1)) == 0) {
            this.timer++;
            
            if (this.timer >= 0x100) {
                this.timer = this.modulo;
                this.cpu.IF |= Interrupts.Timer;
            }
        }

        this.internal_timer &= 0x3fff;
    }

    read = (address: number) => {
        let value = 0;

        switch(address) {
            case 0xFF04:
                value = this.internal_timer >> 6;
                break;
            case 0xFF05:
                value = this.timer;
            case 0xFF06:
                value = this.modulo;
                break;
            case 0xFF07:
                value = this.control.raw_value;
                break;
        }

        return value & 0xff;
    }
    
    write = (address: number, value: number) => {
        switch(address) {
            case 0xFF04:
                this.internal_timer = 0;
                break;
            case 0xFF05:
                this.timer = value;
                break;
            case 0xFF06:
                this.modulo = value;
                break;
            case 0xFF07:
                this.control.update(value);
                break;
        }
    }
}