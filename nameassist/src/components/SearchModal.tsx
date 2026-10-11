/* SIRI.DEV */
import React, { useState } from 'react';
import { SERVICES } from '../data';
import { type ServiceItem } from '../types';
import { Search, X, ArrowRight, FileText } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (service: ServiceItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectService
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = SERVICES.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.shortDesc.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.statutoryBody.toLowerCase().includes(q) ||
      s.requiredDocuments.some((d) => d.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#12352C]/70 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24">
      <div className="relative w-full max-w-xl bg-[#FFFFFF] border-2 border-[#12352C] shadow-flat-navy p-6">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b-2 border-[#12352C] pb-3 mb-4">
          <Search className="w-5 h-5 text-[#12352C]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents, e.g. WAEC, passport, marriage, CAC, affidavit..."
            className="w-full bg-transparent text-sm font-sans text-[#12352C] focus:outline-none placeholder-[#12352C]/50"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#12352C] hover:bg-[#EDF7F2] rounded-xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onClose();
                onSelectService(item);
              }}
              className="w-full p-3 bg-[#FFFFFF] hover:bg-[#EDF7F2] border border-[#12352C]/15 text-left transition-colors flex items-center justify-between rounded-xs cursor-pointer group"
            >
              <div>
                <span className="text-[10px] font-mono-data text-[#006747] block">
                  {item.category} • {item.statutoryBody}
                </span>
                <span className="font-display font-semibold text-sm text-[#12352C] block">
                  {item.title}
                </span>
                <span className="text-[11px] font-sans text-[#293B35]/70 line-clamp-1">
                  {item.shortDesc}
                </span>
              </div>
              <div className="shrink-0 pl-3 text-right">
                <span className="font-mono-data text-xs font-semibold text-[#12352C] block">
                  {item.feeNgn}
                </span>
                <span className="text-[10px] text-[#006747] flex items-center gap-1 justify-end group-hover:underline">
                  View spec <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}

          {results.length === 0 && (
            <div className="p-6 text-center text-xs font-sans text-[#293B35]/70">
              No matching documentation service found for "{query}".
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-dashed border-[#12352C]/20 text-[10px] font-mono-data text-[#12352C]/60 flex justify-between">
          <span>PRESS ESC TO CLOSE</span>
          <span>12 STATUTORY FILING TYPES AVAILABLE</span>
        </div>

      </div>
    </div>
  );
};
