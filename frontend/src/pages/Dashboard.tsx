import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Application, ApplicationStatus, CreateApplicationPayload } from '../types';
import { getApplications, createApplication } from '../api/client';
import ApplicationCard from '../components/ApplicationCard';

const STATUSES: ApplicationStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFERED', 'ACCEPTED', 'REJECTED'];
const EMPTY_FORM: CreateApplicationPayload = { company: '', role: '', location: '', source: '', notes: '' };

export default function Dashboard() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<CreateApplicationPayload>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getApplications()
            .then(setApps)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        return apps
            .filter(a => filter === 'ALL' || a.status === filter)
            .filter(a => {
                const q = search.toLowerCase();
                return !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
            });
    }, [apps, filter, search]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!form.company.trim() || !form.role.trim()) { setFormError('Company and Role are required.'); return; }
        setSubmitting(true); setFormError(null);
        try {
            const newApp = await createApplication(form);
            setApps(prev => [newApp, ...prev]);
            setShowModal(false); setForm(EMPTY_FORM);
            navigate(`/applications/${newApp.id}`);
        } catch (err: unknown) {
            setFormError(err instanceof Error ? err.message : 'Failed to create application');
        } finally { setSubmitting(false); }
    }

    return (
        <div className="min-h-screen">

            {/* ── Navbar ── */}
            <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-10 h-14 border-b border-white/20 bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-white font-medium">
                    <span className="w-5 h-5 rounded border border-white flex items-center justify-center text-white text-xs font-black">J</span>
                    {import.meta.env.VITE_APP_NAME || 'JobTracker Inc.'}
                </div>
                <nav className="hidden md:flex gap-8 text-xs tracking-widest uppercase text-white/80">
                    <span className="text-white font-bold border-b border-white pb-0.5">Dashboard</span>
                </nav>
                <button
                    onClick={() => setShowModal(true)}
                    className="w-8 h-8 rounded bg-white hover:bg-white/90 flex items-center justify-center text-[#2a0e06] text-lg transition-all shadow-xl"
                    title="New Application"
                >
                    ✎
                </button>
            </header>

            {/* ── Hero ── */}
            <section className="relative pt-14 overflow-hidden">
                {/* Dot grid texture */}
                <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />

                {/* Wave blob glow */}
                <div className="absolute right-[-10%] top-[-5%] w-[55vw] h-[55vw] wave-blob bg-gradient-to-br from-white/30 via-orange-200/20 to-transparent opacity-80 blur-[1px] pointer-events-none" />
                <div className="absolute right-[-10%] top-[-5%] w-[55vw] h-[55vw] wave-blob bg-gradient-to-br from-yellow-100/20 via-orange-300/10 to-transparent opacity-50 scale-95 pointer-events-none" style={{ animationDelay: '-4s' }} />

                {/* Vertical rule lines like reference */}
                <div className="absolute inset-0 flex justify-between pointer-events-none px-6 md:px-10">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-px h-full bg-white/5" />
                    ))}
                </div>

                <div className="relative max-w-[90rem] mx-auto px-6 md:px-10 pt-16 pb-12">
                    {/* Stats row */}
                    <div className="flex gap-6 mb-8 text-xs tracking-widest uppercase text-white/80">
                        <span>{apps.length} Applications</span>
                        <span>·</span>
                        <span>{apps.filter(a => a.status === 'INTERVIEWING').length} Interviewing</span>
                        <span>·</span>
                        <span>{apps.filter(a => a.status === 'OFFERED').length} Offers</span>
                    </div>

                    {/* Giant display heading */}
                    <h1 className="display-heading text-[clamp(3.5rem,12vw,9rem)] text-white leading-none mb-2">
                        Your Job
                    </h1>
                    <h1 className="display-heading text-[clamp(3.5rem,12vw,9rem)] text-[#fff1e6] leading-none mb-10">
                        Pipeline.
                    </h1>

                    <div className="glow-line mb-8" />

                    {/* Search + filter row */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-[220px]">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search company or role…"
                                className="w-full bg-black/10 border border-white/50 rounded-none px-4 py-2.5 text-sm text-white placeholder-white/60 tracking-wide focus:outline-none focus:border-white focus:bg-black/20 transition-colors"
                            />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => setFilter('ALL')}
                                className={`px-3 py-1.5 text-xs tracking-widest uppercase border transition-all ${filter === 'ALL' ? 'border-white bg-white/20 text-white font-bold' : 'border-white/60 text-white/90 hover:border-white hover:text-white hover:bg-white/10'}`}
                            >
                                All ({apps.length})
                            </button>
                            {STATUSES.map(s => {
                                const count = apps.filter(a => a.status === s).length;
                                if (count === 0) return null;
                                return (
                                    <button
                                        key={s}
                                        onClick={() => setFilter(s)}
                                        className={`px-3 py-1.5 text-xs tracking-widest uppercase border transition-all ${filter === s ? 'border-white bg-white/20 text-white font-bold' : 'border-white/60 text-white/90 hover:border-white hover:text-white hover:bg-white/10'}`}
                                    >
                                        {s} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="ml-auto px-5 py-2.5 text-xs tracking-widest uppercase bg-white text-orange-900 font-bold hover:bg-white/90 transition-all"
                        >
                            + New Application
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Grid ── */}
            <section className="relative max-w-[90rem] mx-auto px-6 md:px-10 pb-20 pt-4">
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-32 bg-black/15 animate-pulse border border-white/20" />
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <div className="border border-red-500/40 bg-red-500/10 p-4 text-white text-sm">{error}</div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="py-24 text-center">
                        <p className="text-6xl mb-4 opacity-30">◫</p>
                        <p className="text-white text-sm tracking-widest uppercase">No applications yet.</p>
                        <p className="text-white/80 text-xs mt-2">{search || filter !== 'ALL' ? 'Try a different filter.' : 'Click "+ New Application" to begin.'}</p>
                    </div>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(app => <ApplicationCard key={app.id} app={app} />)}
                    </div>
                )}
            </section>

            {/* ── Footer line ── */}
            <div className="glow-line max-w-[90rem] mx-auto" />

            {/* ── Create Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="relative w-full max-w-md bg-[#2a0e06]/90 border border-white/20 p-8 shadow-2xl backdrop-blur-sm" onClick={e => e.stopPropagation()}>
                        {/* Corner lines */}
                        <span className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/30" />
                        <span className="absolute top-0 right-0 w-6 h-6 border-t border-r border-white/30" />
                        <span className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-white/30" />
                        <span className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/30" />

                        <h2 className="text-lg font-bold tracking-tight text-white mb-6">New Application</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            {(['company', 'role', 'location', 'source'] as const).map(key => {
                                const labels: Record<string, string> = { company: 'Company *', role: 'Role *', location: 'Location', source: 'Applied via' };
                                const placeholders: Record<string, string> = { company: 'e.g. Google', role: 'e.g. Software Engineer', location: 'e.g. Remote', source: 'e.g. LinkedIn' };
                                return (
                                    <div key={key}>
                                        <label className="block text-xs text-white/80 tracking-widest uppercase mb-1.5">{labels[key]}</label>
                                        <input
                                            type="text"
                                            value={form[key] || ''}
                                            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                            placeholder={placeholders[key]}
                                            className="w-full bg-black/20 border border-white/40 px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white transition-colors rounded-none"
                                        />
                                    </div>
                                );
                            })}
                            <div>
                                <label className="block text-xs text-white/80 tracking-widest uppercase mb-1.5">Notes</label>
                                <textarea
                                    rows={2}
                                    value={form.notes}
                                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                    placeholder="Any notes…"
                                    className="w-full bg-black/20 border border-white/40 px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white transition-colors resize-none rounded-none"
                                />
                            </div>
                            {formError && <p className="text-xs text-red-400">{formError}</p>}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold tracking-widest uppercase transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Creating…' : 'Create'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 border border-white/50 text-white/80 hover:text-white hover:border-white text-xs tracking-widest uppercase transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
