import { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import { Play, Square, Activity, Users, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from './lib/utils';
import ServerConfig from './components/ServerConfig';
import WelcomeWizard from './components/WelcomeWizard';
import Settings from './components/Settings';
import Updates from './components/Updates';
import Addons from './components/Addons';
import Players from './components/Players';
import DashboardConsole from './components/DashboardConsole';
import { useTranslation } from 'react-i18next';

// Electron IPC
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: { on: () => { }, send: () => { }, invoke: async () => ({}) } };

type LogEntry = {
    message: string;
    type: 'info' | 'error';
    timestamp: string;
};

function App() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [serverStatus, setServerStatus] = useState<'offline' | 'starting' | 'online' | 'stopping'>('offline');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [serverDir, setServerDir] = useState<string>('');
    const [maxPlayers, setMaxPlayers] = useState<string>('-');
    const [currentPlayers, setCurrentPlayers] = useState<number>(0);

    useEffect(() => {
        ipcRenderer.invoke('get-saved-dir').then((dir: any) => {
            if (dir) {
                setServerDir(dir);
                fetchMaxPlayers();
            }
        });

        ipcRenderer.on('server-status', (_: any, status: any) => setServerStatus(status));
        ipcRenderer.on('server-dir-selected', (_: any, dir: any) => {
            setServerDir(dir);
            fetchMaxPlayers();
        });

        ipcRenderer.on('player-count-update', (_: any, count: number) => setCurrentPlayers(count));

        ipcRenderer.on('console-log', (_: any, log: LogEntry) => {
            setLogs(prev => [...prev.slice(-100), log]);
        });

        if (serverDir) fetchMaxPlayers();

        return () => {
            ipcRenderer.removeAllListeners('server-status');
            ipcRenderer.removeAllListeners('console-log');
            ipcRenderer.removeAllListeners('server-dir-selected');
            ipcRenderer.removeAllListeners('player-count-update');
        };
    }, []);

    const fetchMaxPlayers = async () => {
        try {
            const props = await ipcRenderer.invoke('get-properties');
            if (props && props['max-players']) {
                setMaxPlayers(props['max-players']);
            }
        } catch (e) {
            console.error("Failed to fetch properties", e);
        }
    };

    // NOTE: Auto-scroll is now handled inside DashboardConsole component
    // Do NOT use scrollIntoView here as it scrolls the entire page

    const handleSelectDir = () => ipcRenderer.send('select-server-dir');
    const handleStart = () => ipcRenderer.send('start-server');
    const handleStop = () => ipcRenderer.send('stop-server');
    const handleCommand = (e: React.FormEvent) => {
        e.preventDefault();
        const input = (e.target as any).command.value;
        if (input) {
            ipcRenderer.send('send-command', input);
            (e.target as any).reset();
        }
    };

    const contentVariants = {
        hidden: { opacity: 0, scale: 0.98, y: 10 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, scale: 0.98, y: -10, transition: { duration: 0.3 } }
    };

    if (!serverDir) {
        return (
            <div className="h-screen flex flex-col font-sans relative overflow-hidden">
                <div className="liquid-bg" />
                <TitleBar />
                <WelcomeWizard onComplete={(path) => setServerDir(path)} />
            </div>
        );
    }

    const tabTitles: Record<string, string> = {
        dashboard: t('dashboard'),
        console: t('console'),
        players: t('players'),
        server: t('server_config'),
        settings: t('settings'),
        updates: t('updates')
    };

    return (
        <div className="h-screen flex flex-col font-sans relative overflow-hidden">
            <div className="liquid-bg" />

            <TitleBar />

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Container */}
                <div className="w-64 p-4 pr-0 flex flex-col">
                    <div className="glass-panel rounded-2xl h-full flex flex-col overflow-hidden">
                        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                </div>

                <main className="flex-1 overflow-hidden p-6 relative flex flex-col">
                    <motion.div
                        key={activeTab}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={contentVariants}
                        className="relative z-10 max-w-7xl mx-auto w-full flex-1 min-h-0 overflow-hidden flex flex-col gap-6"
                    >
                        {/* Header Section */}
                        <header className="flex justify-between items-end shrink-0 mb-2">
                            <div>
                                <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg capitalize">
                                    {tabTitles[activeTab] || activeTab}
                                </h1>
                            </div>

                            <div className="flex gap-3">
                                {!serverDir && (
                                    <button
                                        onClick={handleSelectDir}
                                        className="glass-card px-6 py-2.5 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-2"
                                    >
                                        <FolderOpen size={18} /> {t('select_server')}
                                    </button>
                                )}
                                {serverDir && serverStatus === 'offline' && (
                                    <button
                                        onClick={handleStart}
                                        className="px-6 py-2.5 bg-green-500/80 hover:bg-green-500/90 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] rounded-xl transition-all font-bold flex items-center gap-2 group backdrop-blur-md"
                                    >
                                        <Play size={18} className="fill-current group-hover:scale-110 transition-transform" />
                                        {t('start_server')}
                                    </button>
                                )}
                                {serverStatus !== 'offline' && (
                                    <button
                                        onClick={handleStop}
                                        className={cn(
                                            "px-6 py-2.5 rounded-xl transition-all font-bold flex items-center gap-2 group backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.4)]",
                                            serverStatus === 'stopping'
                                                ? "bg-red-500/50 cursor-wait text-white/50"
                                                : "bg-red-500/80 hover:bg-red-500/90 text-white"
                                        )}
                                        disabled={serverStatus === 'stopping'}
                                    >
                                        <Square size={18} className="fill-current group-hover:scale-110 transition-transform" />
                                        {serverStatus === 'stopping' ? t('stopping') : t('stop_server')}
                                    </button>
                                )}
                            </div>
                        </header>

                        {/* Content Area */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                            {activeTab === 'dashboard' && (
                                <div className="flex flex-col gap-6 h-full p-1 overflow-y-hidden">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 shrink-0">
                                        <StatusCard
                                            title={t('status')}
                                            value={t(serverStatus) || serverStatus.toUpperCase()}
                                            icon={Activity}
                                            color={serverStatus === 'online' ? 'text-green-400' : 'text-gray-400'}
                                            bg={serverStatus === 'online' ? 'bg-green-400/10' : 'bg-white/5'}
                                        />
                                        <StatusCard
                                            title={t('folder')}
                                            value={serverDir ? t('linked') : t('not_set')}
                                            icon={FolderOpen}
                                            color="text-blue-400"
                                            bg="bg-blue-400/10"
                                        />
                                        <StatusCard
                                            title={t('players')}
                                            value={currentPlayers.toString()}
                                            subValue={`/ ${maxPlayers}`}
                                            icon={Users}
                                            color="text-amber-400"
                                            bg="bg-amber-400/10"
                                        />
                                    </div>

                                    {/* Console Wrapper - Takes remaining space */}
                                    <div className="flex-1 min-h-0">
                                        <DashboardConsole logs={logs} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'console' && (
                                <div className="flex flex-col h-full overflow-hidden glass-panel rounded-2xl p-6">
                                    <div className="flex-1 font-mono text-xs text-gray-300 space-y-1 overflow-y-auto custom-scrollbar p-4 bg-black/40 rounded-xl border border-white/5 shadow-inner mb-4">
                                        {logs.map((log, i) => (
                                            <p key={i} className="break-words leading-relaxed">
                                                <span className='text-gray-500 mr-3'>[{log.timestamp}]</span>
                                                <span className={log.type === 'error' ? 'text-red-400' : 'text-gray-200'}>
                                                    {log.message}
                                                </span>
                                            </p>
                                        ))}
                                    </div>
                                    <form onSubmit={handleCommand} className="flex gap-3">
                                        <input
                                            name="command"
                                            type="text"
                                            placeholder="Type a command..."
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600 shadow-inner"
                                            autoComplete="off"
                                        />
                                        <button type="submit" className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/5">
                                            Send
                                        </button>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'players' && <Players />}
                            {activeTab === 'addons' && <Addons />}
                            {activeTab === 'server' && <ServerConfig />}
                            {activeTab === 'settings' && (
                                <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                                    <Settings
                                        version={(window as any).process?.version}
                                        onReset={() => {
                                            setServerDir('');
                                            setServerStatus('offline');
                                            setActiveTab('dashboard');
                                        }}
                                    />
                                </div>
                            )}
                            {activeTab === 'updates' && <Updates />}
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}

const StatusCard = ({ title, value, subValue, icon: Icon, color, bg }: any) => (
    <div className="glass-card rounded-2xl p-6 group relative overflow-hidden">
        <div className={`absolute top-4 right-4 p-3 rounded-xl ${bg} ${color} transition-transform group-hover:scale-110 group-hover:rotate-6`}>
            <Icon size={24} />
        </div>

        <div className="mt-8 relative z-10">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-white tracking-tight drop-shadow-md">{value}</span>
                {subValue && <span className="text-gray-500 text-sm font-medium">{subValue}</span>}
            </div>
        </div>

        {/* Glow effect */}
        <div className={`absolute -bottom-10 -left-10 w-32 h-32 bg-current opacity-5 blur-3xl rounded-full pointer-events-none ${color}`} />
    </div>
)

export default App;
