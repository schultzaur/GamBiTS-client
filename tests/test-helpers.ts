import { CPU, Flag, Flags, Register, Registers } from './../src/modules/cpu.js';

export function assertEqual(
    expected: number,
    actual: number,
    name: string
) {
    if (expected != actual)
    {
        throw new Error(`Unexpected value for <${name}>. Expected: <0x${expected.toString(16)}>, actual: <0x${actual.toString(16)}>.`);
    }
}

export function assertState(
    currentCpu: CPU,
    previousCpu: CPU,
    expectedCycles: number,
    expectedRegisters: { [key in keyof typeof Register]?: number },
    expectedFlags: { [key in keyof typeof Flag]?: number },
    expectedMemory: { [index: number]: number },
) {
    assertEqual(expectedCycles, currentCpu.timer - previousCpu.timer, `elapsed cycles`);

    for (let register of Registers) {
        if (register in expectedRegisters) {
            assertEqual(expectedRegisters[register], currentCpu.registers[register], `register ${register}`);
        } else {
            assertEqual(previousCpu.registers[register], currentCpu.registers[register], `register ${register}`);
        }
    }

    for (let flag of Flags) {
        if (flag in expectedFlags) {
            assertEqual(expectedFlags[flag], currentCpu.flags[flag], `flag ${flag}`);
        } else {
            assertEqual(previousCpu.flags[flag], currentCpu.flags[flag], `flag ${flag}`);
        }
    }

    for (let key in expectedMemory) {
        assertEqual(expectedMemory[key], currentCpu.memory.read(Number(key)), `memory 0x${Number(key).toString(16)}`);
    }
}
 
export function setupTest(
    opcode: number[],
    registers?: { [key in keyof typeof Register]?: number },
    memory?: { [index: number]: number },
): CPU[] {
    let cpu = new CPU();
    cpu.memory.hasBoot = true;
    cpu.registers.PC = 0x100;
    
    for (const [index, value] of opcode.entries()) {
        cpu.memory.externalRom[cpu.registers.PC + index] = value & 0xFF;
    }

    for (let register in registers) {
        cpu.registers[register] = registers[register];
    }

    for (let key in memory) {
        cpu.memory.write(Number(key), memory[key]);
    }

    return [cpu, cpu.snapshot()]
}