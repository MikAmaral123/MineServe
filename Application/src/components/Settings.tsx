import { useState } from 'react';
import { Trash2, Save, Archive, Clock, ShieldAlert, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Mock IPC
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: { invoke: async () => { }, send: () => { } } };

const Settings = ({ version, onReset, appVersion }: { version: string, onReset: () => void, appVersion: string }) => {
    const { t, i18n } = useTranslation();
    const [backupConfig, setBackupConfig] = useState({
        enabled: false,
        interval: 30,
        onStop: true
    });

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const handleReset = async () => {
        if (confirm(t('reset_warning'))) {
            await ipcRenderer.invoke('reset-server');
            onReset();
        }
    };

    const saveBackupConfig = () => {
        ipcRenderer.send('configure-backup', backupConfig);
    };

    const triggerBackup = () => {
        ipcRenderer.send('trigger-backup');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
            {/* General Settings */}
            <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-purple-400" />
                    {t('settings')}
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                        <span className="text-gray-300">{t('language')}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => changeLanguage('en')}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors ${i18n.language === 'en' ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => changeLanguage('fr')}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors ${i18n.language === 'fr' ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                Français
                            </button>
                            <button
                                onClick={() => changeLanguage('es')}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors ${i18n.language === 'es' ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                Español
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Backup Settings */}
            <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                    <Archive size={20} className="text-blue-400" />
                    Backups
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                        <span className="text-gray-300">Auto Backup</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={backupConfig.enabled}
                                onChange={e => setBackupConfig({ ...backupConfig, enabled: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {backupConfig.enabled && (
                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl animate-fade-in">
                            <span className="text-gray-300 flex items-center gap-2"><Clock size={16} /> Interval (min)</span>
                            <input
                                type="number"
                                min="5"
                                value={backupConfig.interval}
                                onChange={e => setBackupConfig({ ...backupConfig, interval: parseInt(e.target.value) })}
                                className="w-20 bg-black/40 border border-glass-border rounded-lg px-2 py-1 text-white text-right"
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                        <span className="text-gray-300">Backup on Stop</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={backupConfig.onStop}
                                onChange={e => setBackupConfig({ ...backupConfig, onStop: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={saveBackupConfig}
                        className="flex-1 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Save Config
                    </button>
                    <button
                        onClick={triggerBackup}
                        className="flex-1 py-2 bg-white/5 text-gray-300 border border-white/10 rounded-lg hover:bg-white/10 transition-colors font-medium"
                    >
                        Backup Now
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                    <ShieldAlert size={20} />
                    Danger Zone
                </h3>

                <p className="text-gray-400 text-sm mb-6">
                    {t('reset_warning')}
                </p>

                <button
                    onClick={handleReset}
                    className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all font-bold flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                    <Trash2 size={20} />
                    {t('reset_app').toUpperCase()}
                </button>
            </div>

            <div className="col-span-1 md:col-span-2 text-center text-gray-500 text-sm mt-4">
                MineServe v{appVersion} • Running on Java {version}
            </div>
        </div>
    );
};

export default Settings;
