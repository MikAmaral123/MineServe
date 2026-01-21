import { cn } from '@/lib/utils';
import { Server, Settings, Terminal, Activity, RefreshCw, Users, Puzzle, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SidebarProps = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    updateAvailable: boolean;
};

const Sidebar = ({ activeTab, setActiveTab, updateAvailable, appVersion }: SidebarProps & { appVersion: string }) => {
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
                        <div className="relative">
                            <item.icon size={20} className={cn(
                                "transition-transform duration-300",
                                activeTab === item.id ? "scale-110 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "group-hover:scale-105"
                            )} />
                            {item.id === 'updates' && updateAvailable && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#15151a] animate-pulse" />
                            )}
                        </div>
                        <span className="font-medium text-sm tracking-wide">{item.label}</span>

                        {/* Hover glow */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </button>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 space-y-4">
                <a
                    href="https://buymeacoffee.com/mikamaral"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFDD00]/10 hover:bg-[#FFDD00]/20 text-[#FFDD00] transition-all group border border-[#FFDD00]/10"
                >
                    <Heart size={20} className="fill-current group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">{t('support_me')}</span>
                </a>

                <div className="p-4 rounded-xl border border-white/5 bg-black/20 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className={cn(
                                "w-2.5 h-2.5 rounded-full shadow-[0_0_10px] animate-pulse",
                                updateAvailable ? "bg-orange-500 shadow-orange-500" : "bg-green-500 shadow-green-500"
                            )} />
                            <div className={cn(
                                "absolute inset-0 w-2.5 h-2.5 rounded-full opacity-50 blur-sm",
                                updateAvailable ? "bg-orange-500" : "bg-green-500"
                            )} />
                        </div>
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                            {updateAvailable ? t('system_outdated') : t('system_online')}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 font-mono">MineServe v{appVersion}</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
