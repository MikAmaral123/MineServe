import { useState, useEffect } from 'react';
import { RefreshCw, Download, Info, Check, AlertCircle, ArrowUpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// Mock IPC
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: { invoke: async () => ({}), on: () => { } } };

const Updates = () => {
    const [status, setStatus] = useState<string>('idle');
    const [progress, setProgress] = useState<any>(null);
    const [info, setInfo] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        ipcRenderer.on('update-status', (_: any, data: any) => {
            setStatus(data.status);
            if (data.info) setInfo(data.info);
            if (data.progress) setProgress(data.progress);
            if (data.error) setError(data.error);
        });
    }, []);

    const checkForUpdates = () => {
        setStatus('checking');
        setError(null);

        // Timeout to prevent infinite loading if IPC fails
        const timeout = setTimeout(() => {
            if (status === 'checking') {
                setStatus('error');
                setError('Check timed out. Please check your internet connection.');
            }
        }, 15000);

        ipcRenderer.invoke('check-for-updates')
            .then((res: any) => {
                clearTimeout(timeout);
                if (res && res.status === 'dev-mode') {
                    setStatus('dev-mode');
                } else if (res && res.status === 'error') {
                    // Handled by event listener usually, but just in case
                    setStatus('error');
                    setError(res.message);
                }
            })
            .catch((err: any) => {
                clearTimeout(timeout);
                setStatus('error');
                setError('Failed to check for updates: ' + err.message);
            });
    };

    const downloadUpdate = () => {
        ipcRenderer.invoke('download-update');
    };

    const quitAndInstall = () => {
        ipcRenderer.invoke('quit-and-install');
    };

    return (
        <div className="bg-card/40 backdrop-blur-sm border border-glass-border rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />

            <AnimatePresence mode='wait'>
                {status === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10">
                            <RefreshCw size={40} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Check for Updates</h2>
                        <p className="text-gray-400 max-w-sm mx-auto">
                            Ensure you are running the latest version of MineServe for the best performance and new features.
                        </p>
                        <button
                            onClick={checkForUpdates}
                            className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            Check Now
                        </button>
                    </motion.div>
                )}

                {status === 'checking' && (
                    <motion.div
                        key="checking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <RefreshCw size={40} className="text-cyan-400 animate-spin" />
                        <p className="text-gray-300">Checking for updates...</p>
                    </motion.div>
                )}

                {status === 'dev-mode' && (
                    <motion.div
                        key="dev"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                    >
                        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto text-yellow-500">
                            <Info size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Development Mode</h3>
                        <p className="text-gray-400">Updates are disabled in development environments.</p>
                        <button onClick={() => setStatus('idle')} className="text-sm text-gray-500 hover:text-white">Go Back</button>
                    </motion.div>
                )}

                {status === 'not-available' && (
                    <motion.div
                        key="uptodate"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500 ring-1 ring-green-500/40">
                            <Check size={48} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">You're up to date!</h3>
                            <p className="text-gray-400 mt-2">Current Version: {info?.version || 'Unknown'}</p>
                        </div>
                        <button onClick={() => setStatus('idle')} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                            Check Again
                        </button>
                    </motion.div>
                )}

                {status === 'available' && (
                    <motion.div
                        key="available"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 w-full max-w-2xl"
                    >
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                <ArrowUpCircle size={32} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-2xl font-bold text-white">Update Available</h3>
                                <p className="text-cyan-400 font-mono text-lg">v{info?.version}</p>
                            </div>
                        </div>

                        <div className="p-6 bg-black/40 rounded-xl text-left border border-white/5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-cyan-400 prose-a:text-blue-400 prose-strong:text-white prose-ul:list-disc prose-ul:pl-4">
                                {(() => {
                                    const notes = typeof info?.releaseNotes === 'string'
                                        ? info.releaseNotes
                                        : (Array.isArray(info?.releaseNotes)
                                            ? info.releaseNotes.map((n: any) => n.note).join('\n')
                                            : 'No release notes available.');

                                    // Simple heuristic: if it contains HTML tags, render as HTML
                                    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(notes);

                                    if (hasHtmlTags) {
                                        return <div dangerouslySetInnerHTML={{ __html: notes }} />;
                                    }

                                    return <ReactMarkdown>{notes}</ReactMarkdown>;
                                })()}
                            </div>
                        </div>

                        <button
                            onClick={downloadUpdate}
                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                        >
                            <Download size={20} /> Download & Install
                        </button>
                    </motion.div>
                )}

                {status === 'downloading' && (
                    <motion.div
                        key="downloading"
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        className="w-full max-w-md space-y-4"
                    >
                        <h3 className="text-xl font-bold text-white">Downloading Update...</h3>
                        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan-500 transition-all duration-300 ease-out"
                                style={{ width: `${progress?.percent || 0}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 font-mono">
                            <span>{progress?.bytesPerSecond ? (progress.bytesPerSecond / 1024 / 1024).toFixed(1) + ' MB/s' : '--'}</span>
                            <span>{Math.round(progress?.percent || 0)}%</span>
                        </div>
                    </motion.div>
                )}

                {status === 'downloaded' && (
                    <motion.div
                        key="downloaded"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500 animate-pulse">
                            <Download size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Update Ready</h3>
                        <p className="text-gray-400">Restart the application to apply changes.</p>
                        <button
                            onClick={quitAndInstall}
                            className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20"
                        >
                            Restart Now
                        </button>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Update Failed</h3>
                        <p className="text-red-400 text-sm max-w-xs mx-auto break-words">{error}</p>
                        <button onClick={() => setStatus('idle')} className="text-sm text-gray-400 hover:text-white underline">Try Again</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Updates;
