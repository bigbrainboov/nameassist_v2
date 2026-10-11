/* SIRI.DEV */
import React, { useState } from 'react';
import { Wallet, Download, CheckCircle2, ShieldCheck, ChevronDown, ChevronUp, FileText, ArrowUpRight } from 'lucide-react';
import { MOCK_PAYMENT_RECORDS } from './dashboardData';
import { type PaymentRecord } from '../types';

export const PaymentsView: React.FC = () => {
  const [currency, setCurrency] = useState<'NGN' | 'GBP'>('NGN');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRecordId(prev => (prev === id ? null : id));
  };

  const handleDownloadReceipt = (record: PaymentRecord) => {
    const text = 
      `NAMEASSIST OFFICIAL PAYMENT RECEIPT\n` +
      `-----------------------------------------\n` +
      `Receipt Reference: ${record.id}\n` +
      `Gateway Reference: ${record.reference}\n` +
      `Case ID: ${record.caseId}\n` +
      `Service: ${record.service}\n` +
      `Date & Time: ${record.date}\n` +
      `Payment Method: ${record.method}\n` +
      `Amount Paid: ${currency === 'GBP' ? record.amountGbp || record.amountNgn : record.amountNgn}\n` +
      `Status: COMPLETED & VERIFIED\n\n` +
      `STATUTORY ITEM BREAKDOWN:\n` +
      record.breakdown.map(b => `- ${b.item}: ${b.fee}`).join('\n') +
      `\n\nCertified by NameAssist Legal Escrow & Accounting Unit.` +
      `\nCompliant with Federal High Court & Gazette Statutory Tariffs.`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${record.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#102B23] tracking-tight">
            Payments & Statutory Receipts
          </h1>
          <p className="text-sm text-[#53645D] mt-1">
            Transparent breakdown of sworn court fees, national publication tariffs, and consular legalisation.
          </p>
        </div>

        {/* Currency Toggle */}
        <div className="flex items-center gap-1 bg-[#F4F7F5] border border-[#E5ECE8] p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setCurrency('NGN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currency === 'NGN' ? 'bg-white text-[#006747] shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            ₦ NGN (Naira)
          </button>
          <button
            type="button"
            onClick={() => setCurrency('GBP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currency === 'GBP' ? 'bg-white text-[#006747] shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            £ GBP (Diaspora)
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5ECE8] rounded-2xl p-5 shadow-flat">
          <span className="text-xs text-[#53645D] font-medium block">Total Settled</span>
          <div className="text-xl sm:text-2xl font-bold text-[#102B23] font-mono mt-1">
            {currency === 'NGN' ? '₦183,000' : '£265'}
          </div>
          <span className="text-[11px] text-[#006747] mt-1 block">5 Transactions</span>
        </div>

        <div className="bg-white border border-[#E5ECE8] rounded-2xl p-5 shadow-flat">
          <span className="text-xs text-[#53645D] font-medium block">Court & Gazette Dues</span>
          <div className="text-xl sm:text-2xl font-bold text-[#006747] font-mono mt-1">
            {currency === 'NGN' ? '₦183,000' : '£265'}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">100% Remitted</span>
        </div>

        <div className="bg-white border border-[#E5ECE8] rounded-2xl p-5 shadow-flat">
          <span className="text-xs text-[#53645D] font-medium block">Pending Balance</span>
          <div className="text-xl sm:text-2xl font-bold text-gray-800 font-mono mt-1">
            {currency === 'NGN' ? '₦0.00' : '£0.00'}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">No overdue balance</span>
        </div>

        <div className="bg-white border border-[#E5ECE8] rounded-2xl p-5 shadow-flat">
          <span className="text-xs text-[#53645D] font-medium block">Escrow Protection</span>
          <div className="text-xl sm:text-2xl font-bold text-[#006747] font-mono mt-1">
            Active
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">Milestone Protected</span>
        </div>
      </div>

      {/* Transactions Ledger */}
      <div className="bg-white border border-[#E5ECE8] rounded-2xl shadow-flat overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E5ECE8]">
          <h2 className="text-base sm:text-lg font-semibold text-[#102B23]">
            Transaction History & Invoices
          </h2>
          <p className="text-xs text-[#53645D] mt-0.5">
            Download audited receipts for reimbursement, visa submissions, and corporate documentation.
          </p>
        </div>

        <div className="divide-y divide-[#E5ECE8]">
          {MOCK_PAYMENT_RECORDS.map((record) => {
            const isExpanded = expandedRecordId === record.id;
            const displayAmount = currency === 'GBP' ? record.amountGbp || record.amountNgn : record.amountNgn;

            return (
              <div key={record.id} className="p-5 sm:p-6 transition hover:bg-[#FAFDFB]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold bg-[#EDF7F2] text-[#006747] px-2 py-0.5 rounded">
                        {record.id}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">Case: {record.caseId}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006747] bg-[#E8F5EE] px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} />
                        Receipt Verified
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold text-[#102B23] pt-0.5">
                      {record.service}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Paid via {record.method} on {record.date}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-[#102B23] font-mono">
                        {displayAmount}
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                        Statutory Total
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(record)}
                        className="p-2 text-gray-600 hover:text-[#006747] hover:bg-[#EDF7F2] rounded-lg transition border border-gray-200"
                        title="Download Receipt"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(record.id)}
                        className="p-2 text-gray-600 hover:text-[#006747] hover:bg-[#EDF7F2] rounded-lg transition border border-gray-200"
                        title="View Fee Breakdown"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Fee Breakdown */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 bg-[#F9FCFA] rounded-xl p-4 text-xs space-y-2 animate-fadeIn">
                    <h4 className="font-semibold text-gray-700 mb-1.5">Remitted Tariff Breakdown:</h4>
                    {record.breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-gray-600 py-1 border-b border-gray-200/60 last:border-0">
                        <span>{item.item}</span>
                        <span className="font-mono font-medium text-gray-900">{item.fee}</span>
                      </div>
                    ))}
                    <div className="pt-2 text-[11px] text-gray-400 font-mono">
                      Paystack Reference ID: {record.reference}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Escrow Guarantee Notice */}
      <div className="bg-[#EDF7F2] border border-[#006747]/20 rounded-2xl p-5 text-xs text-[#006747] space-y-2">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck size={18} />
          <span>Statutory Protection & Escrow Guarantee</span>
        </div>
        <p className="leading-relaxed text-[#1F5442]">
          All client payments are held in escrow and disbursed sequentially upon verification of physical court oaths, receipt of daily newspaper clipping, and Federal Gazette printing press certification.
        </p>
      </div>
    </div>
  );
};
