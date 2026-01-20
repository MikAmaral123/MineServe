// Basic IPC interface types
interface IElectronAPI {
    selectServerDir: () => void;
    startServer: () => void;
    stopServer: () => void;
    sendCommand: (cmd: string) => void;
    onConsoleLog: (callback: (data: any) => void) => void;
    onServerStatus: (callback: (status: string) => void) => void;
    onServerDirSelected: (callback: (dir: string) => void) => void;
}

// Since we have nodeIntegration: true and contextIsolation: false for this prototype,
// we can also use window.require('electron') in the renderer.
// But for type safety, let's keep this file simple or add a d.ts in src.
