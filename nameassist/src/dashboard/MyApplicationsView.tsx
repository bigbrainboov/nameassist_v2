/* SIRI.DEV */
import React, { useState } from 'react';
import { Search, Plus, Filter, Calendar, MapPin, CheckCircle2, Clock, ArrowRight, Download, MessageCircle, ExternalLink } from 'lucide-react';
import { RECENT_CASES, TRACKER_CASES } from '../data';
import { type ApplicationCase } from '../types';

interface MyApplicationsViewProps {
  onViewCase: (caseId: string) => void;
  onStartNewApplication: () => void;
}

export const MyApplicationsView: React.FC<MyApplicationsViewProps> = ({
  onViewCase,
  onStartNewApplication
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'in_progress' | 'completed'>('all');

  const allCases = RECENT_CASES.map(rc => {
    const detailed = TRACKER_CASES[rc.id];
    return {
      ...rc,
      details: detailed,
      progressPercent: detailed ? Math.round(((detailed.currentStageIndex + 1) / detailed.stages.length) * 100) : rc.statusVariant === 'completed' ? 100 : 60
    };
  });

  const filteredCases = allCases.filter(c => {
    const matchesSearch = 
      c.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterState === 'in_progress') {
      return c.statusVariant !== 'completed';
    }
    if (filterState === 'completed') {
      return c.statusVariant === 'completed';
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#102B23] tracking-tight">
            My Applications
          </h1>
          <p className="text-sm text-[#53645D] mt-1">
            Track statutory filing stages, court appearances, and official gazette publications.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNewApplication}
          className="inline-flex items-center gap-2 bg-[#006747] hover:bg-[#00513B] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-xs transition self-start sm:self-auto"
        >
          <Plus size={16} />
          Start New Application
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5ECE8] rounded-2xl p-4 shadow-flat flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Case ID, applicant name, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#DCEBE2] bg-[#FBFDFB] focus:bg-white focus:outline-none focus:border-[#006747] focus:ring-1 focus:ring-[#006747]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterState('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filterState === 'all'
                ? 'bg-[#006747] text-white font-semibold'
                : 'bg-[#F4F7F5] text-gray-600 hover:bg-[#E8EFEA]'
            }`}
          >
            All ({allCases.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filterState === 'in_progress'
                ? 'bg-[#B86B14] text-white font-semibold'
                : 'bg-[#F4F7F5] text-gray-600 hover:bg-[#E8EFEA]'
            }`}
          >
            In Progress (3)
          </button>
          <button
            type="button"
            onClick={() => setFilterState('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filterState === 'completed'
                ? 'bg-[#006747] text-white font-semibold'
                : 'bg-[#F4F7F5] text-gray-600 hover:bg-[#E8EFEA]'
            }`}
          >
            Completed (2)
          </button>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredCases.map((c) => {
          const isCompleted = c.statusVariant === 'completed';
          return (
            <div
              key={c.id}
              className="bg-white border border-[#E5ECE8] hover:border-[#006747]/40 rounded-2xl p-5 sm:p-6 shadow-flat transition-all space-y-4"
            >
              {/* Card Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F5F2] pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold bg-[#EDF7F2] text-[#006747] px-2.5 py-1 rounded-lg border border-[#006747]/15">
                    {c.id}
                  </span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-[#53645D] flex items-center gap-1 font-medium">
                    <MapPin size={13} className="text-[#006747]" />
                    {c.jurisdiction}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F5EE] text-[#006747]">
                      <CheckCircle2 size={13} />
                      {c.statusText}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3D6] text-[#925B00]">
                      <Clock size={13} />
                      {c.statusText}
                    </span>
                  )}
                </div>
              </div>

              {/* Service Title & Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                <div className="lg:col-span-2 space-y-1">
                  <h3 className="text-base sm:text-lg font-semibold text-[#102B23]">
                    {c.service}
                  </h3>
                  <p className="text-xs text-[#53645D]">
                    Applicant Name on File: <strong className="text-gray-800 font-medium">{c.applicant}</strong>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Last official record update: {c.lastUpdated} · Statutory fee: <span className="font-mono text-[#102B23] font-semibold">{c.amount}</span>
                  </p>
                </div>

                {/* Progress Metric */}
                <div className="space-y-1.5 bg-[#F9FCFA] border border-[#E5ECE8] rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#53645D] font-medium">Stage Progress</span>
                    <span className="font-semibold text-[#006747]">{c.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#006747] rounded-full transition-all duration-500"
                      style={{ width: `${c.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 block text-right">
                    {isCompleted ? 'Final dispatch completed' : 'Awaiting publication certification'}
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <a
                  href={`https://wa.me/2348142009941?text=Hello%20NameAssist%2C%20following%20up%20on%20application%20${c.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#006747] hover:underline inline-flex items-center gap-1.5 font-medium"
                >
                  <MessageCircle size={14} />
                  Chat with Assigned Officer ↗
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewCase(c.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006747] hover:bg-[#00513B] rounded-xl transition shadow-xs"
                  >
                    View Milestone Details
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredCases.length === 0 && (
          <div className="bg-white border border-[#E5ECE8] rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
              <Search size={24} />
            </div>
            <h3 className="text-base font-semibold text-gray-700">No applications found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              We couldn't find any applications matching "{searchQuery}". Clear your search or start a new application.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterState('all');
              }}
              className="text-xs text-[#006747] font-semibold underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
