import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { ServerManager } from './server-manager'
import { SetupManager } from './setup-manager'
import { BackupManager } from './backup-manager'
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

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#0f0f13',
        frame: false,
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
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(createWindow)

// Window Controls
ipcMain.on('minimize-window', () => win?.minimize())
ipcMain.on('maximize-window', () => win?.isMaximized() ? win.unmaximize() : win?.maximize())
ipcMain.on('close-window', () => win?.close())

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
ipcMain.on('send-command', (_, cmd) => serverManager.sendCommand(cmd))

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
        await setupManager.downloadServer(config.type, config.version, config.path)
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
