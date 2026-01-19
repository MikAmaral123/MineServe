import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Server, Folder, Settings, Shield, Check, Download, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

// Mock IPC
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: { invoke: async () => { }, send: () => { }, on: () => { } } };

type SetupProps = {
    onComplete: (path: string) => void;
};

const STEPS = {
    LANGUAGE: 0,
    WELCOME: 1,
    FOLDER: 2,
    TYPE: 3,
    VERSION: 4,
    INSTALL: 5
};

const SERVER_TYPES = [
    { id: 'vanilla', name: 'Vanilla', icon: Server, description: 'Official Minecraft Server', color: 'from-green-400 to-emerald-600' },
    { id: 'spigot', name: 'Paper / Spigot', icon: Settings, description: 'Optimized for Plugins (Performance)', color: 'from-blue-400 to-indigo-600' },
    { id: 'fabric', name: 'Fabric', icon: Shield, description: 'Modded Server (Lightweight)', color: 'from-orange-400 to-red-600' },
];

const TRANSLATIONS: Record<string, any> = {
    en: {
        welcomeTitle: "Create your\nServer.",
        welcomeDesc: "Deploy a high-performance Minecraft instance in seconds. We handle the download, Java setup, and configuration.",
        startBtn: "Start Setup",
        pathTitle: "Installation Path",
        pathDesc: "Choose where your server files will live.",
        browse: "Click to browse folder",
        coreTitle: "Server Core",
        coreDesc: "Select the engine for your server.",
        versionTitle: "Game Version",
        versionDesc: "Which version of Minecraft?",
        installTitle: "Installing Server...",
        installDesc: "Please wait while we set up everything.",
        next: "Next Step",
        back: "Back",
        install: "Install",
        steps: {
            lang: "Language",
            welcome: "Welcome",
            location: "Location",
            type: "Server Type",
            version: "Version"
        }
    },
    fr: {
        welcomeTitle: "Créez votre\nServeur.",
        welcomeDesc: "Déployez une instance Minecraft haute performance en quelques secondes. Nous gérons le téléchargement, Java et la configuration.",
        startBtn: "Commencer",
        pathTitle: "Dossier d'Installation",
        pathDesc: "Choisissez où seront stockés les fichiers du serveur.",
        browse: "Cliquez pour choisir un dossier",
        coreTitle: "Cœur du Serveur",
        coreDesc: "Sélectionnez le moteur de votre serveur.",
        versionTitle: "Version du Jeu",
        versionDesc: "Quelle version de Minecraft ?",
        installTitle: "Installation...",
        installDesc: "Veuillez patienter pendant la configuration.",
        next: "Suivant",
        back: "Retour",
        install: "Installer",
        steps: {
            lang: "Langue",
            welcome: "Bienvenue",
            location: "Dossier",
            type: "Type",
            version: "Version"
        }
    },
    es: {
        welcomeTitle: "Crea tu\nServidor.",
        welcomeDesc: "Despliega una instancia de Minecraft de alto rendimiento en segundos. Nos encargamos de la descarga, Java y la configuración.",
        startBtn: "Empezar",
        pathTitle: "Ruta de Instalación",
        pathDesc: "Elige dónde se guardarán los archivos.",
        browse: "Clic para buscar carpeta",
        coreTitle: "Núcleo del Servidor",
        coreDesc: "Selecciona el motor para tu servidor.",
        versionTitle: "Versión del Juego",
        versionDesc: "¿Qué versión de Minecraft?",
        installTitle: "Instalando...",
        installDesc: "Por favor espera mientras configuramos todo.",
        next: "Siguiente",
        back: "Atrás",
        install: "Instalar",
        steps: {
            lang: "Idioma",
            welcome: "Bienvenido",
            location: "Ubicación",
            type: "Tipo",
            version: "Versión"
        }
    }
};

