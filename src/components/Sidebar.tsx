import { cn } from '@/lib/utils';
import { Server, Settings, Terminal, Activity, RefreshCw, Users, Puzzle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SidebarProps = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
};

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
    const { t } = useTranslation();

    const menuItems = [
        { id: 'dashboard', icon: Activity, label: t('dashboard') },
        { id: 'console', icon: Terminal, label: t('console') },
        { id: 'players', icon: Users, label: t('players') },
        { id: 'addons', icon: Puzzle, label: t('addons') },
        { id: 'server', icon: Server, label: t('server_config') },
        { id: 'settings', icon: Settings, label: t('settings') },
        { id: 'updates', icon: RefreshCw, label: t('updates') },
    ];

    return (
        <div className="h-full flex flex-col p-3">
            <div className="flex flex-col gap-1.5 mt-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                            activeTab === item.id
                                ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/10"
                                : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        )}
                    >
                        {activeTab === item.id && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-purple-500 rounded-r-full shadow-[0_0_10px_#a855f7]" />
                        )}
                        <item.icon size={20} className={cn(
                            "transition-transform duration-300",
                            activeTab === item.id ? "scale-110 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "group-hover:scale-105"
                        )} />
                        <span className="font-medium text-sm tracking-wide">{item.label}</span>

                        {/* Hover glow */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </button>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-white/5">
                <div className="p-4 rounded-xl border border-white/5 bg-black/20 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
                            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 opacity-50 blur-sm" />
                        </div>
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">System Online</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 font-mono">MineServe v1.1.0</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
