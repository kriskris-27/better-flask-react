import type { ApplicationStatus } from '../types';

const CONFIG: Record<ApplicationStatus, { label: string; classes: string }> = {
    APPLIED: { label: 'Applied', classes: 'border-white/70 bg-white/15 text-white' },
    SCREENING: { label: 'Screening', classes: 'border-white/70 bg-white/15 text-white' },
    INTERVIEWING: { label: 'Interviewing', classes: 'border-white bg-white/25 text-white font-bold' },
    OFFERED: { label: 'Offered', classes: 'border-white bg-white/30 text-white font-bold' },
    ACCEPTED: { label: 'Accepted', classes: 'border-white bg-white text-orange-900 font-bold' },
    REJECTED: { label: 'Rejected', classes: 'border-white/50 bg-black/20 text-white/70' },
};

interface Props {
    status: ApplicationStatus;
    size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
    const { label, classes } = CONFIG[status] ?? CONFIG.APPLIED;
    const sizeClass = size === 'sm'
        ? 'px-2 py-0.5 text-[9px] tracking-[0.15em]'
        : 'px-3 py-1 text-[10px] tracking-[0.15em]';
    return (
        <span className={`inline-flex items-center border uppercase ${sizeClass} ${classes}`}>
            {label}
        </span>
    );
}
