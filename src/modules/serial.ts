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
            case 0xFF00:
                break;
        }

        return 0;
    }
    
    write = (address: number, value: number) => {
        switch(address) {
            case 0xFF01:
                this.buffer = value;
                
                console.log("Serial Buffer: ", String.fromCharCode(value));
                break;
            case 0xFF20: 
                break;
        }
    }
}