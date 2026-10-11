/* SIRI.DEV */
import { setPreviewAccount } from '../applications/previewCache';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  email_verified: boolean;
  referral_code: string | null;
  bank_name: string;
  account_number: string;
  account_name: string;
}
interface Tokens { access: string; refresh: string }
export interface AuthResult extends Tokens { user: User }
const API_BASE_URL = (import.meta.env.VITE_API_URL || (import.meta.env.PROD
  ? 'https://nameassist-api.onrender.com/api/v1'
  : '/api/v1')).replace(/\/$/, '');
const key = 'nameassist.session';
let tokens: Tokens | null = null;
try { tokens = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { /* No saved session. */ }
let refreshing: Promise<void> | null = null;
let sessionEpoch = 0;

export class ApiError extends Error {
  constructor(public status: number, public details: Record<string, string | string[]>) {
    super(typeof details.detail === 'string' ? details.detail : 'Please check the details below.');
  }
}
export function saveSession(value: Tokens | null) {
  sessionEpoch++;
  persistTokens(value);
}
function persistTokens(value: Tokens | null) {
  if (!value) setPreviewAccount(null);
  tokens = value ? { access: value.access, refresh: value.refresh } : null;
  try {
    if (tokens) sessionStorage.setItem(key, JSON.stringify(tokens));
    else sessionStorage.removeItem(key);
  } catch { /* Authentication still works in memory when storage is unavailable. */ }
}
async function request<T>(path: string, body?: unknown, access?: string, format: 'json' | 'blob' = 'json', method?: 'POST' | 'DELETE' | 'PATCH'): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: method || (body === undefined ? 'GET' : 'POST'),
      headers: { ...(body === undefined || body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(access ? { Authorization: `Bearer ${access}` } : {}) },
      ...(body === undefined ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) }),
    });
  } catch { throw new Error('Unable to reach NameAssist. Please check your connection and try again.'); }
  if (response.ok && format === 'blob') return await response.blob() as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, response.status >= 500
    ? { detail: 'Something went wrong. Please try again shortly.' } : data);
  return data;
}
export const signup = (data: { full_name: string; email: string; password: string }) => request<AuthResult>('/auth/signup/', data);
export const login = (data: { email: string; password: string }) => request<AuthResult>('/auth/login/', data);
export const googleLogin = (data: { id_token: string }) => request<AuthResult>('/auth/google/', data);
async function withAuthentication<T>(operation: (access: string) => Promise<T>): Promise<T> {
  if (!tokens) throw new ApiError(401, { detail: 'Please log in to continue.' });
  const epoch = sessionEpoch;
  const session = tokens;
  const checkSession = () => {
    if (epoch !== sessionEpoch || !tokens) throw new ApiError(401, { detail: 'Your session changed. Please try again.' });
  };
  try {
    const result = await operation(session.access);
    checkSession();
    return result;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    checkSession();
    // A concurrent request may already have rotated the token for this same session.
    if (tokens === session) {
      if (!refreshing) {
        refreshing = request<Tokens>('/auth/token/refresh/', { refresh: session.refresh })
          .then(next => { if (tokens === session) persistTokens(next); })
          .finally(() => { refreshing = null; });
      }
      await refreshing;
    }
    checkSession();
    const result = await operation(tokens!.access);
    checkSession();
    return result;
  }
}

export function authenticatedRequest<T>(path: string, body?: unknown, format: 'json' | 'blob' = 'json', method?: 'POST' | 'DELETE' | 'PATCH'): Promise<T> {
  return withAuthentication(access => request<T>(path, body, access, format, method));
}

export type UploadProgress = { phase: 'uploading' | 'saving'; percent: number | null };

function uploadRequest<T>(path: string, body: FormData, access: string, progress: (value: UploadProgress) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${access}`);
    xhr.timeout = 180000;
    xhr.upload.onprogress = event => progress({ phase: 'uploading', percent: event.lengthComputable
      ? Math.min(100, Math.round(event.loaded / event.total * 100)) : null });
    xhr.upload.onload = () => progress({ phase: 'saving', percent: 100 });
    xhr.onerror = () => reject(new Error('Connection lost. Your upload may have completed; refresh your documents before retrying.'));
    xhr.ontimeout = () => reject(new Error('The upload took too long. Check your documents before retrying.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));
    xhr.onload = () => {
      let data;
      try { data = JSON.parse(xhr.responseText); }
      catch { reject(new Error('The server returned an unreadable response. Refresh your documents before retrying.')); return; }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError(xhr.status, xhr.status >= 500 ? { detail: 'Unable to save the document. Please try again shortly.' } : data));
    };
    progress({ phase: 'uploading', percent: 0 });
    xhr.send(body);
  });
}

export function authenticatedUpload<T>(path: string, body: FormData, progress: (value: UploadProgress) => void): Promise<T> {
  return withAuthentication(access => uploadRequest<T>(path, body, access, progress));
}

export async function restoreUser() {
  return tokens ? authenticatedRequest<User>('/auth/me/') : null;
}
export async function logout() {
  // Wait for any rotation so the latest refresh token is revoked.
  try { await refreshing; } catch { /* Expired sessions can still be cleared. */ }
  const refresh = tokens?.refresh;
  if (refresh) {
    try { await request('/auth/logout/', { refresh }); }
    catch (error) { if (!(error instanceof ApiError && error.status === 401)) throw error; }
  }
  saveSession(null);
}

export const requestPasswordReset = (email: string) => request<{ message: string }>('/auth/password-reset/', { email });
export const confirmPasswordReset = (token: string, new_password: string) => request<{ message: string }>('/auth/password-reset/confirm/', { token, new_password });
export const verifyEmail = (token: string) => request<{ message: string }>('/auth/verify-email/', { token });
export const resendVerification = () => authenticatedRequest<{ message: string }>('/auth/verify-email/resend/', {});


export type ProfileDetails = Pick<User, 'full_name' | 'phone' | 'bank_name' | 'account_number' | 'account_name'>;
export const getProfile = () => authenticatedRequest<User>('/auth/me/');
export const updateProfile = (details: Partial<ProfileDetails>) => authenticatedRequest<ProfileDetails>('/auth/me/', details, 'json', 'PATCH');
