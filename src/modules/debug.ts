import { CPU, Register, Flag } from "./cpu";

export interface Debug {
    registerAF: HTMLInputElement,
    registerBC: HTMLInputElement,
    registerDE: HTMLInputElement,
    registerHL: HTMLInputElement,
    registerSP: HTMLInputElement,
    registerPC: HTMLInputElement,
    flagZ: HTMLInputElement,
    flagN: HTMLInputElement,
    flagH: HTMLInputElement,
    flagC: HTMLInputElement,
    spView?: null,
    pcView?: null,
    ioView?: null,
}

export function updateDebug(cpu: CPU, debug: Debug) {
    debug.registerAF.value = formatRegister(cpu, Register.A, Register.F);
    debug.registerBC.value = formatRegister(cpu, Register.B, Register.C);
    debug.registerDE.value = formatRegister(cpu, Register.D, Register.E);
    debug.registerHL.value = formatRegister(cpu, Register.H, Register.L);
    debug.registerSP.value = formatRegister(cpu, Register.SP);
    debug.registerPC.value = formatRegister(cpu, Register.PC);

    debug.flagZ.checked = cpu.get_flag(Flag.Z);
    debug.flagN.checked = cpu.get_flag(Flag.N);
    debug.flagH.checked = cpu.get_flag(Flag.H);
    debug.flagC.checked = cpu.get_flag(Flag.C);
}

function formatRegister(cpu: CPU, registerH: Register, registerL?: Register): string
{
    let value: Number = 
        registerL !== undefined
            ? (cpu.registers[registerH] << 8) + cpu.registers[registerL]
            : cpu.registers[registerH];

    return "0x" + ("0000" + value.toString(16)).slice(-4);
}
