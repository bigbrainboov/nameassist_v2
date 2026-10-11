/* SIRI.DEV */
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Gift,
  FileSpreadsheet,
  Users,
  FileCheck2,
  CreditCard,
  LogOut,
  Bell,
  Search,
  ExternalLink,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { User as AccountUser } from '../auth/api';
import type { AdminApplicationRecord } from './api';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  user: AccountUser | null;
  applications: AdminApplicationRecord[];
  onSignOut: () => void;
  signingOut: boolean;
}

export function AdminLayout({ children, currentPath, user, applications, onSignOut, signingOut }: AdminLayoutProps) {
  const currentUser = user ? { name: user.full_name, role: 'Administrator', email: user.email,
    avatarInitials: user.full_name.split(' ').filter(Boolean).slice(0, 2).map(name => name[0]).join('').toUpperCase() } : null;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const actionRequiredAppsCount = applications.filter(application => application.status === 'received').length;
  const pendingDocsCount = 0;

  const navItems = [
    {
      label: 'Overview',
      href: '#/admin',
      icon: LayoutDashboard,
      badge: null
    },
    {
      label: 'Applications',
      href: '#/admin/applications',
      icon: FileSpreadsheet,
      badge: actionRequiredAppsCount > 0 ? `${actionRequiredAppsCount} new` : `${applications.length}`
    },
    {
      label: 'Customers',
      href: '#/admin/customers',
      icon: Users,
      badge: null
    },
    {
      label: 'Documents',
      href: '#/admin/documents',
      icon: FileCheck2,
      badge: pendingDocsCount > 0 ? `${pendingDocsCount} review` : null
    },
    { label: 'Referrals', href: '#/admin/referrals', icon: Gift, badge: null },
    {
      label: 'Payments',
      href: '#/admin/payments',
      icon: CreditCard,
      badge: null
    }
  ];

  const handleSignOut = onSignOut;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      window.location.hash = `#/admin/applications?search=${encodeURIComponent(globalSearch.trim())}`;
    }
  };

  // Close mobile nav on path change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [currentPath]);

  // Clean path without query
  const cleanPath = currentPath.split('?')[0];

  const getPageTitle = () => {
    switch (cleanPath) {
      case '#/admin/applications':
        return 'Applications Docket & Stage Pipeline';
      case '#/admin/customers':
        return 'Customer Registry & KYC Management';
      case '#/admin/documents':
        return 'Customer Document Delivery';
      case '#/admin/referrals':
        return 'Referrals & Manual Payment Records';
      case '#/admin/payments':
        return 'Filing Fee & Statutory Revenue Ledger';
      case '#/admin':
      default:
        return 'Operations Overview & Executive Dashboard';
    }
  };

  const notificationPanel = (
<div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-white border border-[#DCEBE2] shadow-xl p-3 z-50 text-xs text-[#293B35]">
                  <div className="flex items-center justify-between border-b border-[#EDF3F0] pb-2 mb-2">
                    <span className="font-semibold text-[#12352C]">Operational Alerts</span>
                    <span className="text-[10px] text-[#006747] font-medium bg-[#EDF7F2] px-2 py-0.5 rounded">
                      Live Feed
                    </span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {applications.filter(application => application.status === 'received').slice(0, 5).map(application =>
                      <a key={application.id} href={`#/admin/applications?search=${encodeURIComponent(application.reference_no)}`}
                        onClick={() => setNotificationsOpen(false)} className="block p-2 rounded-lg bg-amber-50/70 border border-amber-200/60">
                        <p className="font-semibold text-amber-900">Paid application awaiting review</p>
                        <p className="mt-1 text-[11px] text-amber-800 break-all">{application.reference_no} · {application.customer_name}</p>
                      </a>)}
                    {!actionRequiredAppsCount && <p className="p-2 text-[#53645D]">No applications awaiting initial review.</p>}
                  </div>
                  <div className="border-t border-[#EDF3F0] mt-2 pt-2 text-center">
                    <a
                      href="#/admin/applications"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] text-[#006747] font-semibold hover:underline"
                    >
                      View All Active Applications →
                    </a>
                  </div>
                </div>
  );

  return (
    <div className="h-screen w-full bg-[#F7FAF8] text-[#293B35] flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Top Header */}
      <header className="lg:hidden shrink-0 bg-[#12352C] text-white px-4 py-3 flex items-center justify-between border-b border-[#294B40] z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-1.5 rounded-lg bg-white/10 text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <a href="#/admin" className="flex items-center gap-2">
            <span className="font-serif font-bold text-white text-base tracking-wide">NameAssist</span>
            <span className="text-[10px] bg-[#006747] px-1.5 py-0.5 rounded font-mono uppercase text-white/90">
              Admin
            </span>
          </a>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Operational notifications"
            aria-expanded={notificationsOpen}
            className="p-1.5 rounded-lg bg-white/10 text-white relative"
          >
            <Bell size={18} />
            {actionRequiredAppsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />
            )}
          </button>
          {notificationsOpen && notificationPanel}
          <div className="w-8 h-8 rounded-full bg-[#006747] text-white text-xs font-bold flex items-center justify-center">
            {currentUser?.avatarInitials || 'AD'}
          </div>
        </div>
      </header>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#12352C] text-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 lg:h-screen lg:shrink-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="shrink-0 p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <a href="#/admin" className="inline-block bg-white rounded-lg p-2.5 shadow-sm">
              <img src="/assets/nameassist-logo.png" alt="NameAssist" className="w-auto" />
            </a>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="lg:hidden p-1 text-white/70 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#A9D8C0]">
              Legal Registry Operations
            </p>
            {/* <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Desk
            </span> */}
          </div>
        </div>

        {/* Officer Profile Badge with Switcher */}
        <div className="shrink-0 px-4 py-3 mx-3 mt-3 rounded-xl bg-white/5 border border-white/10 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#006747] text-white font-semibold text-xs flex items-center justify-center shrink-0">
                {currentUser?.avatarInitials || 'AD'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{currentUser?.name || 'Admin'}</p>
                <p className="text-[10px] text-[#A9D8C0] truncate">{currentUser?.role || 'Administrator'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Account details"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {userDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#1A453A] border border-white/20 rounded-xl p-2 shadow-xl z-50">
              <p className="text-[10px] uppercase font-semibold text-[#A9D8C0] px-2 py-1">Account details</p>
              <p className="px-2 py-1 text-xs text-white/80 break-all">{currentUser?.email}</p>
              <div className="border-t border-white/10 mt-1 pt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-red-300 hover:bg-red-500/20 flex items-center gap-2"
                >
                  <LogOut size={12} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav aria-label="Admin navigation" className="mt-4 px-3 flex-1 space-y-1 overflow-y-auto min-h-0">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = cleanPath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-white text-[#12352C] font-semibold shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={16} className={isActive ? 'text-[#006747]' : 'text-white/70'} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[#12352C] text-white'
                        : item.badge.includes('alert')
                        ? 'bg-amber-400 text-amber-950 font-bold'
                        : 'bg-white/15 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Bottom Navigation & External Links */}
        <div className="shrink-0 p-4 border-t border-white/10 space-y-2 bg-[#0E2C24]">
          <div className="text-[11px] text-[#A9D8C0] font-medium flex items-center gap-1.5">
            <Building2 size={13} />
            <span>NameAssist Operations</span>
          </div>

          <div className="pt-2 flex flex-col gap-1.5">
            <a
              href="#/dashboard"
              className="flex items-center justify-between text-xs text-white/75 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded transition"
            >
              <span>Client Portal</span>
              <ExternalLink size={12} />
            </a>
            <a
              href="#hero"
              className="flex items-center justify-between text-xs text-white/75 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded transition"
            >
              <span>Public Website</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
                  disabled={signingOut}
            className="w-full mt-2 text-left text-xs text-white/60 hover:text-red-300 px-2.5 py-1.5 rounded hover:bg-white/5 transition flex items-center gap-2"
          >
            <LogOut size={13} />
            <span>Sign out of Admin</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Main Workspace Body */}
      <div className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        {/* Desktop Topbar */}
        <header className="hidden lg:flex shrink-0 items-center justify-between border-b border-[#DCEBE2] bg-white px-8 py-3.5 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#12352C]">{getPageTitle()}</h2>
              <p className="text-xs text-[#53645D]">
                Official legal intake & federal gazetting workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Case / Customer Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[#53645D]/60" />
              <input
                type="text"
                placeholder="Search case ref, applicant, email…"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                className="w-64 rounded-lg border border-[#CCDAD2] pl-8 pr-3 py-1.5 text-xs bg-[#F7FAF8] focus:bg-white focus:border-[#006747] focus:ring-1 focus:ring-[#006747] outline-none transition"
              />
            </form>

            {/* Notifications Alert Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Operational notifications"
            aria-expanded={notificationsOpen}
                className="p-2 rounded-lg border border-[#DCEBE2] hover:bg-[#F7FAF8] text-[#293B35] relative transition"
                title="Operational Notifications"
              >
                <Bell size={16} />
                {actionRequiredAppsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
                )}
              </button>

              {notificationsOpen && notificationPanel}
            </div>

            {/* Quick Officer Badge */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#DCEBE2]">
              <div className="w-8 h-8 rounded-full bg-[#12352C] text-white font-semibold text-xs flex items-center justify-center">
                {currentUser?.avatarInitials || 'AD'}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[#12352C] leading-none">{currentUser?.name}</p>
                <p className="text-[10px] text-[#006747] font-medium mt-0.5">{currentUser?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto min-h-0 w-full">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
