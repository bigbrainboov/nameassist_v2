/* SIRI.DEV */
import React, { useState } from 'react';
import { LayoutDashboard, Files, Folder, Wallet, MessageCircle, ArrowUpRight, Lock } from 'lucide-react';
import { RECENT_CASES } from '../data';
import { useAuth } from '../auth/AuthContext';

export const ClientDashboardPreview: React.FC<{ onSelectCase: (id: string) => void }> = ({ onSelectCase }) => {
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();
  const cases = RECENT_CASES.filter(c => filter === 'all' || (filter === 'completed' ? c.statusVariant === 'completed' : c.statusVariant !== 'completed'));

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
      <div className="text-center mb-9">
        <p className="text-xs uppercase tracking-widest text-[#006747] font-semibold mb-2">Everything in one place</p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Your journey. A little more organised.</h2>
        <p className="text-sm text-[#53645D] mt-3 max-w-xl mx-auto">
          A dedicated client portal to manage applications, track High Court appearances, download verified documents, and view official Gazette publications.
        </p>
        <div className="mt-4">
          <a
            href={user ? '#/dashboard' : '#/login'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006747] text-white hover:bg-[#00513B] font-semibold text-xs sm:text-sm transition shadow-sm"
          >
            <LayoutDashboard size={15} />
            <span>{user ? 'Open Your Client Dashboard' : 'Log In to Access Client Dashboard'}</span>
            <ArrowUpRight size={15} />
          </a>
        </div>
      </div>

      <div className="flex border border-[#E5ECE8] rounded-2xl overflow-hidden shadow-xl shadow-green-950/5">
        <aside className="hidden md:flex w-56 shrink-0 bg-[#00513B] text-white p-5 flex-col justify-between">
          <div>
            <div className="bg-white rounded-xl p-2.5 mb-6 flex items-center justify-center">
              <img src="/assets/nameassist-logo.png" alt="NameAssist" className="w-36 h-auto" />
            </div>
            <div className="space-y-1">
              {[
                [LayoutDashboard, 'Dashboard', '#/dashboard'],
                [Files, 'My Applications', '#/dashboard/applications'],
                [Folder, 'My Documents', '#/dashboard/documents'],
                [Wallet, 'Payments', '#/dashboard/payments'],
                [MessageCircle, 'Support', '#/dashboard/support']
              ].map(([Icon, label, href], i) => {
                const Mark = Icon as typeof Files;
                return (
                  <a
                    key={String(label)}
                    href={String(href)}
                    className={`flex gap-3 items-center text-xs px-3.5 py-2.5 rounded-xl transition ${
                      i === 0 ? 'bg-white/15 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Mark size={16} />
                    {String(label)}
                  </a>
                );
              })}
            </div>
          </div>
          <a
            href="https://wa.me/2348142009941"
            target="_blank"
            rel="noreferrer"
            className="bg-white/10 hover:bg-white/15 rounded-xl p-3 text-xs text-white transition block mt-6"
          >
            Need help?
            <span className="block mt-1 text-white/70">Chat with us on WhatsApp ↗</span>
          </a>
        </aside>

        <div className="p-5 sm:p-8 flex-1 min-w-0 bg-[#FBFCFB]">
          <div className="flex flex-wrap justify-between gap-2 items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-[#102B23]">Welcome back 👋</h3>
              <p className="text-xs text-gray-500 mt-1">Here’s what’s happening with your applications.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold bg-[#EDF7F2] text-[#006747] px-2.5 py-1 rounded-full border border-[#006747]/15">
                DEMO DASHBOARD
              </span>
              <a
                href={user ? '#/dashboard' : '#/login'}
                className="text-xs font-semibold text-[#006747] hover:underline inline-flex items-center gap-1"
              >
                Full View ↗
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
            {[
              ['5', 'Sample Applications'],
              ['3', 'In Progress'],
              ['2', 'Completed'],
              ['₦45,000', 'Sample Payment']
            ].map(([value, label]) => (
              <div key={label} className="bg-white border border-[#E8EEEA] rounded-xl p-4 text-center shadow-xs">
                <strong className="text-xl sm:text-2xl text-[#102B23] font-mono">{value}</strong>
                <p className="text-[11px] text-gray-500 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
            <h4 className="font-semibold text-sm text-[#102B23]">Recent Applications</h4>
            <div className="flex gap-1 bg-[#F0F5F2] p-1 rounded-lg border border-[#E5ECE8]">
              {['all', 'processing', 'completed'].map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`text-[10px] px-2.5 py-1 rounded-md capitalize font-medium transition ${
                    f === filter ? 'bg-white text-[#006747] shadow-xs font-semibold' : 'text-gray-500'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="bg-[#EDF7F2] text-[#53645D]">
                <tr>
                  {['Service', 'Application ID', 'Status', 'Action'].map(h => (
                    <th key={h} className="p-3 font-semibold text-[11px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cases.map(c => (
                  <tr key={c.id} className="hover:bg-white transition-colors">
                    <td className="p-3 font-medium text-[#102B23]">{c.service}</td>
                    <td className="p-3 text-gray-500 font-mono">{c.id}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                        c.statusVariant === 'completed' ? 'bg-[#E8F5EE] text-[#006747]' : 'bg-[#FEF3D6] text-[#925B00]'
                      }`}>
                        {c.statusText}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (user) {
                            window.location.hash = '#/dashboard';
                          } else {
                            onSelectCase(c.id);
                          }
                        }}
                        className="text-[#006747] hover:text-[#004730] border border-[#B8D8C8] hover:border-[#006747] bg-white rounded-lg px-3 py-1 flex items-center gap-1 font-medium transition shadow-xs"
                      >
                        View <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

