/* SIRI.DEV */
import React, { useState } from 'react';
import { FileText, ShieldCheck, Download, Eye, UploadCloud, Search, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { MOCK_USER_DOCUMENTS } from './dashboardData';
import { type UserDocumentItem } from '../types';

interface MyDocumentsViewProps {
  onPreviewDocument: (doc: UserDocumentItem) => void;
}

export const MyDocumentsView: React.FC<MyDocumentsViewProps> = ({
  onPreviewDocument
}) => {
  const [documents, setDocuments] = useState<UserDocumentItem[]>(MOCK_USER_DOCUMENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const categories = ['All', 'Affidavit', 'Gazette Notice', 'NPC Certificate', 'MoFA Legalisation', 'CAC Filing'];

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.sealAuthority.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      const newDoc: UserDocumentItem = {
        id: `doc-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        category: 'Affidavit',
        caseId: 'NA-2026-8841-LAG',
        issueDate: 'Just now',
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB (PDF)`,
        status: 'processing',
        sealAuthority: 'Uploaded by Applicant (Pending Registrar Audit)',
        sealNumber: `DOC-VER-${Math.floor(1000 + Math.random() * 9000)}`,
        description: 'Uploaded supporting documentation submitted for High Court affidavit inclusion.'
      };
      setDocuments(prev => [newDoc, ...prev]);
      setIsUploading(false);
      setUploadSuccess(`Successfully uploaded "${file.name}" to your secure vault.`);
      setTimeout(() => setUploadSuccess(null), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#102B23] tracking-tight">
            My Documents
          </h1>
          <p className="text-sm text-[#53645D] mt-1">
            Access certified High Court affidavits, official Federal Gazette extracts, and NPC attestations.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 bg-[#006747] hover:bg-[#00513B] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto">
          <UploadCloud size={16} />
          <span>{isUploading ? 'Securing scan...' : 'Upload Document'}</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {uploadSuccess && (
        <div className="p-4 bg-[#EDF7F2] border border-[#006747]/20 rounded-xl text-xs text-[#006747] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Upload Drag & Drop Box */}
      <div className="border-2 border-dashed border-[#DCEBE2] hover:border-[#006747]/50 rounded-2xl p-6 text-center bg-[#FBFDFB] transition-colors">
        <UploadCloud size={32} className="mx-auto text-[#006747] mb-2" />
        <h3 className="text-sm font-semibold text-[#102B23]">
          Upload Supporting Evidence or Certified Copies
        </h3>
        <p className="text-xs text-[#53645D] max-w-md mx-auto mt-1">
          Drag and drop your marriage certificate, old international passport, NIN slip, or court decree. Supported formats: PDF, PNG, JPEG (up to 15MB).
        </p>
      </div>

      {/* Filter and Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents by title, case ID, or issuing authority..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#DCEBE2] bg-white focus:outline-none focus:border-[#006747] focus:ring-1 focus:ring-[#006747]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-[#006747] text-white font-semibold'
                    : 'bg-white border border-[#E5ECE8] text-gray-600 hover:bg-[#F4F7F5]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {filteredDocs.map((doc) => {
          const isVerified = doc.status === 'verified';
          const isReady = doc.status === 'ready';
          return (
            <div
              key={doc.id}
              className="bg-white border border-[#E5ECE8] hover:border-[#006747]/40 rounded-2xl p-5 shadow-flat transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#EDF7F2] text-[#006747] flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {doc.caseId}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isVerified
                        ? 'bg-[#EDF7F2] text-[#006747]'
                        : isReady
                        ? 'bg-[#FEF3D6] text-[#925B00]'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {isVerified ? 'Court Sealed' : isReady ? 'Published / Ready' : 'Under Review'}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-[#102B23] leading-snug">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-[#53645D] mt-1 line-clamp-2">
                    {doc.description}
                  </p>
                </div>

                <div className="bg-[#F8FAF9] p-3 rounded-xl text-[11px] text-[#53645D] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Authority:</span>
                    <span className="font-medium text-gray-700 truncate max-w-[200px]" title={doc.sealAuthority}>
                      {doc.sealAuthority}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seal / Reg No:</span>
                    <span className="font-mono text-[#006747] font-semibold">
                      {doc.sealNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date Issued:</span>
                    <span className="text-gray-700">{doc.issueDate}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#F0F5F2]">
                <span className="text-[11px] text-gray-400">{doc.fileSize}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPreviewDocument(doc)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-[#006747] px-3 py-1.5 border border-gray-200 rounded-lg hover:border-[#006747] transition"
                  >
                    <Eye size={13} />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreviewDocument(doc)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#006747] hover:bg-[#00513B] px-3 py-1.5 rounded-lg transition shadow-xs"
                  >
                    <Download size={13} />
                    Download
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredDocs.length === 0 && (
          <div className="col-span-2 bg-white border border-[#E5ECE8] rounded-2xl p-10 text-center text-gray-500 text-xs">
            No documents match your current filter.
          </div>
        )}
      </div>

      {/* Security & Verification Guarantee */}
      <div className="p-4 bg-[#EDF7F2] border border-[#006747]/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#006747]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={20} className="shrink-0" />
          <span>
            All documents in this vault are certified authentic according to the Evidence Act 2011 and cross-indexed with the Nigerian High Court and Federal Gazette registries.
          </span>
        </div>
      </div>
    </div>
  );
};
