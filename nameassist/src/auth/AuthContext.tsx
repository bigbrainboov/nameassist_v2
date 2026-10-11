/* SIRI.DEV */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiError, type AuthResult, type User, type ProfileDetails, logout, restoreUser, saveSession } from './api';
import { setPreviewAccount } from '../applications/previewCache';

const Context = createContext<{
  user: User | null; loading: boolean; error: string;
  completeAuth: (result: AuthResult) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearSession: () => void;
  applyProfile: (userId: string, details: ProfileDetails) => void;
}>({ user: null, loading: true, error: '', completeAuth: () => {}, signOut: async () => {}, refreshUser: async () => {}, clearSession: () => {}, applyProfile: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    restoreUser().then(value => { if (active) { setPreviewAccount(value?.id || null); setUser(value); } }).catch(err => {
      if (!active) return;
      if (err instanceof ApiError && err.status === 401) saveSession(null);
      else setError('We could not restore your session. Refresh the page to try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  function completeAuth(result: AuthResult) { saveSession(result); setPreviewAccount(result.user.id); setUser(result.user); setError(''); }
  function applyProfile(userId: string, details: ProfileDetails) {
    setUser(current => current?.id === userId ? { ...current, ...details } : current);
  }
  function clearSession() { saveSession(null); setUser(null); setError(''); }
  async function refreshUser() {
    const current = await restoreUser();
    setUser(current);
    setPreviewAccount(current?.id || null);
  }
  async function signOut() {
    setError('');
    try { await logout(); setUser(null); }
    catch { setError('Unable to log out. Please check your connection and try again.'); }
  }
  return <Context.Provider value={{ user, loading, error, completeAuth, signOut, refreshUser, clearSession, applyProfile }}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
