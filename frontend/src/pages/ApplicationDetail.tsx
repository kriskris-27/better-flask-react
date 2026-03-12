import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Application, ApplicationStatus, Contact } from '../types';
import { getApplication, transitionStatus } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import ContactList from '../components/ContactList';
import AIIntelPanel from '../components/AIIntelPanel';

type Tab = 'overview' | 'timeline' | 'contacts' | 'ai';

const NEXT_STATUSES: Record<ApplicationStatus, ApplicationStatus[]> = {
    APPLIED: ['SCREENING', 'REJECTED'],
    SCREENING: ['INTERVIEWING', 'REJECTED'],
    INTERVIEWING: ['OFFERED', 'REJECTED'],
    OFFERED: ['ACCEPTED', 'REJECTED'],
    ACCEPTED: [],
    REJECTED: [],
};

export default function ApplicationDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>('overview');
    const [transitioning, setTransitioning] = useState(false);
    const [transitionNote, setTransitionNote] = useState('');
    const [showTransition, setShowTransition] = useState(false);
    const [selectedNext, setSelectedNext] = useState<ApplicationStatus | ''>('');
    const [transitionError, setTransitionError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getApplication(Number(id))
            .then(setApp)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    async function handleTransition(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedNext || !app) return;
        setTransitioning(true); setTransitionError(null);
        try {
            const updated = await transitionStatus(app.id, { to_status: selectedNext, note: transitionNote || undefined });
            setApp(updated);
            setShowTransition(false); setTransitionNote(''); setSelectedNext('');
            if (updated.interview_intel && tab !== 'ai') setTab('ai');
        } catch (err: unknown) {
            setTransitionError(err instanceof Error ? err.message : 'Transition failed');
        } finally { setTransitioning(false); }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-6 h-6 border border-white border-t-transparent animate-spin" />
            </div>
        );
    }

    if (error || !app) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-200 text-sm">
                {error ?? 'Application not found.'}
            </div>
        );
    }

    const nextOptions = NEXT_STATUSES[app.status];
    const TABS: { key: Tab; label: string }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'timeline', label: `Timeline (${app.history.length})` },
        { key: 'contacts', label: `Contacts (${app.contacts.length})` },
        { key: 'ai', label: '✦ AI Intel' },
    ];

    return (
        <div className="min-h-screen">

            {/* ── Navbar ── */}
            <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-10 h-14 border-b border-white/20 bg-black/20 backdrop-blur-md">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-white font-medium hover:text-white/80 transition-colors">
                    ← Dashboard
                </button>
                <span className="text-xs tracking-[0.2em] uppercase text-white/70">{import.meta.env.VITE_APP_NAME || 'JobTracker Inc.'}</span>
                <div className="w-8" />
            </header>

            <div className="pt-14">
                {/* ── Hero banner ── */}
                <div className="relative overflow-hidden border-b border-white/10">
                    <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
                    <div className="absolute right-0 top-0 h-full w-1/2 wave-blob bg-gradient-to-br from-white/20 via-orange-100/10 to-transparent blur-2xl pointer-events-none scale-150 origin-right" />

                    <div className="relative max-w-[90rem] mx-auto px-6 md:px-10 py-12">
                        <div className="flex items-start gap-6">
                            {/* Monogram */}
                            <div className="w-16 h-16 border border-white/70 flex items-center justify-center text-white font-bold text-xl tracking-wider flex-shrink-0">
                                {app.company.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <StatusBadge status={app.status} />
                                    {app.source && (
                                        <span className="text-[9px] tracking-widest uppercase text-white/80 border border-white/50 px-2 py-0.5">{app.source}</span>
                                    )}
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none">{app.company}</h1>
                                <p className="text-white/90 text-lg mt-2 tracking-wide">{app.role}</p>

                                <div className="flex flex-wrap gap-5 mt-4 text-[10px] tracking-widest uppercase text-white/80">
                                    {app.location && <span>📍 {app.location}</span>}
                                    {app.applied_on && <span>Applied {new Date(app.applied_on).toLocaleDateString()}</span>}
                                    {app.notes && <span className="text-white/70 italic normal-case tracking-normal text-xs">{app.notes}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Status Transition */}
                        {nextOptions.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-white/30">
                                {showTransition ? (
                                    <form onSubmit={handleTransition} className="flex flex-wrap gap-3 items-end">
                                        <div>
                                            <label className="block text-[10px] text-white/80 tracking-widest uppercase mb-1.5">Move to</label>
                                            <select
                                                value={selectedNext}
                                                onChange={e => setSelectedNext(e.target.value as ApplicationStatus)}
                                                className="bg-black/20 border border-white/50 px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
                                            >
                                                <option value="">Select…</option>
                                                {nextOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-1 min-w-48">
                                            <label className="block text-[10px] text-white/80 tracking-widest uppercase mb-1.5">Note (optional)</label>
                                            <input
                                                type="text"
                                                value={transitionNote}
                                                onChange={e => setTransitionNote(e.target.value)}
                                                placeholder="Add a note…"
                                                className="w-full bg-black/20 border border-white/50 px-3 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:border-white"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!selectedNext || transitioning}
                                            className="px-5 py-2 bg-white text-orange-900 hover:bg-white/90 text-xs tracking-widest uppercase font-black transition-colors disabled:opacity-40"
                                        >
                                            {transitioning ? (selectedNext === 'INTERVIEWING' ? 'Generating AI…' : 'Updating…') : 'Update'}
                                        </button>
                                        <button type="button" onClick={() => setShowTransition(false)} className="px-4 py-2 border border-white/50 text-white/80 hover:text-white text-xs tracking-widest uppercase">Cancel</button>
                                        {transitionError && <p className="w-full text-xs text-red-400">{transitionError}</p>}
                                    </form>
                                ) : (
                                    <button onClick={() => setShowTransition(true)} className="text-xs text-white font-semibold tracking-widest uppercase underline underline-offset-4 hover:no-underline transition-all">
                                        Move to next stage →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="border-b border-white/20 bg-black/10 backdrop-blur-sm sticky top-14 z-30">
                    <div className="max-w-[90rem] mx-auto px-6 md:px-10 flex gap-0">
                        {TABS.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`px-5 py-3.5 text-[10px] tracking-widest uppercase font-semibold border-b-2 transition-all ${tab === t.key
                                    ? 'border-white text-white font-black'
                                    : 'border-transparent text-white/50 hover:text-white'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Tab Content ── */}
                <div className="max-w-[90rem] mx-auto px-6 md:px-10 py-10 pb-20">
                    {tab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div>
                                <h3 className="text-[10px] tracking-widest uppercase text-white/80 mb-5">Status History</h3>
                                <Timeline history={app.history} />
                            </div>
                            {app.interview_intel && (
                                <div>
                                    <h3 className="text-[10px] tracking-widest uppercase text-white/80 mb-5">AI Interview Intel</h3>
                                    <AIIntelPanel intel={app.interview_intel} />
                                </div>
                            )}
                        </div>
                    )}
                    {tab === 'timeline' && <Timeline history={app.history} />}
                    {tab === 'contacts' && (
                        <ContactList
                            applicationId={app.id}
                            contacts={app.contacts}
                            onUpdate={(updated: Contact[]) => setApp(prev => prev ? { ...prev, contacts: updated } : prev)}
                        />
                    )}
                    {tab === 'ai' && <AIIntelPanel intel={app.interview_intel} />}
                </div>
            </div>
        </div>
    );
}
