import { CPU, Flag, Flags, Register, Registers } from '../src/modules/cpu';

export function assertEqual(
    expected: number,
    actual: number,
    name: string
) {
    if (expected != actual)
    {
        throw new Error(`Unexpected value for <${name}>. Expected: <${expected}>, actual: <${actual}>.`);
    }
}

export function assertState(
    currentCpu: CPU,
    previousCpu: CPU,
    expectedRegisters: { [key in keyof typeof Register]?: number },
    expectedFlags: { [key in keyof typeof Flag]?: number },
    _expectedMemory: { [Key: string]: number }
) {
    for (var register of Registers) {
        if (register in expectedRegisters) {
            assertEqual(expectedRegisters[register], currentCpu.registers[register], `register ${flag}`);
        } else {
            assertEqual(previousCpu.registers[register], currentCpu.registers[register], `register ${flag}`);
        }
    }

    for (var flag of Flags) {
        if (flag in expectedFlags) {
            assertEqual(expectedFlags[flag], currentCpu.flags[flag], `flag ${flag}`);
        } else {
            assertEqual(previousCpu.flags[flag], currentCpu.flags[flag], `flag ${flag}`);
        }
    }

    // expectedMemory.Keys().forEach((value: number, key: string) => {
    //     assertEqual(cpu.?[key], value, `memory ${key}`);
    // });
}
 