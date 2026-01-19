import { useState, useEffect } from 'react';
import { Search, Ban, UserX, Shield, Users as UsersIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Mock IPC
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: { on: () => { }, send: () => { }, removeAllListeners: () => { } } };

type Player = string; // Simpler for now, name only

const Players = () => {
    const { t } = useTranslation();
    const [players, setPlayers] = useState<Player[]>([]);
    const [search, setSearch] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [action, setAction] = useState<'kick' | 'ban' | null>(null);

    // Modal Inputs
    const [reason, setReason] = useState('');
    const [duration, setDuration] = useState('');

    useEffect(() => {
        ipcRenderer.on('player-list-update', (_: any, list: string[]) => {
            setPlayers(list);
        });

        // Request initial list if needed? Or rely on updates. 
        // Ideally main process sends update on connect/load, but we might miss it.
        // For now, let's assume real-time updates work well.

        return () => {
            ipcRenderer.removeAllListeners('player-list-update');
        };
    }, []);

    const filteredPlayers = players.filter(p => p.toLowerCase().includes(search.toLowerCase()));

    const handleAction = () => {
        if (!selectedPlayer || !action) return;

        if (action === 'kick') {
            ipcRenderer.send('kick-player', { player: selectedPlayer, reason: reason || 'Kicked by admin' });
        } else if (action === 'ban') {
            ipcRenderer.send('ban-player', { player: selectedPlayer, reason: reason || 'Banned by admin', duration });
        }

        closeModal();
    };

    const handleOp = (player: string) => {
        // Simple toggle for now, though we don't know op status. 
        // Maybe we just send "op" command.
        ipcRenderer.send('op-player', player);
    }

    const handleDeop = (player: string) => {
        ipcRenderer.send('deop-player', player);
    }

    const openModal = (player: string, act: 'kick' | 'ban') => {
        setSelectedPlayer(player);
        setAction(act);
        setReason('');
        setDuration('');
    };

    const closeModal = () => {
        setSelectedPlayer(null);
        setAction(null);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <UsersIcon className="text-primary" /> {t('players')}
                        <span className="text-sm rounded-full bg-primary/20 text-primary px-3 py-1 ml-2">
                            {players.length}
                        </span>
                    </h2>
                </div>

                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('search_player')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/20 border border-glass-border rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
            </div>

            {/* Content */}
            {players.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
                    <UserX size={48} className="opacity-20" />
                    <p>{t('no_players')}</p>
                </div>
            ) : filteredPlayers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <p>No matches found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {filteredPlayers.map(player => (
                            <motion.div
                                key={player}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-card/40 backdrop-blur-sm border border-glass-border rounded-xl p-4 flex flex-col gap-4 group hover:bg-card/60 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden ring-1 ring-white/10">
                                        <img
                                            src={`https://minotar.net/avatar/${player}/100.png`}
                                            alt={player}
                                            className="w-full h-full object-cover"
                                            onError={(e) => (e.target as HTMLImageElement).src = 'https://minotar.net/avatar/MHF_Steve/100.png'}
                                        />
                                    </div>
                                    <h3 className="font-bold text-white text-lg truncate flex-1">{player}</h3>
                                </div>

                                <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                                    <button
                                        onClick={() => openModal(player, 'kick')}
                                        className="flex-1 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                                        title={t('kick')}
                                    >
                                        <UserX size={14} /> {t('kick')}
                                    </button>
                                    <button
                                        onClick={() => openModal(player, 'ban')}
                                        className="flex-1 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                                        title={t('ban')}
                                    >
                                        <Ban size={14} /> {t('ban')}
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOp(player)}
                                        className="flex-1 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Shield size={14} /> {t('op')}
                                    </button>
                                    <button
                                        onClick={() => handleDeop(player)}
                                        className="flex-1 py-1.5 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Shield size={14} className="rotate-180" /> {t('deop')}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {selectedPlayer && action && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#1a1a20] border border-white/10 rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-1">
                                {action === 'kick' ? t('kick') : t('ban')} {selectedPlayer}
                            </h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Please specify a reason for this action.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t('reason')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary/50"
                                        placeholder="e.g. Griefing, Spamming"
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                {action === 'ban' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t('duration')}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary/50"
                                            placeholder="e.g. 7d, 1h (Requires plugins like Essentials)"
                                            value={duration}
                                            onChange={e => setDuration(e.target.value)}
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Leave empty for permanent ban (Vanilla default).</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleAction}
                                    className={`px-6 py-2 rounded-lg text-white text-sm font-bold shadow-lg transition-transform hover:scale-105 ${action === 'kick' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {t('confirm')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Players;
