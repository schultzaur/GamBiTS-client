import { CPU } from "./cpu";

export default class Serial {
    cpu: CPU;
    buffer: number;
    
    constructor(cpu: CPU) {
        this.cpu = cpu;
        this.buffer = 0;
    }

    step = () => {

    }

    read = (address: number) => {
        switch(address) {
            case 0xFF01:
                //todo
                break;
        }

        return 0;
    }
    
    write = (address: number, value: number) => {
        switch(address) {
            case 0xFF01:
                this.buffer = value;
                break;
            case 0xFF02: 
                break;
        }
    }
}