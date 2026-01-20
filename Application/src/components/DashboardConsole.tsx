import { useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type LogEntry = {
    message: string;
    type: 'info' | 'error';
    timestamp: string;
};

interface DashboardConsoleProps {
    logs: LogEntry[];
}

export default function DashboardConsole({ logs }: DashboardConsoleProps) {
    const { t } = useTranslation();
    const logsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logsRef.current) {
            logsRef.current.scrollTop = logsRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="glass-panel rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 shrink-0">
                <Terminal size={20} className="text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-200">{t('console')}</h3>
            </div>

            <div
                ref={logsRef}
                className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-black/40 rounded-xl border border-white/5 shadow-inner font-mono text-xs text-gray-300 space-y-1"
                style={{ maxHeight: 'calc(100vh - 350px)' }}
            >
                {logs.length === 0 ? (
                    <div className="text-gray-500 italic text-center py-8">
                        Waiting for server logs...
                    </div>
                ) : (
                    logs.map((log, i) => (
                        <p key={i} className="break-words leading-relaxed">
                            <span className="text-gray-500 mr-3 opacity-50">[{log.timestamp}]</span>
                            <span className={log.type === 'error' ? 'text-red-400' : 'text-gray-200'}>
                                {log.message}
                            </span>
                        </p>
                    ))
                )}
            </div>
        </div>
    );
}
