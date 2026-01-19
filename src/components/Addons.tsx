import { useState } from 'react';
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
    const [installed, setInstalled] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!search.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const res = await ipcRenderer.invoke('search-addons', search);
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

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header / Search */}
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
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all shadow-inner"
                    />
                </form>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                {loading ? (
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
