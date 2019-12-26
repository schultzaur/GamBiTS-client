import { CPU } from "./cpu";

export default class Timer {
    cpu: CPU;
    
    constructor(cpu: CPU) {
        this.cpu = cpu;
    }

    step = () => {
    }

    read = (address: number) => {
        switch(address) {
            case 0xFF00:
                break;
        }

        return 0;
    }
    
    write = (address: number, value: number) => {
        switch(address) {
            case 0xFF00:
                break;
        }
    }
}