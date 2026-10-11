/* SIRI.DEV */
import React, { useState } from 'react';
import { Search, Menu, X, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface NavbarProps {
  onStartApplication: () => void;
  onTrackApplication: () => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onStartApplication,
  onTrackApplication,
  onOpenSearch
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const accountControls = loading ? <span className="text-xs" role="status">Checking session…</span> : user ? <>
    <a
      href="#/dashboard"
      onClick={() => setMobileMenuOpen(false)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDF7F2] text-[#006747] hover:bg-[#d8ece1] font-semibold text-xs transition"
      title="Open Client Dashboard"
    >
      <LayoutDashboard size={13} />
      <span>Dashboard</span>
    </a>
    <span className="max-w-28 truncate text-xs text-gray-700 font-medium" title={user.full_name}>{user.full_name}</span>
    <button type="button" disabled={loggingOut} onClick={async () => {
      setLoggingOut(true);
      try { await signOut(); } finally { setLoggingOut(false); }
    }} className="text-xs font-medium text-gray-500 hover:text-red-700 transition disabled:opacity-50">{loggingOut ? 'Logging out…' : 'Log out'}</button>
  </> : <>
    <a href="#/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#006747]">Log in</a>
    <a href="#/signup" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#006747]">Sign up</a>
  </>;

  const navLinks = [
    { label: 'Home', href: '#hero' },
    ...(user ? [{ label: 'Dashboard', href: '#/dashboard' }] : []),
    { label: 'Services', href: '#services' },
    { label: 'Nigerians Abroad', href: '#diaspora' },
    
    { label: 'How It Works', href: '#workflow' },
    { label: 'Resources', href: '#guide' },
    { label: 'About Us', href: '#trust' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-xs border-b border-[#12352C]/15 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 gap-4 flex items-center justify-between">
        {/* Logo & Tagline */}
        <a href="#hero" aria-label="NameAssist home" className="shrink-0 focus:outline-none focus:ring-2 focus:ring-[#006747] rounded-xs p-1">
          <img
            src="/assets/nameassist-logo.png"
            alt="NameAssist — Change. Correct. Simplify."
            width={2206}
            height={713}
            className="block w-40 sm:w-44 h-auto"
          />
        </a>

        {/* Desktop Links */}
        <nav className="hidden xl:flex items-center space-x-4 text-[12px] font-sans text-[#293B35]" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[#293B35] hover:text-[#006747] transition-colors py-1 focus:outline-none focus:ring-2 focus:ring-[#006747] rounded-xs"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="hidden sm:flex items-center space-x-3">
          {accountControls}
          <button
            type="button"
            onClick={onOpenSearch}
            className="p-2 text-[#12352C] hover:text-[#006747] hover:bg-[#EDF7F2]/60 border border-transparent hover:border-[#12352C]/20 transition-all rounded-xs focus:outline-none focus:ring-2 focus:ring-[#006747]"
            aria-label="Search services and documentation requirements"
            title="Search services"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onTrackApplication}
            className="px-3.5 py-2 text-xs md:text-sm font-sans font-medium text-[#12352C] border border-[#12352C] hover:bg-[#EDF7F2]/60 transition-all rounded-xs focus:outline-none focus:ring-2 focus:ring-[#006747]"
          >
            Track Application
          </button>

          <button
            type="button"
            onClick={onStartApplication}
            className="px-4 py-2 text-xs md:text-sm font-sans font-medium text-white bg-[#006747] hover:bg-[#0b4834] transition-all rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#006747] focus:ring-offset-1 focus:ring-offset-[#FFFFFF]"
          >
            Start Application
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex xl:hidden items-center space-x-2">
          <button
            type="button"
            onClick={onTrackApplication}
            className="sm:hidden px-2.5 py-1.5 text-xs font-sans font-medium text-[#12352C] border border-[#12352C] rounded-xs"
          >
            Track
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#12352C] border border-[#12352C]/30 rounded-xs focus:outline-none focus:ring-2 focus:ring-[#006747]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#12352C]/15 bg-[#FFFFFF] px-4 pt-3 pb-5 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-base font-sans text-[#293B35] border-b border-[#12352C]/10 hover:text-[#006747]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-2 flex flex-col space-y-2">
            <div className="flex items-center gap-4 py-2 sm:hidden">{accountControls}</div>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onStartApplication();
              }}
              className="w-full py-2.5 text-center text-sm font-medium text-white bg-[#006747] rounded-[4px]"
            >
              Start Application
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSearch();
              }}
              className="w-full py-2 text-center text-sm font-medium text-[#12352C] border border-[#12352C]/30 rounded-xs flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search Services
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
