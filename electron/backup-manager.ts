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
        if (!this.serverDir) {
            this.log('Backup failed: No server directory selected', 'error');
            return;
        }

        this.log('Creating backup...');
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = name ? `${name}-${timestamp}.zip` : `backup-${timestamp}.zip`;
            const zip = new AdmZip();

            // Add local files
            const files = fs.readdirSync(this.serverDir);
            let addedCount = 0;
            let skippedCount = 0;

            for (const file of files) {
                if (file === 'backups') continue; // Skip backups folder

                try {
                    const filePath = path.join(this.serverDir, file);
                    // Use simple check, assume file if stat fails or just try adding
                    // AdmZip addLocalFile/Folder are synchronous
                    const stat = fs.statSync(filePath);

                    if (stat.isDirectory()) {
                        zip.addLocalFolder(filePath, file);
                    } else {
                        zip.addLocalFile(filePath);
                    }
                    addedCount++;
                } catch (e) {
                    console.error(`Skipping file ${file}:`, e);
                    skippedCount++;
                }
            }

            const backupPath = path.join(this.backupDir, fileName);
            zip.writeZip(backupPath);

            if (fs.existsSync(backupPath)) {
                this.log(`Backup created: ${fileName} (${addedCount} files, ${skippedCount} skipped)`, 'success');
                return fileName;
            } else {
                throw new Error('Backup file was not created');
            }
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
