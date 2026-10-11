/* SIRI.DEV */
import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileCheck2,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  Building2,
  Award,
  Sparkles
} from 'lucide-react';
import { type ApplicationRow, STAGE_NAMES } from './presentation';
import { money } from '../applications/payment';
import { statusLabel } from '../applications/api';

export function AdminDashboard({ applications, onSelect, onRefresh }: {
  applications: ApplicationRow[]; onSelect: (id: string) => void; onRefresh: () => void;
}) {
  const activeCases = applications.filter(app => app.status !== 'completed');
  const actionRequiredCases = applications.filter(app => app.status === 'received');
  const reviewCases = applications.filter(app => app.status === 'document_review');
  const publicationCases = applications.filter(app => app.status === 'newspaper_publication');
  const totalRevenueNgn = applications.reduce((total, app) => total + Math.round(Number(app.amount) * 100), 0) / 100;
  const stageCounts = STAGE_NAMES.map((_, index) => applications.filter(app => app.currentStageIndex === index).length);
  const activity = applications.flatMap(app => app.original.status_history.map(event => ({ ...event, id: app.id, reference: app.reference })))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#12352C] to-[#1D4A3E] text-white p-6 sm:p-8 shadow-sm border border-[#294B40] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-[#A9D8C0] bg-white/10 px-2.5 py-0.5 rounded-full">
                Registry Operations Central
              </span>
              <span className="text-xs text-white/80 font-mono">
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold !text-white">
              Legal Intake & Docket Overview
            </h1>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Monitor paid applications, document reviews, newspaper publication, and completed cases.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onRefresh}
              className="px-4 py-2.5 rounded-xl bg-[#006747] hover:bg-[#005238] text-white text-xs font-semibold shadow-sm transition flex items-center gap-2"
            >
              <PlusCircle size={15} />
              <span>Refresh Docket</span>
            </button>
            <a
              href="#/admin/applications?filter=document_review"
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition flex items-center gap-2"
            >
              <FileCheck2 size={15} />
              <span>Review Queue ({reviewCases.length})</span>
            </a>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCEBE2] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#53645D]">Active Cases</span>
            <div className="w-8 h-8 rounded-lg bg-[#EDF7F2] text-[#006747] flex items-center justify-center">
              <FileSpreadsheet size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#12352C]">{activeCases.length}</p>
          <p className="text-[11px] text-[#53645D] flex items-center gap-1">
            <span className="text-[#006747] font-semibold">{applications.length} total</span> dockets opened
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCEBE2] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#53645D]">Document Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#12352C]">{reviewCases.length}</p>
          <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
            <Clock size={12} />
            Applications undergoing document checks
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCEBE2] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#53645D]">Newspaper Publication</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006747] flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#12352C]">{publicationCases.length}</p>
          <p className="text-[11px] text-[#006747] font-medium flex items-center gap-1">
            <CheckCircle2 size={12} />
            Applications at the publication stage
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCEBE2] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#53645D]">Paid Application Fees</span>
            <div className="w-8 h-8 rounded-lg bg-[#EDF7F2] text-[#006747] flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#006747]">{money(String(totalRevenueNgn))}</p>
          <p className="text-[11px] text-[#53645D] flex items-center gap-1">
            <TrendingUp size={12} className="text-[#006747]" />
            Verified application fees
          </p>
        </div>
      </div>

      {/* Attention Required / Priority Alert Section */}
      {actionRequiredCases.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-800" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Awaiting Review Queue ({actionRequiredCases.length} Cases)
              </h2>
            </div>
            <span className="text-[11px] text-amber-800 font-medium">Payment confirmed · ready for review</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actionRequiredCases.map(item => (
              <div
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="p-4 rounded-xl bg-white border border-amber-200 hover:border-amber-400 cursor-pointer transition shadow-sm flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#006747]">{item.reference}</span>
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">Awaiting review</span>
                  </div>
                  <p className="text-xs font-bold text-[#12352C] mt-1">{item.applicantName}</p>
                  <p className="text-[11px] text-[#53645D] mt-0.5 line-clamp-1">{item.serviceName}</p>
                  <p className="text-[11px] text-amber-900 font-medium mt-1.5 flex items-center gap-1">
                    <span>Newspaper: {item.newspaper}</span>
                  </p>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-[#EDF7F2] text-[#006747] text-xs font-semibold hover:bg-[#006747] hover:text-white transition shrink-0"
                >
                  Manage
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Grid: Pipeline Breakdown & Recent Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Progression Breakdown (2 columns on large) */}
        <section className="lg:col-span-2 rounded-2xl bg-white border border-[#DCEBE2] p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#12352C]">Statutory Stage Progression Pipeline</h2>
              <p className="text-xs text-[#53645D] mt-0.5">
                Real-time distribution of open matters across the 6 application stages
              </p>
            </div>
            <a
              href="#/admin/applications"
              className="text-xs font-semibold text-[#006747] hover:text-[#12352C] flex items-center gap-1"
            >
              <span>View Docket</span>
              <ArrowRight size={13} />
            </a>
          </div>

          <div className="space-y-3.5">
            {STAGE_NAMES.map((name, idx) => {
              const count = stageCounts[idx];
              const pct = applications.length > 0 ? (count / applications.length) * 100 : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#293B35]">
                      Stage {idx + 1}: {name}
                    </span>
                    <span className="font-semibold text-[#12352C] font-mono">
                      {count} {count === 1 ? 'case' : 'cases'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EDF3F0] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 5 ? 'bg-emerald-600' : idx >= 2 ? 'bg-[#006747]' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Shortcuts */}
          <div className="pt-4 border-t border-[#EDF3F0] flex flex-wrap items-center gap-2">
            <a
              href="#/admin/applications"
              className="text-xs bg-[#F7FAF8] hover:bg-[#EDF7F2] border border-[#DCEBE2] text-[#293B35] px-3 py-2 rounded-lg font-medium transition"
            >
              View All Paid Applications
            </a>
            <a
              href="#/admin/applications?filter=document_review"
              className="text-xs bg-[#F7FAF8] hover:bg-[#EDF7F2] border border-[#DCEBE2] text-[#293B35] px-3 py-2 rounded-lg font-medium transition"
            >
              Review Documents
            </a>
            <a
              href="#/admin/applications?filter=completed"
              className="text-xs bg-[#F7FAF8] hover:bg-[#EDF7F2] border border-[#DCEBE2] text-[#293B35] px-3 py-2 rounded-lg font-medium transition"
            >
              View Completed Cases
            </a>
          </div>
        </section>

        {/* Quick Recent Activity Feed (1 column) */}
        <section className="rounded-2xl bg-white border border-[#DCEBE2] p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#EDF3F0] pb-3 mb-4">
              <h2 className="text-base font-semibold text-[#12352C]">Recent Registry Activity</h2>
              <span className="text-[10px] uppercase font-bold text-[#006747] bg-[#EDF7F2] px-2 py-0.5 rounded">
                Live History
              </span>
            </div>

            <div className="space-y-3.5">
              {activity.map((event, index) => <button key={`${event.id}-${index}`} onClick={() => onSelect(event.id)} className="flex w-full items-start gap-3 text-left text-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 size={13}/></div>
                <div><p className="font-semibold text-[#12352C]">{event.note || statusLabel(event.status)}</p><p className="text-[11px] text-[#53645D] break-all">{event.reference}</p><span className="text-[10px] text-gray-400 font-mono">{new Date(event.timestamp).toLocaleString()}</span></div>
              </button>)}
              {!activity.length && <p className="text-xs text-[#53645D]">Application activity will appear after a payment is confirmed.</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-[#EDF3F0]">
            <a
              href="#/admin/applications"
              className="w-full block text-center py-2.5 rounded-xl border border-[#CCDAD2] bg-[#F7FAF8] hover:bg-white text-xs font-semibold text-[#12352C] transition"
            >
              Browse Applications ({applications.length} Cases)
            </a>
          </div>
        </section>
      </div>

    </div>
  );
}
