import { useState, useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

// IPC Mock
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: { invoke: async () => ({}), send: () => { } } };

// Translation map for common server properties
const PROPERTY_TRANSLATIONS: Record<string, Record<string, string>> = {
    'motd': { en: 'Message of the Day', fr: 'Message du Jour', es: 'Mensaje del Día' },
    'max-players': { en: 'Max Players', fr: 'Joueurs Max', es: 'Max Jugadores' },
    'server-port': { en: 'Server Port', fr: 'Port du Serveur', es: 'Puerto del Servidor' },
    'view-distance': { en: 'View Distance', fr: 'Distance de Vue', es: 'Distancia de Visión' },
    'gamemode': { en: 'Game Mode', fr: 'Mode de Jeu', es: 'Modo de Juego' },
    'difficulty': { en: 'Difficulty', fr: 'Difficulté', es: 'Dificultad' },
    'pvp': { en: 'PVP', fr: 'JcJ (PVP)', es: 'JcJ (PVP)' },
    'online-mode': { en: 'Online Mode (Premium)', fr: 'Mode En Ligne (Premium)', es: 'Modo En Línea' },
    'enable-command-block': { en: 'Enable Command Blocks', fr: 'Blocs de Commande', es: 'Bloques de Comandos' },
    'spawn-protection': { en: 'Spawn Protection', fr: 'Protection du Spawn', es: 'Protección de Spawn' },
    'white-list': { en: 'Whitelist', fr: 'Liste Blanche', es: 'Lista Blanca' },
    'level-seed': { en: 'World Seed', fr: 'Seed (Graine)', es: 'Semilla' },
    'level-name': { en: 'Level Name', fr: 'Nom du Monde', es: 'Nombre del Nivel' },
    'hardcore': { en: 'Hardcore', fr: 'Hardcore', es: 'Hardcore' },
    'snooper-enabled': { en: 'Snooper Enabled', fr: 'Snooper Activé', es: 'Snooper Habilitado' },
    'allow-flight': { en: 'Allow Flight', fr: 'Autoriser le Vol', es: 'Permitir Vuelo' },
    'allow-nether': { en: 'Allow Nether', fr: 'Autoriser le Nether', es: 'Permitir Nether' },
    'resource-pack': { en: 'Resource Pack', fr: 'Pack de Ressources', es: 'Paquete de Recursos' },
    'entity-broadcast-range-percentage': { en: 'Entity Broadcast Range', fr: 'Portée Entités', es: 'Rango Entidades' },
    'player-idle-timeout': { en: 'Idle Timeout', fr: 'Temps Inactivité', es: 'Tiempo Inactividad' },
    'op-permission-level': { en: 'OP Permission Level', fr: 'Niveau Permission OP', es: 'Nivel Permiso OP' },
    'generator-settings': { en: 'Generator Settings', fr: 'Paramètres Générateur', es: 'Ajustes Generador' },
    'force-gamemode': { en: 'Force Gamemode', fr: 'Forcer Mode de Jeu', es: 'Forzar Modo Juego' },
    'enforce-whitelist': { en: 'Enforce Whitelist', fr: 'Forcer Liste Blanche', es: 'Forzar Lista Blanca' },
    'generate-structures': { en: 'Generate Structures', fr: 'Générer Structures', es: 'Generar Estructuras' },
    'max-build-height': { en: 'Max Build Height', fr: 'Hauteur Max', es: 'Altura Max' },
    'spawn-animals': { en: 'Spawn Animals', fr: 'Apparition Animaux', es: 'Generar Animales' },
    'spawn-monsters': { en: 'Spawn Monsters', fr: 'Apparition Monstres', es: 'Generar Monstruos' },
    'spawn-npcs': { en: 'Spawn NPCs', fr: 'Apparition PNJ', es: 'Generar PNJ' },
};

const ServerConfig = () => {
    const [properties, setProperties] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const lang = localStorage.getItem('app-language') || 'en';

    useEffect(() => {
        loadProperties();
    }, []);

    const loadProperties = async () => {
        setLoading(true);
        try {
            const props = await ipcRenderer.invoke('get-properties');
            setProperties(props);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setProperties(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        ipcRenderer.send('save-properties', properties);
    };

    const getLabel = (key: string) => {
        if (PROPERTY_TRANSLATIONS[key] && PROPERTY_TRANSLATIONS[key][lang]) {
            return PROPERTY_TRANSLATIONS[key][lang].toUpperCase();
        }
        return key.replace(/\./g, ' ').replace(/-/g, ' ').toUpperCase();
    };

    if (loading) return <div className="text-gray-400">Loading configuration...</div>;

    return (
        <div className="bg-card/40 backdrop-blur-sm border border-glass-border rounded-2xl p-6 h-[calc(100vh-200px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-200">Server Properties</h3>
                <div className="flex gap-3">
                    <button
                        onClick={loadProperties}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Reload"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary border border-primary/20 rounded-lg hover:bg-primary/30 transition-all font-medium"
                    >
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(properties).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{getLabel(key)}</label>

                            {(value === 'true' || value === 'false') ? (
                                <div className="relative">
                                    <select
                                        value={value}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className={cn(
                                            "w-full appearance-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors cursor-pointer border",
                                            value === 'true'
                                                ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                                                : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                        )}
                                    >
                                        <option value="true" className="bg-[#0f0f13]">True</option>
                                        <option value="false" className="bg-[#0f0f13]">False</option>
                                    </select>
                                    {/* Custom Dropdown Arrow */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="bg-black/20 border border-glass-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            )}
                        </div>
                    ))}
                    {Object.keys(properties).length === 0 && (
                        <p className="text-gray-500 col-span-2 text-center py-10">
                            No properties found. Make sure a server directory is selected and server.properties exists.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServerConfig;
