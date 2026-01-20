import { useState, useEffect } from 'react';
import { Search, Download, Check, AlertCircle, Loader2, Puzzle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Mock IPC
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: { invoke: async () => ({}) } };

type Addon = {
    slug: string;
    title: string;
    description: string;
    icon_url: string;
    downloads: number;
    author: string;
};

const Addons = () => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Addon[]>([]);
    const [loading, setLoading] = useState(false);
    const [installing, setInstalling] = useState<Record<string, boolean>>({});
    // Load installed addons from localStorage to persist state between tab switches
    const [installed, setInstalled] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('installed-addons');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('installed-addons', JSON.stringify(installed));
    }, [installed]);
    const [error, setError] = useState<string | null>(null);

    const [serverInfo, setServerInfo] = useState<{ type: string, version: string | null } | null>(null);

    const fetchAddons = async (query: string) => {
        setLoading(true);
        setError(null);
        try {
            // Check server info first if needed, but search-addons does it on backend too
            // Let's get info to display UI hints
            const details = await ipcRenderer.invoke('get-server-details');
            setServerInfo(details);

            if (details?.type === 'vanilla') {
                setLoading(false);
                return; // Don't search for vanilla
            }

            const res = await ipcRenderer.invoke('search-addons', query);
            if (res.success) {
                setResults(res.results);
            } else {
                setError(res.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddons('');
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        fetchAddons(search);
    };

    const installAddon = async (slug: string) => {
        setInstalling(prev => ({ ...prev, [slug]: true }));
        try {
            const res = await ipcRenderer.invoke('install-addon', { slug });
            if (res.success) {
                setInstalled(prev => ({ ...prev, [slug]: true }));
            } else {
                alert(res.error); // Simple flush for now
            }
        } catch (err: any) {
            alert('Installation failed: ' + err.message);
        } finally {
            setInstalling(prev => ({ ...prev, [slug]: false }));
        }
    };

    // Helper to get loader compatible text
    const getLoaderText = (type: string) => {
        if (type === 'fabric') return 'Fabric Mods';
        if (['paper', 'spigot', 'bukkit'].includes(type)) return 'Plugins (Paper/Spigot)';
        if (type === 'vanilla') return 'Vanilla';
        return 'All Add-ons';
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header / Search */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Puzzle className="text-purple-400" /> {t('addons')}
                    </h2>

                    <form onSubmit={handleSearch} className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('search_addons_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            disabled={serverInfo?.type === 'vanilla'}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </form>
                </div>

                {/* Context Banner */}
                {serverInfo && (
                    <div className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${serverInfo.type === 'vanilla' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                        {serverInfo.type === 'vanilla' ? <AlertCircle size={16} /> : <Check size={16} />}
                        <span>
                            {serverInfo.type === 'vanilla'
                                ? "Vanilla server detected. Add-ons require Fabric, Paper, or Spigot."
                                : `Browsing ${getLoaderText(serverInfo.type)} for version ${serverInfo.version || 'Any'}`}
                        </span>
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                {serverInfo?.type === 'vanilla' ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                        <Puzzle size={48} className="opacity-20" />
                        <p>Switch to a Fabric or Paper server to install add-ons.</p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                        <Loader2 size={40} className="animate-spin text-purple-500" />
                        <p>{t('searching')}...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400 gap-4">
                        <AlertCircle size={40} />
                        <p>{error}</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                        <Puzzle size={48} className="opacity-20" />
                        <p>{t('no_addons_found')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {results.map((addon) => (
                                <motion.div
                                    key={addon.slug}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-card rounded-xl p-4 flex gap-4 group"
                                >
                                    <div className="w-16 h-16 rounded-lg bg-black/40 overflow-hidden shrink-0 border border-white/5">
                                        {addon.icon_url ? (
                                            <img src={addon.icon_url} alt={addon.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <Puzzle size={24} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <h3 className="font-bold text-white truncate text-lg group-hover:text-purple-400 transition-colors">{addon.title}</h3>
                                        <p className="text-xs text-gray-400 line-clamp-2 mb-3">{addon.description}</p>

                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-md">
                                                ⬇ {addon.downloads.toLocaleString()}
                                            </span>

                                            {installed[addon.slug] ? (
                                                <button disabled className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg flex items-center gap-1">
                                                    <Check size={12} /> {t('installed')}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => installAddon(addon.slug)}
                                                    disabled={installing[addon.slug]}
                                                    className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {installing[addon.slug] ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                                    {installing[addon.slug] ? t('installing') : t('install')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Addons;
