import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { ServerManager } from './server-manager'
import { SetupManager } from './setup-manager'
import { BackupManager } from './backup-manager'
import { ModrinthClient } from './modrinth-client'
import fs from 'fs'
import { autoUpdater } from 'electron-updater'

// Configure Auto Updater
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
const serverManager = new ServerManager()
const setupManager = new SetupManager()
const backupManager = new BackupManager()
const modrinthClient = new ModrinthClient()

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#0f0f13',
        frame: false,
        maximizable: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    })

    serverManager.setWindow(win)
    setupManager.setWindow(win)
    backupManager.setWindow(win)

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(__dirname, '../index.html'))
    }

    win.webContents.on('did-finish-load', () => {
        const dir = serverManager.getServerDir();
        if (dir) {
            backupManager.setServerDir(dir);
            win?.webContents.send('server-dir-selected', dir);
        }
    });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })
}

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(() => {
    // Load persisted config
    serverManager.loadConfig(app.getPath('userData'));
    createWindow();
});

// Window Controls
ipcMain.on('minimize-window', () => win?.minimize())
ipcMain.on('maximize-window', () => win?.isMaximized() ? win.unmaximize() : win?.maximize())
ipcMain.on('close-window', () => win?.close())

ipcMain.handle('get-saved-dir', () => {
    return serverManager.getServerDir();
});

