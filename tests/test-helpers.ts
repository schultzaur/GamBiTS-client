import { CPU, Flag, Flags, Register, Registers } from './../src/modules/cpu.js';

export function assertEqual(
    expected: number | boolean,
    actual: number | boolean,
    name: string
) {
    if (typeof expected === "number") {
        if (expected != actual) {
            throw new Error(`Unexpected value for <${name}>. Expected: <0x${expected.toString(16)}>, actual: <0x${actual.toString(16)}>.`);
        }
    } else if (typeof expected === "boolean") {
        if (expected != actual) {
            throw new Error(`Unexpected value for <${name}>. Expected: <0x${expected}>, actual: <0x${actual}>.`);
        }
    }
}

export function assertState(
    currentCpu: CPU,
    previousCpu: CPU,
    expectedPC: number,
    expectedCycles: number,
    expectedRegisters: { [key in keyof typeof Register]?: number },
    expectedFlags: { [key in keyof typeof Flag]?: boolean },
    expectedMemory: { [index: number]: number },
) {
    assertEqual(expectedCycles, currentCpu.timer - previousCpu.timer, `elapsed cycles`);
    assertEqual(expectedPC, currentCpu.registers.PC, `PC`);

    for (let register of Registers) {
        if (register == Register.PC) {
            continue;
        }

        if (expectedRegisters !== undefined && register in expectedRegisters) {
            assertEqual(expectedRegisters[register], currentCpu.registers[register], `register ${register}`);
        } else if (register != Register.F) {
            assertEqual(previousCpu.registers[register], currentCpu.registers[register], `register ${register}`);
        }
    }

    for (let flag of Flags) {
        if (expectedFlags !== undefined && flag in expectedFlags) {
            assertEqual(expectedFlags[flag], currentCpu.get_flag(flag), `flag ${flag}`);
        } else {
            assertEqual(previousCpu.get_flag(flag), currentCpu.get_flag(flag), `flag ${flag}`);
        }
    }

    for (let key in expectedMemory) {
        assertEqual(expectedMemory[key], currentCpu.memory.read(Number(key)), `memory 0x${Number(key).toString(16)}`);
    }
}

export function setupTest(
    opcode: number[],
    registers: { [key in keyof typeof Register]?: number },
    flags: { [key in keyof typeof Flag]?: boolean },
    memory: { [index: number]: number },
): CPU[] {
    let cpu = new CPU();
    cpu.memory.hasBoot = true;
    cpu.memory.write(0x0000, 0x0A);
    cpu.registers.PC = 0x100;
    
    for (const [index, value] of opcode.entries()) {
        cpu.memory.externalRom[cpu.registers.PC + index] = value & 0xFF;
    }

    for (let register of Registers) {
        if (register in registers) {
            cpu.registers[register] = registers[register];
        }
    }
    for (let flag of Flags) {
        if (flag in flags) {
            cpu.set_flag(flag, flags[flag]);
        }
    }

    for (let key in memory) {
        cpu.memory.write(Number(key), memory[key]);
    }

    return [cpu, cpu.snapshot()]
}