const WelcomeWizard = ({ onComplete }: SetupProps) => {
    const [step, setStep] = useState(STEPS.LANGUAGE);
    const [lang, setLang] = useState('en');
    const [config, setConfig] = useState({
        path: '',
        type: '',
        version: ''
    });
    const [logs, setLogs] = useState<string[]>([]);

    const t = TRANSLATIONS[lang];

    // Extended versions for 2026 context
    const APP_VERSIONS = [
        '1.21.4', '1.21.0',
        '1.20.6', '1.20.4',
        '1.19.4', '1.18.2',
        '1.16.5', '1.12.2', '1.8.9'
    ];

    const handleSelectDir = async () => {
        const result = await ipcRenderer.invoke('select-setup-dir');
        if (result) setConfig(prev => ({ ...prev, path: result }));
    };

    const handleInstall = async () => {
        setStep(STEPS.INSTALL);
        ipcRenderer.on('setup-log', (_: any, log: any) => {
            setLogs(prev => [...prev, log.message]);
        });

        const success = await ipcRenderer.invoke('install-server', config);
        if (success) {
            onComplete(config.path);
        }
    };

    return (
        <div className="h-screen w-full bg-[#0a0a0f] flex flex-col items-center justify-center p-8 overflow-hidden relative">
            {/* Colorful Animated Background */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-pink-500/10 blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

            <motion.div
                layout
                className="w-full max-w-5xl bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row min-h-[500px]"
            >
                {/* Side Panel */}
                <div className="w-full md:w-1/3 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-8 flex flex-col justify-between border-r border-white/5">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/30 flex items-center justify-center">
                                <Server className="text-white" size={20} />
                            </div>
                            <span className="font-bold text-xl tracking-wide text-white">MineServe</span>
                        </div>
                        <div className="space-y-6">
                            {[
                                { id: STEPS.LANGUAGE, label: t.steps.lang || 'Language', icon: Globe },
                                { id: STEPS.WELCOME, label: t.steps.welcome, icon: Shield },
                                { id: STEPS.FOLDER, label: t.steps.location, icon: Folder },
                                { id: STEPS.TYPE, label: t.steps.type, icon: Settings },
                                { id: STEPS.VERSION, label: t.steps.version, icon: Server },
                            ].map((s, idx) => (
                                <div key={s.id} className={cn(
                                    "flex items-center gap-4 transition-colors",
                                    step === s.id ? "text-white" : step > s.id ? "text-green-400" : "text-white/20"
                                )}>
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                                        step === s.id ? "border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-lg shadow-cyan-500/20" :
                                            step > s.id ? "border-green-500 bg-green-500 text-black border-transparent" : "border-white/10"
                                    )}>
                                        {step > s.id ? <Check size={14} strokeWidth={4} /> : idx + 1}
                                    </div>
                                    <span className="font-medium">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="text-xs text-white/30 mt-8">
                        Setup Wizard v2.1
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {step === STEPS.LANGUAGE && (
                            <motion.div
                                key="language"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="space-y-8 w-full"
                            >
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Select Language</h2>
                                    <p className="text-gray-400">Choose your preferred language.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
                                        { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
                                        { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' }
                                    ].map(l => (
                                        <button
                                            key={l.code}
                                            onClick={() => {
                                                setLang(l.code);
                                                localStorage.setItem('app-language', l.code);
                                                setStep(STEPS.WELCOME);
                                            }}
                                            className="group relative p-4 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/5 transition-all flex items-center gap-4 overflow-hidden"
                                        >
                                            <span className="text-4xl">{l.flag}</span>
                                            <div className="text-left">
                                                <div className="font-bold text-white text-lg">{l.native}</div>
                                                <div className="text-gray-500 text-sm">{l.name}</div>
                                            </div>
                                            <ChevronRight className="ml-auto text-white/20 group-hover:text-cyan-400 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === STEPS.WELCOME && (
                            <motion.div
                                key="welcome"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-start h-full justify-center space-y-6"
                            >
                                <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-blue-200 whitespace-pre-line">
                                    {t.welcomeTitle}
                                </h1>
                                <p className="text-lg text-gray-400 max-w-md">
                                    {t.welcomeDesc}
                                </p>

                                <button
                                    onClick={() => setStep(STEPS.FOLDER)}
                                    className="group px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-cyan-50 transition-all flex items-center gap-3 shadow-xl shadow-white/10"
                                >
                                    {t.startBtn}
                                    <span className="bg-black/10 rounded-full p-1 group-hover:translate-x-1 transition-transform">
                                        <ChevronRight size={16} />
                                    </span>
                                </button>
                            </motion.div>
                        )}

                        {step === STEPS.FOLDER && (
                            <motion.div
                                key="folder"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{t.pathTitle}</h2>
                                    <p className="text-gray-400">{t.pathDesc}</p>
                                </div>

                                <div
                                    onClick={handleSelectDir}
                                    className="group relative border border-white/10 bg-black/20 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-white/5 transition-all cursor-pointer overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="w-16 h-16 bg-gradient-to-tr from-gray-800 to-gray-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                        <Folder size={32} className="text-cyan-400" />
                                    </div>

                                    {config.path ? (
                                        <p className="text-cyan-200 font-mono bg-cyan-900/30 border border-cyan-500/30 px-4 py-2 rounded-lg text-sm break-all max-w-full text-center">{config.path}</p>
                                    ) : (
                                        <p className="text-gray-400 group-hover:text-white transition-colors">{t.browse}</p>
                                    )}
                                </div>

                                <div className="flex justify-between w-full">
                                    <button onClick={() => setStep(STEPS.WELCOME)} className="text-white/40 hover:text-white transition-colors text-sm font-medium">{t.back}</button>
                                    <button
                                        onClick={() => setStep(STEPS.TYPE)}
                                        disabled={!config.path}
                                        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                                    >
                                        {t.next}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === STEPS.TYPE && (
                            <motion.div
                                key="type"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{t.coreTitle}</h2>
                                    <p className="text-gray-400">{t.coreDesc}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {SERVER_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setConfig({ ...config, type: type.id })}
                                            className={cn(
                                                "relative p-4 rounded-2xl border text-left transition-all group overflow-hidden",
                                                config.type === type.id
                                                    ? "bg-white/10 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                                                    : "bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                    <type.icon className="text-white" size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{type.name}</h3>
                                                    <p className="text-sm text-gray-400">{type.description}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center">
                                    <button onClick={() => setStep(STEPS.FOLDER)} className="text-white/40 hover:text-white transition-colors text-sm font-medium">{t.back}</button>
                                    <button
                                        onClick={() => setStep(STEPS.VERSION)}
                                        disabled={!config.type}
                                        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 hover:scale-105 transition-transform"
                                    >
                                        {t.next}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === STEPS.VERSION && (
                            <motion.div
                                key="version"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{t.versionTitle}</h2>
                                    <p className="text-gray-400">{t.versionDesc}</p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {APP_VERSIONS.map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setConfig({ ...config, version: v })}
                                            className={cn(
                                                "py-3 rounded-xl border font-mono text-sm transition-all",
                                                config.version === v
                                                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 border-transparent text-white shadow-lg"
                                                    : "bg-black/20 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                                            )}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center">
                                    <button onClick={() => setStep(STEPS.TYPE)} className="text-white/40 hover:text-white transition-colors text-sm font-medium">{t.back}</button>
                                    <button
                                        onClick={handleInstall}
                                        disabled={!config.version}
                                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50 hover:scale-105 transition-transform flex items-center gap-2"
                                    >
                                        <Download size={18} />
                                        {t.install}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === STEPS.INSTALL && (
                            <motion.div
                                key="install"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full space-y-8 text-center"
                            >
                                <div className="relative w-32 h-32">
                                    <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Server size={32} className="text-cyan-400 animate-pulse" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-white">{t.installTitle}</h2>
                                    <p className="text-gray-400">{t.installDesc}</p>
                                </div>

                                <div className="w-full bg-black/40 rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs text-left border border-white/5">
                                    {logs.map((log, i) => <p key={i} className="text-gray-400 mb-1"><span className="text-cyan-500 mr-2">➜</span>{log}</p>)}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default WelcomeWizard;
