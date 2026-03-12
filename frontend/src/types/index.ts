// ── Domain types ──────────────────────────────────────────────────────────────

export type ApplicationStatus =
    | 'APPLIED'
    | 'SCREENING'
    | 'INTERVIEWING'
    | 'OFFERED'
    | 'ACCEPTED'
    | 'REJECTED';

export interface StatusHistory {
    id: number;
    application_id: number;
    from_status: ApplicationStatus | null;
    to_status: ApplicationStatus;
    note: string | null;
    changed_at: string; // ISO timestamp
}

export interface Contact {
    id: number;
    application_id: number;
    name: string;
    role: string | null;
    email: string | null;
    linkedin: string | null;
}

export interface Application {
    id: number;
    company: string;
    role: string;
    location: string | null;
    source: string | null;
    status: ApplicationStatus;
    notes: string | null;
    interview_intel: string | null;
    applied_on: string | null;
    created_at: string;
    updated_at: string;
    contacts: Contact[];
    history: StatusHistory[];
}

// ── API payload types ─────────────────────────────────────────────────────────

export interface CreateApplicationPayload {
    company: string;
    role: string;
    location?: string;
    source?: string;
    notes?: string;
}

export interface TransitionStatusPayload {
    to_status: ApplicationStatus;
    note?: string;
}

export interface CreateContactPayload {
    application_id: number;
    name: string;
    role?: string;
    email?: string;
    linkedin?: string;
}

// ── API response wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | Record<string, string[]> | null;
}
