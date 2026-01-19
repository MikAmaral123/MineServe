import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { BrowserWindow } from 'electron';

export class BackupManager {
    private serverDir: string = '';
    private backupDir: string = '';
    private window: BrowserWindow | null = null;
    private autoBackupInterval: NodeJS.Timeout | null = null;

    constructor() { }

    setWindow(win: BrowserWindow) {
        this.window = win;
    }

    setServerDir(dir: string) {
        this.serverDir = dir;
        this.backupDir = path.join(dir, 'backups');
        if (dir && !fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async createBackup(name?: string) {
        if (!this.serverDir) return;

        this.log('Creating backup...');
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = name ? `${name}-${timestamp}.zip` : `backup-${timestamp}.zip`;
            const zip = new AdmZip();

            // Add local files
            const files = fs.readdirSync(this.serverDir);
            for (const file of files) {
                if (file === 'backups') continue; // Skip backups folder
                const filePath = path.join(this.serverDir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    zip.addLocalFolder(filePath, file);
                } else {
                    zip.addLocalFile(filePath);
                }
            }

            const backupPath = path.join(this.backupDir, fileName);
            zip.writeZip(backupPath);

            this.log(`Backup created: ${fileName}`, 'success');
            return fileName;
        } catch (error: any) {
            this.log(`Backup failed: ${error.message}`, 'error');
            throw error;
        }
    }

    configureAutoBackup(enabled: boolean, intervalMinutes: number) {
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
            this.autoBackupInterval = null;
        }

        if (enabled && intervalMinutes > 0) {
            this.log(`Auto-backup enabled every ${intervalMinutes} minutes`);
            this.autoBackupInterval = setInterval(() => {
                this.createBackup('auto');
            }, intervalMinutes * 60 * 1000);
        } else {
            this.log('Auto-backup disabled');
        }
    }

    private log(message: string, type: 'info' | 'error' | 'success' = 'info') {
        if (this.window) {
            this.window.webContents.send('backup-log', { message, type, timestamp: new Date().toLocaleTimeString() });
        }
    }
}
