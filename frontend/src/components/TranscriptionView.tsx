import clsx from 'clsx';
import { User, Bot, HelpCircle, Smile } from 'lucide-react';

interface TranscriptionEntry {
    timestamp: string; // ISO string 
    role: 'user' | 'assistant';
    content: string;
    type?: string;
}

interface TranscriptionViewProps {
    entries: TranscriptionEntry[];
    startTime?: string; // Call start time to calculate relative offsets if timestamps are absolute
}

export function TranscriptionView({ entries, startTime }: TranscriptionViewProps) {
    if (!entries || entries.length === 0) {
        return (
            <div className="p-8 text-center text-slate-400 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                <p>No hay transcripción disponible.</p>
            </div>
        )
    }

    // Helper to format duration/offset
    const getOffset = (entryTime: string) => {
        if (!startTime) return '';
        const start = new Date(startTime).getTime();
        const current = new Date(entryTime).getTime();
        if (isNaN(start) || isNaN(current)) return '';

        const diff = Math.max(0, (current - start) / 1000); // seconds
        const mins = Math.floor(diff / 60);
        const secs = Math.floor(diff % 60);
        return `(${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')})`;
    };

    return (
        <div className="space-y-6">
            <h3 className="font-semibold text-lg text-white">Transcripción y Análisis de Tono</h3>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {entries.map((entry, idx) => {
                    const isAgent = entry.role === 'assistant';

                    return (
                        <div
                            key={idx}
                            className={clsx(
                                "p-4 rounded-xl border-l-4 transition-all hover:bg-white/5",
                                isAgent
                                    ? "bg-slate-800/40 border-emerald-500"
                                    : "bg-slate-800/40 border-blue-500"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={clsx(
                                        "font-bold text-sm",
                                        isAgent ? "text-emerald-400" : "text-blue-400"
                                    )}>
                                        {isAgent ? "Agente" : "Cliente"}
                                    </span>
                                    <span className="text-xs text-slate-500 font-mono">
                                        {getOffset(entry.timestamp)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 opacity-50">
                                    {/* Placeholder for sentiment/emotion if we had it */}
                                    {isAgent ? <Smile className="w-4 h-4 text-emerald-400" /> : <User className="w-4 h-4 text-blue-400" />}
                                    <HelpCircle className="w-4 h-4 text-slate-600" />
                                </div>
                            </div>

                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {entry.content}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
