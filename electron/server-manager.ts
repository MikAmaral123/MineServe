import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { BrowserWindow } from 'electron';
import fs from 'fs';

export class ServerManager {
    private process: ChildProcess | null = null;
    private serverDir: string = '';
    private jarName: string = 'server.jar';
    private window: BrowserWindow | null = null;
    private propertiesPath: string = '';

    constructor() { }

    setWindow(win: BrowserWindow) {
        this.window = win;
    }

    setServerDir(dir: string) {
        this.serverDir = dir;
        this.propertiesPath = path.join(dir, 'server.properties');
    }

    getServerDir() {
        return this.serverDir;
    }

    getProperties(): Record<string, string> {
        if (!fs.existsSync(this.propertiesPath)) return {};

        const content = fs.readFileSync(this.propertiesPath, 'utf8');
        const props: Record<string, string> = {};

        content.split('\n').forEach(line => {
            if (line.trim().startsWith('#') || !line.includes('=')) return;
            const [key, ...valueParts] = line.split('=');
            props[key.trim()] = valueParts.join('=').trim();
        });

        return props;
    }

    saveProperties(props: Record<string, string>) {
        if (!this.serverDir) return;

        // Read existing file to preserve comments if possible, but for now simple overwrite
        // Actually, let's try to preserve header
        let content = '#Minecraft server properties\n#' + new Date().toString() + '\n';

        Object.entries(props).forEach(([key, value]) => {
            content += `${key}=${value}\n`;
        });

        fs.writeFileSync(this.propertiesPath, content);
        this.log('Server properties saved');
    }

    start() {
        if (this.process) return;
        if (!this.serverDir) {
            this.log('Error: Server directory not set');
            return;
        }

        const jarPath = path.join(this.serverDir, this.jarName);
        if (!fs.existsSync(jarPath)) {
            this.log(`Error: ${this.jarName} not found in ${this.serverDir}`);
            return;
        }

        this.log('Starting server...');
        this.notifyStatus('starting');

        // Check if eula.txt exists and is true
        const eulaPath = path.join(this.serverDir, 'eula.txt');
        if (!fs.existsSync(eulaPath) || !fs.readFileSync(eulaPath, 'utf8').includes('eula=true')) {
            this.log('Warning: accepting EULA automatically...');
            fs.writeFileSync(eulaPath, 'eula=true');
        }

        this.process = spawn('java', ['-Xmx2G', '-Xms1G', '-jar', this.jarName, 'nogui'], {
            cwd: this.serverDir,
        });

        this.process.stdout?.on('data', (data) => {
            const line = data.toString();
            this.log(line);
            if (line.includes('Done') && line.includes('!')) {
                this.notifyStatus('online');
            }
        });

        this.process.stderr?.on('data', (data) => {
            this.log(data.toString(), 'error');
        });

        this.process.on('close', (code) => {
            this.log(`Server stopped with code ${code}`);
            this.process = null;
            this.notifyStatus('offline');
        });
    }

    stop() {
        if (this.process) {
            this.log('Stopping server...');
            this.notifyStatus('stopping');
            this.process.stdin?.write('stop\n');
        }
    }

    sendCommand(cmd: string) {
        if (this.process && this.process.stdin) {
            this.process.stdin.write(cmd + '\n');
            this.log(`> ${cmd}`);
        } else {
            this.log('Error: Server not running');
        }
    }

    private log(message: string, type: 'info' | 'error' = 'info') {
        if (this.window) {
            this.window.webContents.send('console-log', { message: message.trim(), type, timestamp: new Date().toLocaleTimeString() });
        }
    }

    private notifyStatus(status: string) {
        if (this.window) {
            this.window.webContents.send('server-status', status);
        }
    }
}
