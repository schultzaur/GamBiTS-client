import { CPU, Z_true } from './modules/cpu.js';
import { Debug, updateDebug } from './modules/debug.js';

declare global {
    interface Window { 
        GamBiTS2: { 
            cpu: CPU,
            canvas: HTMLCanvasElement,
            debug: Debug,
            running: boolean,
        }
    }
}

export function create(
    gameId,
    gameScreenId,
    gameControlsId,
    deubgId,
    debugRegistersId,
    debugSpId,
    debugPcId,
    debugIoId) {

    let canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = 160;
    canvas.height = 144;
    document.getElementById(gameScreenId).appendChild(canvas);
    
    let context = canvas.getContext("2d") as CanvasRenderingContext2D;

    let image = new Image();
    image.src = "https://i.imgur.com/QHLgMGL.png";
    image.onload = () => {
        context.drawImage(image, -40, 10);
    }
    
    var cpu = new CPU(canvas);
    window.GamBiTS2 = {
        cpu: cpu,
        canvas: canvas,
        debug: {
            registerAF: document.getElementById("debug-registers-AF") as HTMLInputElement,
            registerBC: document.getElementById("debug-registers-BC") as HTMLInputElement,
            registerDE: document.getElementById("debug-registers-DE") as HTMLInputElement,
            registerHL: document.getElementById("debug-registers-HL") as HTMLInputElement,
            registerSP: document.getElementById("debug-registers-SP") as HTMLInputElement,
            registerPC: document.getElementById("debug-registers-PC") as HTMLInputElement,
            flagZ: document.getElementById("debug-flags-Z") as HTMLInputElement,
            flagN: document.getElementById("debug-flags-N") as HTMLInputElement,
            flagH: document.getElementById("debug-flags-H") as HTMLInputElement,
            flagC: document.getElementById("debug-flags-C") as HTMLInputElement,
        },
        running: false,
    }

    document.getElementById("fileInput").addEventListener("change", (e:Event) => loadFile())
    document.getElementById("step0x1Button").addEventListener("click", (e:Event) => step(0x1))
    document.getElementById("step0x10Button").addEventListener("click", (e:Event) => step(0x10))
    document.getElementById("step0x100Button").addEventListener("click", (e:Event) => step(0x100))
    document.getElementById("step0x1000Button").addEventListener("click", (e:Event) => step(0x1000))
    document.getElementById("startButton").addEventListener("click", async (e:Event) => await start())
    document.getElementById("stopButton").addEventListener("click", (e:Event) => stop())
    document.getElementById("skipBootButton").addEventListener("click", (e:Event) => skipBoot())
    document.getElementById("frameButton").addEventListener("click", (e:Event) => runUntilNextFrame())

    document.addEventListener('keydown', (e: Event) => keyDownHandler(event as KeyboardEvent), false);
    document.addEventListener('keyup', (e: Event) => keyUpHandler(event as KeyboardEvent), false);
}

function loadFile() {
    var fileInput =  window.document.getElementById("fileInput") as HTMLInputElement; 
    var file = fileInput.files[0];
    var fileReader = new FileReader();
    fileReader.onload = loadEmulatorROM;
    fileReader.readAsArrayBuffer(file);

    function loadEmulatorROM() {
        window.GamBiTS2.cpu = new CPU(window.GamBiTS2.canvas);
        window.GamBiTS2.cpu.memory.loadRom(new Int8Array(fileReader.result as ArrayBuffer));
        updateDebug(window.GamBiTS2.cpu, window.GamBiTS2.debug);        
    }
}

function step(n) {
    for (var i = 0; i < n; i++) {
        window.GamBiTS2.cpu.step();
    }
        
    updateDebug(window.GamBiTS2.cpu, window.GamBiTS2.debug);
}

function start() {
    window.GamBiTS2.running = true;

    startInternal();
}

function startInternal() {
    if (window.GamBiTS2.running) {
        for(let i = 0; i < 50000; i++)
        {
            window.GamBiTS2.cpu.step();

            if (window.GamBiTS2.cpu.break) {
                window.GamBiTS2.cpu.break = false;
                updateDebug(window.GamBiTS2.cpu, window.GamBiTS2.debug);
                return;
            }
        }
            
        setTimeout(startInternal, 0);
    }
}

function runUntilNextFrame() {
    let startingFrame = window.GamBiTS2.cpu.display.frameCount;

    while (window.GamBiTS2.cpu.display.frameCount < startingFrame + 1) {
        window.GamBiTS2.cpu.step();
    }
}

async function stop() {
    window.GamBiTS2.running = false;
    updateDebug(window.GamBiTS2.cpu, window.GamBiTS2.debug);
}

function skipBoot() {
    window.GamBiTS2.cpu.memory.hasBoot = true;
    updateDebug(window.GamBiTS2.cpu, window.GamBiTS2.debug);
}

function keyDownHandler(event: KeyboardEvent) {
    window.GamBiTS2.cpu.joypad.keyDownHandler(event);
}
function keyUpHandler(event: KeyboardEvent) {
    window.GamBiTS2.cpu.joypad.keyUpHandler(event);
}