import { Minus, Square, X } from 'lucide-react';
// import { electronAPI } from '../electron/preload'; // We need to mock this or type it properly

const TitleBar = () => {
    const handleMinimize = () => {
        // window.electronAPI.minimize();
        // Temporary direct IPC call (requires nodeIntegration: true in main process for now)
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('minimize-window');
    };

    const handleMaximize = () => {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('maximize-window');
    };

    const handleClose = () => {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('close-window');
    };

    return (
        <div className="h-10 bg-card/50 backdrop-blur-md flex items-center justify-between px-3 select-none drag-region border-b border-glass-border">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent-primary animate-pulse" />
                <span className="text-xs font-medium tracking-wider text-gray-400">MINESERVE</span>
            </div>
            <div className="flex items-center gap-2 no-drag-region">
                <button
                    onClick={handleMinimize}
                    className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-gray-400 hover:text-white"
                >
                    <Minus size={14} />
                </button>
                <button
                    onClick={handleMaximize}
                    className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-gray-400 hover:text-white"
                >
                    <Square size={12} />
                </button>
                <button
                    onClick={handleClose}
                    className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors text-gray-400"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