// Server Controls
ipcMain.on('select-server-dir', async () => {
    const result = await dialog.showOpenDialog(win!, {
        properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
        const dir = result.filePaths[0]
        serverManager.setServerDir(dir)
        backupManager.setServerDir(dir)
        win?.webContents.send('server-dir-selected', dir)
    }
})

ipcMain.on('start-server', () => serverManager.start())
ipcMain.on('stop-server', () => serverManager.stop())
ipcMain.on('restart-server', () => serverManager.restart())
ipcMain.on('send-command', (_, cmd) => serverManager.sendCommand(cmd))
ipcMain.on('get-players', () => {
    win?.webContents.send('player-list-update', serverManager.getPlayers())
})
ipcMain.on('kick-player', (_, { player, reason }) => serverManager.kickPlayer(player, reason))
ipcMain.on('ban-player', (_, { player, reason, duration }) => serverManager.banPlayer(player, reason, duration))
ipcMain.on('op-player', (_, player) => serverManager.opPlayer(player))
ipcMain.on('deop-player', (_, player) => serverManager.deopPlayer(player))

ipcMain.handle('get-properties', () => serverManager.getProperties())
ipcMain.on('save-properties', (_, props) => serverManager.saveProperties(props))

// Setup Controls
ipcMain.handle('select-setup-dir', async () => {
    const result = await dialog.showOpenDialog(win!, {
        properties: ['openDirectory', 'createDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0]
    }
    return null
})

ipcMain.handle('install-server', async (_, config) => {
    setupManager.setWindow(win!)
    try {
        await setupManager.downloadServer(config.type, config.version, config.path, config.bedrock)
        serverManager.setServerDir(config.path) // Auto-link server
        backupManager.setServerDir(config.path)
        return true
    } catch (e) {
        return false
    }
})

// Backup & Reset
ipcMain.on('configure-backup', (_, config) => {
    backupManager.configureAutoBackup(config.enabled, config.interval)
})

ipcMain.on('trigger-backup', () => {
    backupManager.createBackup('manual')
})

ipcMain.handle('reset-server', async () => {
    // Stop server first
    serverManager.stop()

    // Simplistic reset: delete server dir content except backups
    // We need to know server dir. Assuming serverManager has it or we pass it.
    // Let's rely on serverManager's state or pass it from frontend if needed.
    // Better: Helper in ServerManager to get dir.
    // For now we assume we access the global one set in setup/select.
    // We should probably expose serverDir in serverManager.
    // Quick fix: user serverManager.serverDir if public, or add getter.
    // Since it is private, let's add a getter or public property in next step.
    // For this Turn, I'll assumme I can access it or I'll add a getter next.
    // Actually, I can't access private property. I will modify ServerManager to allow getting dir.
    // WAIT, I can just use the path from frontend? No, security.
    // I will add getDir() to ServerManager.
    const dir = serverManager.getServerDir();
    if (!dir) return false;

    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (file === 'backups') continue;
            const fullPath = path.join(dir, file);
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
        return true;
    } catch (error) {
        console.error('Reset failed:', error);
        return false;
    }
})


// Addons / Plugins
ipcMain.handle('get-server-details', () => serverManager.getServerDetails());

ipcMain.handle('search-addons', async (_, query) => {
    try {
        const details = serverManager.getServerDetails();
        const results = await modrinthClient.searchPlugins(query, 20, {
            type: details?.type || 'unknown',
            version: details?.version // undefined is fine, client handles it
        });
        return { success: true, results: results.hits, serverType: details?.type };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('install-addon', async (_, { slug }) => {
    const dir = serverManager.getServerDir();
    if (!dir) return { success: false, error: 'No server directory linked' };

    try {
        // Get server details to determine correct loaders
        const details = serverManager.getServerDetails();

        // Map server type to Modrinth loaders
        let loaders: string[] = ['paper', 'spigot', 'bukkit']; // default for plugins
        if (details?.type === 'fabric') {
            loaders = ['fabric'];
        } else if (details?.type === 'forge') {
            loaders = ['forge'];
        } else if (details?.type === 'quilt') {
            loaders = ['quilt'];
        }

        // Get game version if available
        const gameVersions = details?.version ? [details.version] : undefined;

        // Fetch latest version compatible with this server
        const version = await modrinthClient.getLatestVersion(slug, loaders, gameVersions);
        if (!version) return { success: false, error: 'No compatible version found' };

        // Install to correct folder (mods for fabric, plugins for paper/spigot)
        const fileName = await modrinthClient.installPlugin(version, dir, details?.type);
        return { success: true, fileName };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
});

// --- Auto Update Handlers ---
ipcMain.handle('check-for-updates', async () => {
    if (!app.isPackaged) {
        return { status: 'dev-mode', message: 'Updates not available in dev mode' };
    }
    try {
        const result = await autoUpdater.checkForUpdates();
        return result;
    } catch (error: any) {
        return { status: 'error', message: error.message };
    }
});

ipcMain.handle('download-update', () => {
    return autoUpdater.downloadUpdate();
});

// --- Update Events ---
autoUpdater.on('checking-for-update', () => {
    win?.webContents.send('update-status', { status: 'checking' });
});

ipcMain.handle('select-file', async (_, type) => {
    const filters = type === 'icon'
        ? [{ name: 'PNG Image', extensions: ['png'] }]
        : [{ name: 'Zip Archive', extensions: ['zip'] }];

    const result = await dialog.showOpenDialog(win!, {
        properties: ['openFile'],
        filters
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('upload-server-file', async (_, { type, filePath }) => {
    const dir = serverManager.getServerDir();
    if (!dir) return { success: false, error: 'No server directory linked' };
    if (!fs.existsSync(filePath)) return { success: false, error: 'File not found' };

    try {
        if (type === 'icon') {
            const destPath = path.join(dir, 'server-icon.png');
            const { nativeImage } = require('electron');
            const image = nativeImage.createFromPath(filePath);
            const resized = image.resize({ width: 64, height: 64 });
            fs.writeFileSync(destPath, resized.toPNG());
            return { success: true };
        }
        return { success: false, error: 'Unknown type' };
    } catch (error: any) {
        console.error('Upload failed:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-server-files-status', async () => {
    const dir = serverManager.getServerDir();
    if (!dir) return { icon: null, hasResourcePack: false };

    let icon = null;
    const iconPath = path.join(dir, 'server-icon.png');
    if (fs.existsSync(iconPath)) {
        const { nativeImage } = require('electron');
        icon = nativeImage.createFromPath(iconPath).toDataURL();
    }

    const hasResourcePack = fs.existsSync(path.join(dir, 'resources.zip'));

    return { icon, hasResourcePack };
});

ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall();
});

autoUpdater.on('update-available', (info) => {
    win?.webContents.send('update-status', { status: 'available', info });
});

autoUpdater.on('update-not-available', (info) => {
    win?.webContents.send('update-status', { status: 'not-available', info });
});

autoUpdater.on('error', (err) => {
    win?.webContents.send('update-status', { status: 'error', error: err.message });
});

autoUpdater.on('download-progress', (progressObj) => {
    win?.webContents.send('update-status', { status: 'downloading', progress: progressObj });
});

autoUpdater.on('update-downloaded', (info) => {
    win?.webContents.send('update-status', { status: 'downloaded', info });
});


