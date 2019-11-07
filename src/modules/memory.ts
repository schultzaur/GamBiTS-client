// implement functions to read/write bytes, and the arrays of memory, and also load a rom

export default class Memory {
    constructor()
    {
    }

    snapshot(): Memory
    {
        let newMemory = new Memory();

        return newMemory;
    }
}