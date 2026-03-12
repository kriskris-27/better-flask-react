import type { StatusHistory } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
    history: StatusHistory[];
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function Timeline({ history }: Props) {
    if (history.length === 0) {
        return (
            <div className="border border-white/10 p-6 text-center">
                <p className="text-xs text-white/30 tracking-widest uppercase">No history tracked</p>
            </div>
        );
    }

    return (
        <ol className="relative border-l border-white/20 space-y-8 pl-8 ml-2">
            {history.map((entry, i) => (
                <li key={entry.id} className="relative">
                    {/* Custom marker */}
                    <span className={`absolute -left-[2.35rem] top-1.5 w-4 h-4 rounded-full border-2 border-[#2a0e06] flex items-center justify-center ${i === 0 ? 'bg-white shadow-[0_0_8px_white]' : 'bg-white/20'}`}>
                        {i === 0 && <span className="w-1 h-1 bg-black rounded-full" />}
                    </span>

                    <div className="flex flex-wrap items-center gap-3">
                        {entry.from_status && (
                            <>
                                <StatusBadge status={entry.from_status} size="sm" />
                                <span className="text-white/30 text-xs">→</span>
                            </>
                        )}
                        <StatusBadge status={entry.to_status} size="sm" />
                    </div>

                    {entry.note && (
                        <div className="bg-white/5 border-l-2 border-white/20 p-3 mt-3 text-sm text-white/90 italic leading-relaxed">
                            {entry.note}
                        </div>
                    )}

                    <time className="text-[10px] tracking-widest uppercase text-white/40 mt-2 block font-medium">
                        {formatDate(entry.changed_at)}
                    </time>
                </li>
            ))}
        </ol>
    );
}
