/* SIRI.DEV */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Senior Legal Registrar' | 'Diaspora Legal Lead' | 'Corporate Counsel' | 'Super Admin';
  department: string;
  avatarInitials: string;
}

export const DEMO_ADMIN_USERS: AdminUser[] = [
  {
    id: 'adm-01',
    name: 'Barr. Chinedu Obi',
    email: 'chinedu.obi@nameassist.ng',
    role: 'Senior Legal Registrar',
    department: 'Lagos High Court & Gazette Operations',
    avatarInitials: 'CO'
  },
  {
    id: 'adm-02',
    name: 'Funke Balogun',
    email: 'funke.balogun@nameassist.ng',
    role: 'Diaspora Legal Lead',
    department: 'Diaspora & Consular Legalisation',
    avatarInitials: 'FB'
  },
  {
    id: 'adm-03',
    name: 'Barr. Amina Al-Hassan',
    email: 'amina.alhassan@nameassist.ng',
    role: 'Corporate Counsel',
    department: 'CAC & Commercial Registry Unit',
    avatarInitials: 'AA'
  }
];

const ADMIN_SESSION_KEY = 'nameassist.admin_session';

export function getActiveAdminUser(): AdminUser | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fallback */
  }
  // Default to senior registrar for smooth preview experience if none set
  return DEMO_ADMIN_USERS[0];
}

export function setActiveAdminUser(user: AdminUser | null): void {
  try {
    if (user) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
}
