/* SIRI.DEV */
import type { User } from '../auth/api';
import type { ApplicationRecord, DocumentRecord } from '../applications/api';
export interface AdminApplicationRecord extends ApplicationRecord {
  customer_name: string; customer_email: string; allowed_transitions: string[];
}
type Tokens = { access: string; refresh: string };
const key = 'nameassist.admin.tokens';
const base = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://nameassist-api.onrender.com/api/v1' : '/api/v1')).replace(/\/$/, '');
let tokens: Tokens | null = null;
try { tokens = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { /* No saved session. */ }
let refreshing: Promise<void> | null = null;
export class AdminApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function save(value: Tokens | null) {
  tokens = value;
  try { if (value) sessionStorage.setItem(key, JSON.stringify(value)); else sessionStorage.removeItem(key); } catch { /* Keep in memory. */ }
}
async function request<T>(path: string, body?: unknown, access?: string, blob = false): Promise<T> {
  const response = await fetch(`${base}${path}`, { method: body === undefined ? 'GET' : 'POST',
    headers: { ...(access ? { Authorization: `Bearer ${access}` } : {}), ...(body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) },
    ...(body !== undefined ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}) });
  if (response.ok && blob) return await response.blob() as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new AdminApiError(response.status, response.status >= 500 ? 'Unable to reach the admin service. Please retry.' :
    typeof data.detail === 'string' ? data.detail : Object.values(data).flat().join(' ') || 'Request failed. Please retry.');
  return data;
}
export async function adminLogin(email: string, password: string, otp: string) {
  const result = await request<Tokens & { user: User }>('/admin/auth/login/', { email, password, otp });
  save({ access: result.access, refresh: result.refresh });
}
export async function adminRequest<T>(path: string, body?: unknown, blob = false): Promise<T> {
  if (!tokens) throw new AdminApiError(401, 'Please sign in with your admin account.');
  try { return await request<T>(path, body, tokens.access, blob); }
  catch (error) {
    if (!(error instanceof AdminApiError) || error.status !== 401) throw error;
    if (!refreshing) {
      const previous = tokens;
      refreshing = request<Tokens>('/auth/token/refresh/', { refresh: previous.refresh })
        .then(next => { if (tokens === previous) save(next); })
        .catch(error => { if (error instanceof AdminApiError && error.status === 401 && tokens === previous) save(null); throw error; })
        .finally(() => { refreshing = null; });
    }
    await refreshing;
    if (!tokens) throw new AdminApiError(401, 'Please sign in again.');
    return request<T>(path, body, tokens.access, blob);
  }
}
export async function adminLogout() {
  try { await refreshing; } catch { /* Expired session can be cleared. */ }
  if (tokens) {
    try { await request('/auth/logout/', { refresh: tokens.refresh }); }
    catch (error) { if (!(error instanceof AdminApiError && error.status === 401)) throw error; }
  }
  save(null);
}
export async function adminList<T>(resource: string): Promise<T[]> {
  const records: T[] = [];
  for (let page = 1; ; page++) {
    const result = await adminRequest<{ results: T[]; next: string | null }>(`/admin/${resource}${resource.includes('?') ? '&' : '?'}page=${page}`);
    records.push(...result.results);
    if (!result.next) return records;
  }
}
export const loadAdminDocument = (id: string) => adminRequest<Blob>(`/admin/documents/${id}/content/`, undefined, true);


export interface ReferralRewardRecord {
  id: string; referrer: string; referred_user: string; referrer_name: string; referrer_email: string;
  referred_name: string; referred_email: string; referral_code: string | null;
  bank_name: string; account_number: string; account_name: string;
  amount: string; status: 'pending' | 'paid'; payment_method: '' | 'manual' | 'legacy' | 'legacy_mock';
  disbursed_at: string | null; gateway_reference: string | null; created_at: string;
}
export interface ReferralHistoryEvent {
  id: string; actor_email: string; action: string; created_at: string;
  before: Record<string, unknown>; after: Record<string, unknown>;
}
export interface ManualReferralPayment {
  reward_id: string; amount: string; payment_reference: string; confirmed_paid: boolean; note: string;
  bank_details: { bank_name: string; account_number: string; account_name: string };
}
export function uploadAdminDocument(application: string, file: File, doc_type: string) {
  const form = new FormData();
  form.set('application', application); form.set('file', file); form.set('doc_type', doc_type);
  return adminRequest<DocumentRecord>('/admin/documents/upload/', form);
}
export const recordReferralPayment = (details: ManualReferralPayment) => adminRequest<ReferralRewardRecord>('/admin/referral-rewards/disburse/', details);
export const getReferralHistory = (id: string) => adminRequest<ReferralHistoryEvent[]>(`/admin/referral-rewards/${id}/history/`);
export function adminErrorMessage(error: unknown): string {
  if (error instanceof AdminApiError && error.status === 401) window.location.hash = '#/admin/login';
  return error instanceof Error ? error.message : 'Unable to complete this request. Please try again.';
}
