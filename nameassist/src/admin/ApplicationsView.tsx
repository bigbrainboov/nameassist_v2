/* SIRI.DEV */
import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  FileSpreadsheet,
  Building2,
  Calendar,
  CreditCard,
  User,
  ChevronRight,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { type ApplicationRow, manifestCsv, STAGE_NAMES, ADMIN_STAGES } from './presentation';
import { StageStatusEditor } from './StageStatusEditor';
import type { AdminApplicationRecord } from './api';
import { statusLabel } from '../applications/api';

export function ApplicationsView({ applications, currentPath, onSelect, onRefresh, onUpdated }: {
  onUpdated: (application: AdminApplicationRecord) => void;
  applications: ApplicationRow[]; currentPath: string; onSelect: (id: string) => void; onRefresh: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [newspaperFilter, setNewspaperFilter] = useState('all');
  useEffect(() => {
    const params = new URLSearchParams(currentPath.split('?')[1] || '');
    setSearchQuery(params.get('search') || '');
    setStatusFilter(params.get('filter') || 'all');
  }, [currentPath]);
  const filtered = applications.filter(app => {
    const matches = [app.reference, app.applicantName, app.applicantEmail, app.applicantPhone, app.serviceName, app.newspaper,
      app.original.change_of_name?.former_first_name, app.original.change_of_name?.former_last_name].join(' ').toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matches && (statusFilter === 'all' || (statusFilter === 'active' ? app.status !== 'completed' : app.status === statusFilter)) &&
      (serviceFilter === 'all' || app.serviceName === serviceFilter) && (newspaperFilter === 'all' || app.newspaper === newspaperFilter);
  });
  const exportManifest = () => {
    const url = URL.createObjectURL(new Blob([manifestCsv(filtered)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url;
    link.download = `NameAssist_Applications_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#12352C]">
            Applications Docket & Stage Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-[#53645D] mt-0.5">
            Manage verified paid applications through document review and publication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportManifest}
            className="px-3.5 py-2 rounded-xl border border-[#CCDAD2] bg-white text-xs font-semibold text-[#293B35] hover:bg-[#F7FAF8] transition flex items-center gap-1.5 shadow-sm"
            title="Export CSV Manifest"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl bg-[#006747] text-white text-xs font-semibold hover:bg-[#12352C] transition flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle size={15} />
            <span>Refresh Docket</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#DCEBE2] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-3 text-[#53645D]/60" />
            <input
              type="text"
              placeholder="Search by case ref (e.g. NA-2026-8841), applicant name, email, phone…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#CCDAD2] pl-10 pr-4 py-2.5 text-xs bg-[#F7FAF8] focus:bg-white focus:border-[#006747] focus:ring-1 focus:ring-[#006747] outline-none transition"
            />
          </div>

          {/* Quick Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-lg font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-[#12352C] text-white font-semibold'
                  : 'bg-[#F7FAF8] text-[#53645D] hover:bg-[#EDF7F2]'
              }`}
            >
              All ({applications.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-2 rounded-lg font-medium transition ${
                statusFilter === 'active'
                  ? 'bg-[#12352C] text-white font-semibold'
                  : 'bg-[#F7FAF8] text-[#53645D] hover:bg-[#EDF7F2]'
              }`}
            >
              Active ({applications.filter(a => a.status !== 'completed').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('received')}
              className={`px-3 py-2 rounded-lg font-medium transition ${
                statusFilter === 'received'
                  ? 'bg-amber-500 text-white font-bold'
                  : 'bg-[#F7FAF8] text-amber-900 hover:bg-amber-100/60'
              }`}
            >
              Awaiting Review ({applications.filter(a => a.status === 'received').length})
            </button>
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#EDF3F0] text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#53645D] mb-1">Filter by Stage / Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-[#CCDAD2] px-2.5 py-1.5 text-xs bg-white focus:border-[#006747] outline-none"
            >
              <option value="all">All Stages & Statuses</option>
              <option value="active">All Active Stages</option>
              {ADMIN_STAGES.map((status, index) => <option key={status} value={status}>Stage {index + 1}: {statusLabel(status)}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#53645D] mb-1">Service</label>
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="w-full rounded-lg border border-[#CCDAD2] px-2.5 py-1.5 text-xs bg-white focus:border-[#006747] outline-none"
            >
              <option value="all">All Services</option>
              {[...new Set(applications.map(app => app.serviceName))].map(service => <option key={service}>{service}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#53645D] mb-1">Newspaper</label>
            <select
              value={newspaperFilter}
              onChange={e => setNewspaperFilter(e.target.value)}
              className="w-full rounded-lg border border-[#CCDAD2] px-2.5 py-1.5 text-xs bg-white focus:border-[#006747] outline-none"
            >
              <option value="all">All Newspapers</option>
              {[...new Set(applications.map(app => app.newspaper))].map(newspaper => <option key={newspaper}>{newspaper}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-[#DCEBE2] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#F7FAF8] text-[#53645D] border-b border-[#DCEBE2]">
              <tr>
                <th className="py-3 px-4 font-semibold">Case Reference</th>
                <th className="py-3 px-4 font-semibold">Applicant</th>
                <th className="py-3 px-4 font-semibold">Service & Newspaper</th>
                <th className="py-3 px-4 font-semibold">Stage Progress</th>
                <th className="py-3 px-4 font-semibold">Payment Reference</th>
                <th className="py-3 px-4 font-semibold">Filing Fee</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF3F0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#53645D]">
                    <FileSpreadsheet size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-sm">No applications found matching your criteria.</p>
                    <p className="text-xs mt-1 text-gray-400">Try adjusting search keywords or clearing stage filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(app => (
                  <tr
                    key={app.id}
                    className="hover:bg-[#F7FAF8] transition cursor-pointer"
                    onClick={() => onSelect(app.id)}
                  >
                    {/* Case ID & Priority */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1">
                        <span className="font-mono font-bold text-[#006747]">{app.reference}</span>
                        <span className="inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800">Payment confirmed</span>
                        <p className="text-[10px] text-gray-400 font-mono">{app.filingDate}</p>
                      </div>
                    </td>

                    {/* Applicant particulars */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-semibold text-[#12352C]">{app.applicantName}</p>
                      <p className="text-[11px] font-mono text-[#53645D]">{app.applicantEmail}</p>
                      <p className="text-[11px] font-mono text-[#53645D]">{app.applicantPhone}</p>
                    </td>

                    {/* Service & Newspaper */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <p className="font-medium text-[#12352C] line-clamp-1">{app.serviceName}</p>
                      <p className="text-[11px] text-[#53645D] mt-0.5 flex items-center gap-1">
                        <Building2 size={12} className="shrink-0 text-gray-400" />
                        <span className="truncate">{app.newspaper}</span>
                      </p>

                    </td>

                    {/* Stage Progress */}
                    <td className="py-3.5 px-4 align-top min-w-[180px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#12352C]">
                            Stage {app.currentStageIndex + 1} of 6
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              app.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-900'
                                : app.status === 'received'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-blue-50 text-blue-800'
                            }`}
                          >
                            {statusLabel(app.status)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#53645D] truncate">{STAGE_NAMES[app.currentStageIndex]}</p>
                        {/* <StageStatusEditor compact application={app.original} onUpdated={onUpdated}/> */}
                        <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              app.status === 'completed'
                                ? 'bg-emerald-600'
                                : app.status === 'received'
                                ? 'bg-amber-500'
                                : 'bg-[#006747]'
                            }`}
                            style={{ width: `${((app.currentStageIndex + 1) / 6) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Payment Reference */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-mono text-[10px] text-[#53645D] break-all max-w-40">{app.paymentReference}</p>
                    </td>

                    {/* Fee & Payment */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-mono font-bold text-[#12352C]">{app.feeNgn}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        ✓ Paid
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onSelect(app.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#EDF7F2] text-[#006747] font-semibold hover:bg-[#006747] hover:text-white transition text-xs"
                      >
                        Manage Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer summary */}
        <div className="bg-[#F7FAF8] border-t border-[#DCEBE2] px-4 py-3 flex items-center justify-between text-xs text-[#53645D]">
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{applications.length}</strong> statutory matters
          </span>
          <span className="font-mono text-[11px]">Verified paid applications</span>
        </div>
      </div>

    </div>
  );
}
