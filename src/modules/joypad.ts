import { CPU, Interrupts } from "./cpu";

const enum Buttons {
    Start,
    Select,
    B,
    A,
}

const enum Directions {
    Down,
    Up,
    Left,
    Right,
}

export default class Joypad {
    static readonly SELECT_BUTTON = 1 << 5;
    static readonly SELECT_DIRECTION = 1 << 4;

    cpu: CPU;

    selectButton: boolean;
    selectDirection: boolean;

    buttonStates: { 
        [Buttons.Start]: boolean,
        [Buttons.Select]: boolean,
        [Buttons.B]: boolean,
        [Buttons.A]: boolean,
    }

    directionStates: {
        [Directions.Down]: boolean,
        [Directions.Up]: boolean,
        [Directions.Left]: boolean,
        [Directions.Right]: boolean,
    }

    constructor(cpu: CPU) {
        this.cpu = cpu;

        this.buttonStates = {
            [Buttons.Start]: false,
            [Buttons.Select]: false,
            [Buttons.B]: false,
            [Buttons.A]: false,
        }

        this.directionStates = {
            [Directions.Down]: false,
            [Directions.Up]: false,
            [Directions.Left]: false,
            [Directions.Right]: false,
        }
    }

    keyDownHandler = (event: KeyboardEvent) => {
        let irq = false;

        switch(event.keyCode) {
            case 0x0D: // Enter
                irq = !this.buttonStates[Buttons.Start];
                this.buttonStates[Buttons.Start] = true;
                break;
            case 0x10: // Right Shift
                irq = !this.buttonStates[Buttons.Select];
                this.buttonStates[Buttons.Select] = true;
                break;
            case 0x5A: // Z
                irq = !this.buttonStates[Buttons.B];
                this.buttonStates[Buttons.B] = true;
                break;
            case 0x58: // X
                irq = !this.buttonStates[Buttons.A];
                this.buttonStates[Buttons.A] = true;
                break;

            case 0x28: // ArrowDown
                irq = !this.directionStates[Directions.Down];
                this.directionStates[Directions.Down] = true;
                break;
            case 0x26: // ArrowUp
                irq = !this.directionStates[Directions.Up];
                this.directionStates[Directions.Up] = true;
                break;
            case 0x25: // ArrowLeft
                irq = !this.directionStates[Directions.Left];
                this.directionStates[Directions.Left] = true;
                break;
            case 0x27: // ArrowRight
                irq = !this.directionStates[Directions.Right];
                this.directionStates[Directions.Right] = true;
                break;
        }

        if (irq) {
            this.cpu.IF |= Interrupts.Joypad;
            // todo, should be fallign edge detector
        }
    }

    keyUpHandler = (event: KeyboardEvent) => {
        switch(event.keyCode) {
            case 0x0D: // Enter
                this.buttonStates[Buttons.Start] = false;
                break;
            case 0x10: // Right Shift
                this.buttonStates[Buttons.Select] = false;
                break;
            case 0x5A: // Z
                this.buttonStates[Buttons.B] = false;
                break;
            case 0x58: // X
                this.buttonStates[Buttons.A] = false;
                break;

            case 0x28: // ArrowDown
                this.directionStates[Directions.Down] = false;
                break;
            case 0x26: // ArrowUp
                this.directionStates[Directions.Up] = false;
                break;
            case 0x25: // ArrowLeft
                this.directionStates[Directions.Left] = false;
                break;
            case 0x27: // ArrowRight
                this.directionStates[Directions.Right] = false;
                break;
        }
    }

    step = () => {}

    read = (address: number) => {
        let value = 0;

        switch(address) {
            case 0xFF00:
                value |= this.selectButton ? Joypad.SELECT_BUTTON : 0;
                value |= this.selectDirection ? Joypad.SELECT_DIRECTION : 0;
                
                if (this.selectButton) {
                    value |= this.buttonStates[Buttons.Start] ? (1 << 3) : 0;
                    value |= this.buttonStates[Buttons.Select] ? (1 << 2) : 0;
                    value |= this.buttonStates[Buttons.B] ? (1 << 1) : 0;
                    value |= this.buttonStates[Buttons.A] ? (1 << 0) : 0;
                }
                
                if (this.selectDirection) {
                    value |= this.directionStates[Directions.Down] ? (1 << 3) : 0;
                    value |= this.directionStates[Directions.Up] ? (1 << 2) : 0;
                    value |= this.directionStates[Directions.Left] ? (1 << 1) : 0;
                    value |= this.directionStates[Directions.Right] ? (1 << 0) : 0;
                }

                value = ~value;

                break;
        }

        // console.log("read joypad", address.toString(16), (value & 0xff).toString(16), this.selectButton, this.selectDirection, this.buttonStates, this.directionStates);

        return value & 0xFF;
    }
    
    write = (address: number, value: number) => {
        switch(address) {
            case 0xFF00:
                this.selectButton = (value & Joypad.SELECT_BUTTON) == 0;
                this.selectDirection = (value & Joypad.SELECT_DIRECTION) == 0;
                break;
        }
    }
}