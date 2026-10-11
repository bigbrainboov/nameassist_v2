/* SIRI.DEV */
import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Files,
  Folder,
  Wallet,
  MessageCircle,
  LogOut,
  Globe,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import { ProfileView } from './ProfileView';
import { VerificationNotice } from '../auth/VerificationNotice';
import { useAuth } from '../auth/AuthContext';
import { type DashboardTab } from '../types';
import { PaymentReturn } from '../applications/PaymentControls';
import { LiveDashboard } from '../applications/LiveDashboard';
import { NewApplicationModal } from '../applications/NewApplicationModal';

interface UserDashboardProps {
  initialTab?: DashboardTab;
  preselectedServiceId?: string;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  initialTab = 'dashboard',
  preselectedServiceId
}) => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);
  function navigate(tab: DashboardTab) {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
    window.location.hash = tab === 'dashboard' ? '#/dashboard' : `#/dashboard/${tab}`;
  }
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [revision, setRevision] = useState(0);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      window.location.hash = '#hero';
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications' as const, label: 'My Applications', icon: Files },
    { id: 'documents' as const, label: 'My Documents', icon: Folder },
    { id: 'payments' as const, label: 'Payments', icon: Wallet },
    { id: 'profile' as const, label: 'My Profile', icon: UserIcon },
    { id: 'support' as const, label: 'Support', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen bg-[#F7FAF8] flex flex-col lg:flex-row text-[#293B35]">
      {/* Mobile Top App Bar */}
      <div className="lg:hidden bg-[#00513B] text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          <div className="bg-white rounded-lg px-2.5 py-1">
            <img
              src="/assets/nameassist-logo.png"
              alt="NameAssist"
              className="h-5 w-auto"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { window.location.hash = '#hero'; }}
            className="text-xs text-[#A9D8C0] hover:text-white flex items-center gap-1"
          >
            <Globe size={13} />
            Website
          </button>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 lg:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar (Matching Screenshot Exact Structure & Tokens) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#00513B] text-white flex flex-col justify-between p-5 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Logo Card Top (Clean white rounded box as in screenshot) */}
          <div className="flex items-center justify-between">
            <div className="bg-white rounded-xl p-3 w-full shadow-xs flex items-center justify-center">
              <img
                src="/assets/nameassist-logo.png"
                alt="NameAssist"
                className="w-36 h-auto"
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden ml-2 p-1.5 text-white/80 hover:text-white"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links (Matching Screenshot Pill Buttons) */}
          <nav className="space-y-1.5" aria-label="User Portal Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigate(item.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold shadow-xs'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-white/70'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4 pt-6">
          {/* WhatsApp Help Widget (Matching Screenshot Card) */}
          <a
            href="https://wa.me/2348142009941?text=Hello%20NameAssist%20Support%2C%20I%20need%20assistance%20with%20my%20dashboard%20account."
            target="_blank"
            rel="noreferrer"
            className="block bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-3 text-xs text-white transition group"
          >
            <div className="flex items-center justify-between font-medium">
              <span>Need help?</span>
              <span className="text-[#A9D8C0] group-hover:underline flex items-center gap-0.5 text-[11px]">
                Chat on WhatsApp ↗
              </span>
            </div>
            <p className="text-[11px] text-white/70 mt-1">
              Direct line to our Lagos & Abuja legal desks.
            </p>
          </a>

          {/* Return to Public Website */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#hero';
            }}
            className="w-full flex items-center justify-between text-xs text-white/70 hover:text-white py-1 transition"
          >
            <span className="flex items-center gap-1.5">
              <Globe size={14} />
              Return to Website
            </span>
            <ChevronRight size={14} />
          </button>

          {/* User Profile & Logout */}
          <div className="border-t border-white/10 pt-3 flex items-center justify-between">
            <button type="button" onClick={() => navigate('profile')} aria-label="Open your profile" className="flex items-center gap-2.5 min-w-0 text-left rounded-lg hover:bg-white/5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate max-w-[110px]" title={user?.full_name || 'Client'}>
                  {user?.full_name || 'Client'}
                </p>
                <p className="text-[10px] text-white/60 truncate max-w-[110px]" title={user?.email}>
                  {user?.email || 'client@portal.ng'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={loggingOut}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Log out"
              aria-label="Log out of account"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full min-w-0">
        <VerificationNotice />
        <PaymentReturn onUpdated={() => setRevision(n => n + 1)}/>
        {activeTab === 'profile' ? <ProfileView key={user?.id} /> : <LiveDashboard onUpdated={() => setRevision(n => n + 1)} activeTab={activeTab} revision={revision} userName={user?.full_name || 'Client'}
          onStart={() => setIsNewAppModalOpen(true)} onNavigate={navigate}/>}
      </main>
      {isNewAppModalOpen && <NewApplicationModal preferredService={preselectedServiceId}
        onClose={() => setIsNewAppModalOpen(false)}
        onSubmitted={() => { setRevision(value => value + 1); navigate('applications'); }}/>}
    </div>
  );
};
