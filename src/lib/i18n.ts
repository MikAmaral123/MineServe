import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "dashboard": "Dashboard",
            "console": "Console",
            "server_config": "Server Config",
            "settings": "Settings",
            "players": "Players",
            "updates": "Updates",
            "status": "Status",
            "folder": "Folder",
            "start_server": "Start Server",
            "stop_server": "Stop Server",
            "stopping": "Stopping...",
            "select_server": "Select Server",
            "no_server_selected": "No server directory selected",
            "linked": "Linked",
            "not_set": "Not Set",
            "online": "ONLINE",
            "offline": "OFFLINE",
            "starting": "STARTING",
            "server_status": "Server Status",
            "players_online": "Players Online",
            "cpu_usage": "CPU Usage",
            "ram_usage": "RAM Usage",
            "kick": "Kick",
            "ban": "Ban",
            "op": "Op",
            "deop": "Deop",
            "reason": "Reason",
            "duration": "Duration (optional)",
            "cancel": "Cancel",
            "confirm": "Confirm",
            "search_player": "Search player...",
            "no_players": "No players online",
            "language": "Language",
            "theme": "Theme",
            "version": "Version",
            "reset_app": "Reset App",
            "reset_warning": "Are you sure? This will remove all local data.",
            "check_updates": "Check for Updates",
            "up_to_date": "You are up to date",
            "update_available": "Update available",
            "downloading": "Downloading...",
            "restart_to_update": "Restart to Update",
            "dev_mode": "Development Mode"
        }
    },
    fr: {
        translation: {
            "dashboard": "Tableau de bord",
            "console": "Console",
            "server_config": "Config. Serveur",
            "settings": "Paramètres",
            "players": "Joueurs",
            "updates": "Mises à jour",
            "status": "Statut",
            "folder": "Dossier",
            "start_server": "Démarrer",
            "stop_server": "Arrêter",
            "stopping": "Arrêt en cours...",
            "select_server": "Sélectionner Serveur",
            "no_server_selected": "Aucun dossier sélectionné",
            "linked": "Lié",
            "not_set": "Non défini",
            "online": "EN LIGNE",
            "offline": "HORS LIGNE",
            "starting": "DÉMARRAGE",
            "server_status": "Statut du Serveur",
            "players_online": "Joueurs en ligne",
            "cpu_usage": "Usage CPU",
            "ram_usage": "Usage RAM",
            "kick": "Expulser",
            "ban": "Bannir",
            "op": "Op",
            "deop": "Deop",
            "reason": "Motif",
            "duration": "Durée (optionnel)",
            "cancel": "Annuler",
            "confirm": "Confirmer",
            "search_player": "Rechercher un joueur...",
            "no_players": "Aucun joueur en ligne",
            "language": "Langue",
            "theme": "Thème",
            "version": "Version",
            "reset_app": "Réinitialiser l'App",
            "reset_warning": "Êtes-vous sûr ? Cela supprimera toutes les données locales.",
            "check_updates": "Vérifier les mises à jour",
            "up_to_date": "Vous êtes à jour",
            "update_available": "Mise à jour disponible",
            "downloading": "Téléchargement...",
            "restart_to_update": "Redémarrer pour mettre à jour",
            "dev_mode": "Mode Développement"
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
