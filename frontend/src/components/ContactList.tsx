import { useState } from 'react';
import type { Contact, CreateContactPayload } from '../types';
import { createContact, deleteContact } from '../api/client';

interface Props {
    applicationId: number;
    contacts: Contact[];
    onUpdate: (contacts: Contact[]) => void;
}

export default function ContactList({ applicationId, contacts, onUpdate }: Props) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState<Omit<CreateContactPayload, 'application_id'>>({
        name: '', role: '', email: '', linkedin: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const newContact = await createContact({ ...form, application_id: applicationId });
            onUpdate([...contacts, newContact]);
            setForm({ name: '', role: '', email: '', linkedin: '' });
            setAdding(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create contact');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        try {
            await deleteContact(id);
            onUpdate(contacts.filter(c => c.id !== id));
        } catch {
            // silently ignore or show toast
        }
    }

    return (
        <div className="space-y-4">
            {contacts.length === 0 && !adding && (
                <div className="border border-white/10 p-10 text-center">
                    <p className="text-xs text-white/30 tracking-widest uppercase">No contacts recorded</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map(c => (
                    <div key={c.id} className="group relative bg-black/15 border border-white/20 p-5 backdrop-blur-sm transition-all hover:bg-black/25">
                        {/* Corner decorator */}
                        <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/0 group-hover:border-white/40 transition-all" />

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 border border-white/40 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                                {c.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-sm truncate uppercase tracking-tight">{c.name}</p>
                                {c.role && <p className="text-xs text-white/60 tracking-wide mt-0.5">{c.role}</p>}

                                <div className="flex flex-wrap gap-3 mt-3">
                                    {c.email && (
                                        <a href={`mailto:${c.email}`} className="text-[10px] text-white/80 border-b border-white/20 hover:border-white transition-all uppercase tracking-widest">Email</a>
                                    )}
                                    {c.linkedin && (
                                        <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-[10px] text-white/80 border-b border-white/20 hover:border-white transition-all uppercase tracking-widest">LinkedIn</a>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(c.id)}
                                className="text-white/20 hover:text-white transition-colors text-xl leading-none"
                                title="Delete contact"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {adding ? (
                <form onSubmit={handleAdd} className="relative bg-[#2a0e06]/60 border border-white/30 p-6 space-y-5 backdrop-blur-md">
                    <h4 className="text-xs font-black text-white tracking-[0.2em] uppercase border-b border-white/10 pb-3">New Intelligence Contact</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {[
                            { key: 'name', label: 'Name *', type: 'text' },
                            { key: 'role', label: 'Role', type: 'text' },
                            { key: 'email', label: 'Email', type: 'email' },
                            { key: 'linkedin', label: 'LinkedIn URL', type: 'url' },
                        ].map(f => (
                            <div key={f.key}>
                                <label className="block text-[10px] text-white/50 tracking-widest uppercase mb-1.5">{f.label}</label>
                                <input
                                    type={f.type}
                                    value={(form as Record<string, string>)[f.key]}
                                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                    className="w-full bg-black/20 border border-white/30 px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white transition-all rounded-none"
                                    placeholder={`Enter ${f.key.toLowerCase()}...`}
                                />
                            </div>
                        ))}
                    </div>
                    {error && <p className="text-xs text-red-300 font-medium">{error}</p>}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 bg-white text-orange-900 text-xs font-black tracking-widest uppercase hover:bg-white/90 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Recording…' : 'Record Contact'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setAdding(false)}
                            className="px-6 border border-white/40 text-white/70 hover:text-white hover:border-white text-xs tracking-widest uppercase transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setAdding(true)}
                    className="text-xs text-white font-bold tracking-widest uppercase underline underline-offset-4 hover:no-underline transition-all"
                >
                    + Add Intelligence Contact
                </button>
            )}
        </div>
    );
}
