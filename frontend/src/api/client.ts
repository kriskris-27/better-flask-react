import type {
    Application,
    Contact,
    CreateApplicationPayload,
    CreateContactPayload,
    TransitionStatusPayload,
    ApiResponse,
} from '../types';

// In dev, Vite's proxy forwards /api → http://127.0.0.1:5000
// In production, set VITE_API_URL to your deployed backend URL
const BASE = import.meta.env.VITE_API_URL ?? '';

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const method = (options.method ?? 'GET').toUpperCase();
    const url = `${BASE}${path}`;

    console.log(`[API] ▶ ${method} ${url}`, options.body ? JSON.parse(options.body as string) : '');

    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    const json: ApiResponse<T> = await response.json();

    if (!json.success || !response.ok) {
        const message =
            typeof json.error === 'string'
                ? json.error
                : JSON.stringify(json.error);
        console.error(`[API] ✖ ${method} ${url} →`, response.status, json.error);
        throw new Error(message ?? `Request failed: ${response.status}`);
    }

    console.log(`[API] ✔ ${method} ${url} → ${response.status}`, json.data);
    return json.data as T;
}

// ── Applications ──────────────────────────────────────────────────────────────

/** Fetch all applications, optionally filtered by status */
export const getApplications = (status?: string): Promise<Application[]> => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<Application[]>(`/api/applications${qs}`);
};

/** Fetch a single application with contacts + history */
export const getApplication = (id: number): Promise<Application> =>
    request<Application>(`/api/applications/${id}`);

/** Create a new application */
export const createApplication = (
    data: CreateApplicationPayload
): Promise<Application> =>
    request<Application>('/api/applications', {
        method: 'POST',
        body: JSON.stringify(data),
    });

/** Transition application status (may trigger AI intel generation) */
export const transitionStatus = (
    id: number,
    payload: TransitionStatusPayload
): Promise<Application> =>
    request<Application>(`/api/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });

// ── Contacts ──────────────────────────────────────────────────────────────────

/** Create a contact linked to an application */
export const createContact = (data: CreateContactPayload): Promise<Contact> =>
    request<Contact>('/api/contacts', {
        method: 'POST',
        body: JSON.stringify(data),
    });

/** Delete a contact by ID */
export const deleteContact = (id: number): Promise<{ message: string }> =>
    request<{ message: string }>(`/api/contacts/${id}`, { method: 'DELETE' });
