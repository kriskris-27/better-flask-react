import { useNavigate } from 'react-router-dom';
import type { Application } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
    app: Application;
}

function initials(company: string) {
    return company.slice(0, 2).toUpperCase();
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ApplicationCard({ app }: Props) {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(`/applications/${app.id}`)}
            className="group w-full text-left relative bg-black/15 hover:bg-black/25 border border-white/30 hover:border-white/60 p-5 transition-all duration-200 backdrop-blur-sm"
        >
            {/* Top corner accent */}
            <span className="absolute top-0 right-0 w-5 h-5 border-t border-r border-white/0 group-hover:border-white/60 transition-all duration-300" />

            <div className="flex items-start gap-4">
                {/* Monogram */}
                <div className="flex-shrink-0 w-10 h-10 border border-white/50 group-hover:border-white flex items-center justify-center text-white font-bold text-sm tracking-wider transition-colors">
                    {initials(app.company)}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-white text-sm tracking-tight truncate">
                            {app.company}
                        </h3>
                        <StatusBadge status={app.status} size="sm" />
                    </div>
                    <p className="text-xs text-white/80 tracking-wide truncate">{app.role}</p>

                    <div className="flex flex-wrap gap-3 mt-3 text-[10px] tracking-widest uppercase text-white/70">
                        {app.source && <span>{app.source}</span>}
                        {app.location && <span>{app.location}</span>}
                        {app.applied_on && <span>{formatDate(app.applied_on)}</span>}
                    </div>
                </div>
            </div>

            {/* Bottom rule that animates in on hover */}
            <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full bg-white transition-all duration-300" />
        </button>
    );
}
