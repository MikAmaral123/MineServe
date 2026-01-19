import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { BrowserWindow } from 'electron';
import fs from 'fs';

export class ServerManager {
    private process: ChildProcess | null = null;
    private serverDir: string = '';
    private jarName: string = 'server.jar';
    private window: BrowserWindow | null = null;
    private configPath: string = '';
    private propertiesPath: string = '';
    private currentPlayers: number = 0;

    constructor() { }

    loadConfig(userDataPath: string) {
        this.configPath = path.join(userDataPath, 'config.json');
        if (fs.existsSync(this.configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                if (config.serverDir && fs.existsSync(config.serverDir)) {
                    this.serverDir = config.serverDir;
                    this.propertiesPath = path.join(this.serverDir, 'server.properties');
                }
            } catch (e) {
                console.error('Failed to load config', e);
            }
        }
    }

    setWindow(win: BrowserWindow) {
        this.window = win;
    }

    setServerDir(dir: string) {
        this.serverDir = dir;
        this.propertiesPath = path.join(dir, 'server.properties');

        // Save to config
        if (this.configPath) {
            try {
                fs.writeFileSync(this.configPath, JSON.stringify({ serverDir: dir }));
            } catch (e) {
                console.error('Failed to save config', e);
            }
        }
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

        // Reset player count on start
        this.currentPlayers = 0;
        this.notifyPlayerCount();

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

            // Player detection logic
            if (line.includes('joined the game')) {
                this.currentPlayers++;
                this.notifyPlayerCount();
            } else if (line.includes('left the game') || line.includes('lost connection')) {
                this.currentPlayers = Math.max(0, this.currentPlayers - 1);
                this.notifyPlayerCount();
            }

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
            this.currentPlayers = 0;
            this.notifyPlayerCount();
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

    private notifyPlayerCount() {
        if (this.window) {
            this.window.webContents.send('player-count-update', this.currentPlayers);
        }
    }
}
