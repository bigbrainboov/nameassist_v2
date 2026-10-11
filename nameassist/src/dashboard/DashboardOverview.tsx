/* SIRI.DEV */
import React, { useState } from 'react';
import { Plus, ArrowUpRight, ShieldCheck, Clock, CheckCircle2, FileText, Wallet, MessageSquare, AlertCircle } from 'lucide-react';
import { RECENT_CASES } from '../data';
import { type RecentCaseRow } from '../types';

interface DashboardOverviewProps {
  userName?: string;
  onViewCase: (caseId: string) => void;
  onStartNewApplication: () => void;
  onNavigateToTab: (tab: 'applications' | 'documents' | 'payments' | 'support') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  userName = 'Client',
  onViewCase,
  onStartNewApplication,
  onNavigateToTab
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'processing' | 'completed'>('all');

  const filteredCases = RECENT_CASES.filter((c) => {
    if (activeFilter === 'processing') {
      return c.statusVariant === 'processing' || c.statusVariant === 'court_stamped';
    }
    if (activeFilter === 'completed') {
      return c.statusVariant === 'completed';
    }
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#102B23] tracking-tight">
            Welcome back {userName ? `${userName.split(' ')[0]} ` : ''}👋
          </h1>
          <p className="text-sm text-[#53645D] mt-1">
            Here's what's happening with your applications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EDF7F2] text-[#006747] border border-[#006747]/15">
            <span className="w-2 h-2 rounded-full bg-[#006747] animate-pulse" />
            OFFICIAL CLIENT PORTAL
          </span>

          <button
            type="button"
            onClick={onStartNewApplication}
            className="inline-flex items-center gap-2 bg-[#006747] hover:bg-[#00513B] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-xs transition focus:outline-none focus:ring-2 focus:ring-[#006747]/30"
          >
            <Plus size={16} />
            New Application
          </button>
        </div>
      </div>

      {/* 4 Metric Cards (Matching Screenshot) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1 */}
        <div className="bg-white border border-[#E5ECE8] rounded-2xl p-5 shadow-flat transition hover:border-[#006747]/30">
          <div className="text-2xl sm:text-3xl font-bold text-[#102B23] font-mono">5</div>
          <div className="text-xs sm:text-sm text-[#53645D] mt-1 font-medium">Sample Applications</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5ECE8] rounded-2xl p-5 shadow-flat transition hover:border-[#006747]/30">
          <div className="text-2xl sm:text-3xl font-bold text-[#B86B14] font-mono">3</div>
          <div className="text-xs sm:text-sm text-[#53645D] mt-1 font-medium">In Progress</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5ECE8] rounded-2xl p-5 shadow-flat transition hover:border-[#006747]/30">
          <div className="text-2xl sm:text-3xl font-bold text-[#006747] font-mono">2</div>
          <div className="text-xs sm:text-sm text-[#53645D] mt-1 font-medium">Completed</div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#E5ECE8] rounded-2xl p-5 shadow-flat transition hover:border-[#006747]/30">
          <div className="text-2xl sm:text-3xl font-bold text-[#102B23] font-mono">₦45,000</div>
          <div className="text-xs sm:text-sm text-[#53645D] mt-1 font-medium">Sample Payment</div>
        </div>
      </div>

      {/* Recent Applications Section (Matching Screenshot) */}
      <div className="bg-white border border-[#E5ECE8] rounded-2xl shadow-flat overflow-hidden">
        {/* Card Header with Filters */}
        <div className="p-5 sm:p-6 border-b border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-[#102B23]">
            Recent Applications
          </h2>

          <div className="flex items-center gap-1.5 p-1 bg-[#F5F8F6] rounded-xl border border-[#E5ECE8] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeFilter === 'all'
                  ? 'bg-white text-[#006747] shadow-xs font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('processing')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeFilter === 'processing'
                  ? 'bg-white text-[#006747] shadow-xs font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Processing
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('completed')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeFilter === 'completed'
                  ? 'bg-white text-[#006747] shadow-xs font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5ECE8] bg-[#FAFDFB] text-[11px] uppercase tracking-wider text-[#53645D] font-semibold">
                <th scope="col" className="py-3.5 px-5 sm:px-6">Service</th>
                <th scope="col" className="py-3.5 px-4">Application ID</th>
                <th scope="col" className="py-3.5 px-4">Status</th>
                <th scope="col" className="py-3.5 px-5 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECE8] text-xs sm:text-sm">
              {filteredCases.map((c) => {
                const isCompleted = c.statusVariant === 'completed';
                return (
                  <tr key={c.id} className="hover:bg-[#F9FCFA] transition-colors group">
                    <td className="py-4 px-5 sm:px-6 font-medium text-[#102B23]">
                      <div className="flex flex-col">
                        <span>{c.service}</span>
                        <span className="text-[11px] text-[#71827A] font-normal sm:hidden mt-0.5">
                          {c.jurisdiction}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-[#53645D] whitespace-nowrap">
                      {c.id}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {isCompleted ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#E8F5EE] text-[#006747]">
                          {c.statusText}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#FEF3D6] text-[#925B00]">
                          {c.statusText}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 sm:px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewCase(c.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#006747] hover:text-[#004730] transition hover:underline focus:outline-none focus:ring-1 focus:ring-[#006747] rounded px-1 py-0.5"
                      >
                        View <span aria-hidden="true">↗</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 text-xs">
                    No applications match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card Footer with quick link to full directory */}
        <div className="p-4 bg-[#FAFDFB] border-t border-[#E5ECE8] flex items-center justify-between text-xs text-[#53645D]">
          <span>Showing {filteredCases.length} of {RECENT_CASES.length} applications</span>
          <button
            type="button"
            onClick={() => onNavigateToTab('applications')}
            className="text-[#006747] font-semibold hover:underline inline-flex items-center gap-1"
          >
            View all applications <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigateToTab('documents')}
          className="cursor-pointer bg-white border border-[#E5ECE8] hover:border-[#006747]/40 rounded-2xl p-5 shadow-flat transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EDF7F2] text-[#006747] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileText size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[#102B23] flex items-center justify-between">
            Official Documents Vault
            <ArrowUpRight size={15} className="text-gray-400 group-hover:text-[#006747] transition" />
          </h3>
          <p className="text-xs text-[#53645D] mt-1 leading-relaxed">
            Access certified High Court affidavits, Gazette copies, and NPC attestations.
          </p>
        </div>

        <div 
          onClick={() => onNavigateToTab('payments')}
          className="cursor-pointer bg-white border border-[#E5ECE8] hover:border-[#006747]/40 rounded-2xl p-5 shadow-flat transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F0F4FF] text-[#1E40AF] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Wallet size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[#102B23] flex items-center justify-between">
            Payment & Statutory Fees
            <ArrowUpRight size={15} className="text-gray-400 group-hover:text-[#1E40AF] transition" />
          </h3>
          <p className="text-xs text-[#53645D] mt-1 leading-relaxed">
            View receipts for High Court commissioner stamps, Gazette prints, and Paystack logs.
          </p>
        </div>

        <div 
          onClick={() => onNavigateToTab('support')}
          className="cursor-pointer bg-white border border-[#E5ECE8] hover:border-[#006747]/40 rounded-2xl p-5 shadow-flat transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FEF3E7] text-[#B86B14] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <MessageSquare size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[#102B23] flex items-center justify-between">
            Diaspora & Legal Support
            <ArrowUpRight size={15} className="text-gray-400 group-hover:text-[#B86B14] transition" />
          </h3>
          <p className="text-xs text-[#53645D] mt-1 leading-relaxed">
            Direct assistance with UK, US, Canada consular requirements and expedited notices.
          </p>
        </div>
      </div>
    </div>
  );
};
