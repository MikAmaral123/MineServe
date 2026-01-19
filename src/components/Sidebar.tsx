import { cn } from '@/lib/utils';
import { Server, Settings, Terminal, Activity, RefreshCw, Users } from 'lucide-react';
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
        { id: 'server', icon: Server, label: t('server_config') },
        { id: 'settings', icon: Settings, label: t('settings') },
        { id: 'updates', icon: RefreshCw, label: t('updates') },
    ];

    return (
        <div className="w-64 bg-card/30 backdrop-blur-sm border-r border-glass-border h-full flex flex-col p-4">
            <div className="flex flex-col gap-2 mt-4">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                            activeTab === item.id
                                ? "bg-primary/20 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                                : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        )}
                    >
                        {activeTab === item.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full" />
                        )}
                        <item.icon size={20} className={cn(
                            "transition-transform duration-300",
                            activeTab === item.id ? "scale-110 text-primary" : "group-hover:scale-105"
                        )} />
                        <span className="font-medium text-sm">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-auto">
                <div className="bg-gradient-to-br from-card to-black/50 p-4 rounded-xl border border-glass-border">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                        <span className="text-xs font-medium text-gray-300">System Online</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">v1.0.3 Stable</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
