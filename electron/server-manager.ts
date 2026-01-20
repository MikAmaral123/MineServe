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
    private players: Set<string> = new Set();

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

    getServerDetails() {
        if (!this.serverDir) return null;

        let type = 'unknown';
        let version = null;

        // 1. Try mineserve.json
        try {
            const metaPath = path.join(this.serverDir, 'mineserve.json');
            if (fs.existsSync(metaPath)) {
                const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                if (meta.type) type = meta.type;
                if (meta.version) version = meta.version;
                return { type, version };
            }
        } catch (e) { }

        // 2. Sniff File System
        if (fs.existsSync(path.join(this.serverDir, 'fabric-server-launch.jar'))) {
            type = 'fabric';
        } else if (fs.existsSync(path.join(this.serverDir, 'papermc.jar')) || fs.existsSync(path.join(this.serverDir, 'paper.yml'))) {
            type = 'paper'; // Modrinth uses "paper" or "bukkit"
        } else if (fs.existsSync(path.join(this.serverDir, 'spigot.yml'))) {
            type = 'spigot';
        } else if (fs.existsSync(path.join(this.serverDir, 'server.properties'))) {
            // Likely vanilla if nothing else matches
            type = 'vanilla';
        }

        return { type, version };
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

        // Notify frontend that properties have been updated
        if (this.window) {
            this.window.webContents.send('properties-updated', props);
        }
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
        this.players.clear();
        this.notifyPlayersUpdate();

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
            const chunk = data.toString();
            // Process each line individually to ensure regex matches correctly
            const lines = chunk.split('\n');

            lines.forEach((line: string) => {
                if (!line.trim()) return; // Skip empty lines

                this.log(line);

                // Player detection - multiple formats for different server types
                // Vanilla/Paper: "[HH:MM:SS] [Server thread/INFO]: PlayerName joined the game"
                // Fabric: "[HH:MM:SS] [Server thread/INFO] (Minecraft) PlayerName joined the game"
                // Also handle: "PlayerName[/IP:PORT] logged in with entity id"

                // Join detection patterns
                const joinPatterns = [
                    /: (\w+) joined the game/,           // Vanilla/Paper
                    /\] (\w+) joined the game/,           // Fabric variant
                    /(\w+)\[\/[\d.:]+\] logged in/,       // "Player[/ip:port] logged in"
                    /UUID of player (\w+) is/,            // UUID announcement (player connecting)
                ];

                let foundJoin = false;
                for (const pattern of joinPatterns) {
                    const match = line.match(pattern);
                    if (match && match[1]) {
                        const playerName = match[1];
                        if (!this.players.has(playerName)) {
                            this.players.add(playerName);
                            this.notifyPlayersUpdate();
                            // console.log(`[MineServe] Player joined: ${playerName}`);
                        }
                        foundJoin = true;
                        break;
                    }
                }

                if (!foundJoin) {
                    // Leave detection patterns
                    const leavePatterns = [
                        /: (\w+) left the game/,              // Vanilla/Paper
                        /\] (\w+) left the game/,             // Fabric variant
                        /(\w+) lost connection:/,             // "Player lost connection: reason"
                    ];

                    for (const pattern of leavePatterns) {
                        const match = line.match(pattern);
                        if (match && match[1]) {
                            const playerName = match[1];
                            if (this.players.has(playerName)) {
                                this.players.delete(playerName);
                                this.notifyPlayersUpdate();
                                // console.log(`[MineServe] Player left: ${playerName}`);
                            }
                            break;
                        }
                    }
                }

                if (line.includes('Done') && line.includes('!')) {
                    this.notifyStatus('online');
                }
            });
        });

        this.process.stderr?.on('data', (data) => {
            this.log(data.toString(), 'error');
        });

        this.process.on('close', (code) => {
            this.log(`Server stopped with code ${code}`);
            this.process = null;
            this.notifyStatus('offline');
            this.players.clear();
            this.notifyPlayersUpdate();
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

    // Admin Commands
    kickPlayer(player: string, reason: string) {
        this.sendCommand(`kick ${player} ${reason}`);
    }

    banPlayer(player: string, reason: string, duration?: string) {
        // Vanilla doesn't support tempban easily without plugins, but we can try vanilla ban
        // If "duration" is passed, it might be for Essentials, but vanilla is just "ban <target> [reason]"
        this.sendCommand(`ban ${player} ${reason}`);
    }

    opPlayer(player: string) {
        this.sendCommand(`op ${player}`);
    }

    deopPlayer(player: string) {
        this.sendCommand(`deop ${player}`);
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

    private notifyPlayersUpdate() {
        if (this.window) {
            // Send both count and list
            this.window.webContents.send('player-count-update', this.players.size);
            this.window.webContents.send('player-list-update', Array.from(this.players));
        }
    }
}
