/* SIRI.DEV */
import React, { useState } from 'react';
import {
  Search,
  FileCheck2,
  FileText,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Building2,
  Download
} from 'lucide-react';
import { type AdminDocument } from './types';
import { getStoredDocuments, saveStoredDocuments } from './adminData';
import { AdminDocPreviewModal } from './AdminDocPreviewModal';

export function DocumentsView() {
  const [documents, setDocuments] = useState<AdminDocument[]>(getStoredDocuments());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<AdminDocument | null>(null);

  const handleUpdateDocument = (updated: AdminDocument) => {
    const nextList = documents.map(d => (d.id === updated.id ? updated : d));
    setDocuments(nextList);
    saveStoredDocuments(nextList);
    setSelectedDoc(updated);
  };

  const filtered = documents.filter(doc => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        doc.name.toLowerCase().includes(q) ||
        doc.caseId.toLowerCase().includes(q) ||
        doc.applicantName.toLowerCase().includes(q) ||
        doc.sealAuthority.toLowerCase().includes(q) ||
        doc.sealNumber.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (categoryFilter !== 'all' && doc.category !== categoryFilter) {
      return false;
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'deliverables' && !doc.isDeliverable) return false;
      if (statusFilter === 'incoming' && doc.isDeliverable) return false;
      if (statusFilter !== 'deliverables' && statusFilter !== 'incoming' && doc.status !== statusFilter) {
        return false;
      }
    }

    return true;
  });

  const pendingReviewCount = documents.filter(d => d.status === 'pending_review').length;
  const deliverablesCount = documents.filter(d => d.isDeliverable).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#12352C]">
            Document Verification & Official Seals
          </h1>
          <p className="text-xs sm:text-sm text-[#53645D] mt-0.5">
            Audit applicant proof uploads and issue certified court-sealed deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingReviewCount > 0 && (
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
              <AlertCircle size={14} />
              {pendingReviewCount} Document Needs Review
            </span>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#DCEBE2] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#53645D]">Total Documents Tracked</p>
            <p className="text-xl font-bold text-[#12352C] mt-0.5">{documents.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EDF7F2] text-[#006747] flex items-center justify-center">
            <FileText size={18} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#DCEBE2] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#53645D]">Pending Verification Queue</p>
            <p className="text-xl font-bold text-amber-800 mt-0.5">{pendingReviewCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#DCEBE2] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#53645D]">Official Deliverables (Seals Affixed)</p>
            <p className="text-xl font-bold text-[#006747] mt-0.5">{deliverablesCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#006747] flex items-center justify-center">
            <Award size={18} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#DCEBE2] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-3 text-[#53645D]/60" />
            <input
              type="text"
              placeholder="Search by document name, case ID (e.g. NA-2026-8841), seal number, authority…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#CCDAD2] pl-10 pr-4 py-2.5 text-xs bg-[#F7FAF8] focus:bg-white focus:border-[#006747] focus:ring-1 focus:ring-[#006747] outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-lg font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-[#12352C] text-white font-semibold'
                  : 'bg-[#F7FAF8] text-[#53645D] hover:bg-[#EDF7F2]'
              }`}
            >
              All ({documents.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('deliverables')}
              className={`px-3 py-2 rounded-lg font-medium transition ${
                statusFilter === 'deliverables'
                  ? 'bg-[#006747] text-white font-semibold'
                  : 'bg-[#F7FAF8] text-[#53645D] hover:bg-[#EDF7F2]'
              }`}
            >
              Court Seals & Deliverables ({deliverablesCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending_review')}
              className={`px-3 py-2 rounded-lg font-medium transition ${
                statusFilter === 'pending_review'
                  ? 'bg-amber-500 text-white font-bold'
                  : 'bg-[#F7FAF8] text-amber-900 hover:bg-amber-100/60'
              }`}
            >
              Needs Review ({pendingReviewCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-[#EDF3F0] text-xs">
          <label className="text-[11px] font-semibold text-[#53645D]">Document Category:</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[#CCDAD2] px-2.5 py-1 text-xs bg-white focus:border-[#006747] outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Affidavit">High Court Affidavits</option>
            <option value="Gazette Notice">Federal Gazette Publications</option>
            <option value="MoFA Legalisation">MoFA Apostilles</option>
            <option value="NPC Certificate">NPC Birth Attestations</option>
            <option value="ID Proof">Applicant Proofs & Passports</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl border border-[#DCEBE2] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#F7FAF8] text-[#53645D] border-b border-[#DCEBE2]">
              <tr>
                <th className="py-3 px-4 font-semibold">Document Title</th>
                <th className="py-3 px-4 font-semibold">Case Reference & Applicant</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Verification Seal & Authority</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Date Logged</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF3F0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#53645D]">
                    <FileCheck2 size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-sm">No documents matching filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(doc => (
                  <tr
                    key={doc.id}
                    className="hover:bg-[#F7FAF8] transition cursor-pointer"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    {/* Document Name */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            doc.isDeliverable
                              ? 'bg-[#EDF7F2] text-[#006747]'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {doc.isDeliverable ? <Award size={15} /> : <FileText size={15} />}
                        </div>
                        <div>
                          <p className="font-semibold text-[#12352C]">{doc.name}</p>
                          <span className="text-[10px] text-gray-400 font-mono">{doc.fileSize}</span>
                        </div>
                      </div>
                    </td>

                    {/* Case ID & Applicant */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-mono font-bold text-[#006747]">{doc.caseId}</p>
                      <p className="text-[#12352C] font-medium mt-0.5">{doc.applicantName}</p>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                        {doc.category}
                      </span>
                    </td>

                    {/* Authority & Seal */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <p className="font-medium text-[#12352C] line-clamp-1">{doc.sealAuthority}</p>
                      <p className="font-mono text-[10px] text-[#006747] font-semibold mt-0.5">
                        {doc.sealNumber}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 align-top">
                      <span
                        className={`inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                          doc.status === 'ready' || doc.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-900'
                            : doc.status === 'pending_review'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-red-100 text-red-900'
                        }`}
                      >
                        {doc.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="font-mono text-gray-500">{doc.submittedDate}</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedDoc(doc);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#EDF7F2] text-[#006747] font-semibold hover:bg-[#006747] hover:text-white transition text-xs flex items-center gap-1 ml-auto"
                      >
                        <Eye size={12} />
                        <span>Inspect & Stamp</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-[#F7FAF8] border-t border-[#DCEBE2] px-4 py-3 flex items-center justify-between text-xs text-[#53645D]">
          <span>
            Displaying <strong>{filtered.length}</strong> official records
          </span>
          <span className="font-mono text-[11px]">Tamper-Proof Registry Indexing</span>
        </div>
      </div>

      {/* Document Review & Seal Affixing Modal */}
      {selectedDoc && (
        <AdminDocPreviewModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdateDocument={handleUpdateDocument}
        />
      )}
    </div>
  );
}
