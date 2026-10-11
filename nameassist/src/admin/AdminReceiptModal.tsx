/* SIRI.DEV */
import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Download, Building2 } from 'lucide-react';
import { type AdminPayment } from './types';

interface AdminReceiptModalProps {
  payment: AdminPayment | null;
  onClose: () => void;
}

export function AdminReceiptModal({ payment, onClose }: AdminReceiptModalProps) {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#DCEBE2] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="bg-[#12352C] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#006747] flex items-center justify-center text-white">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-white">Official Statutory Filing Receipt</h3>
              <p className="text-xs text-[#A9D8C0]">Invoice: {payment.invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>Print Receipt</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white text-[#293B35]">
          {/* Logo & Header */}
          <div className="flex items-start justify-between border-b border-[#DCEBE2] pb-6">
            <div>
              <img src="/assets/nameassist-logo.png" alt="NameAssist" className="h-7 w-auto" />
              <p className="text-[10px] uppercase font-bold text-[#006747] tracking-widest mt-1">
                NameAssist Legal Registry Limited
              </p>
              <p className="text-xs text-[#53645D]">High Court Registry Liaison Directorate, Nigeria</p>
            </div>

            <div className="text-right">
              <span className="inline-block bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded">
                PAYMENT CONFIRMED
              </span>
              <p className="text-xs font-mono text-[#53645D] mt-1">Date: {payment.date}</p>
            </div>
          </div>

          {/* Receipt Particulars */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#53645D]">Received From:</span>
              <p className="font-bold text-[#12352C] text-sm mt-0.5">{payment.applicantName}</p>
              <p className="text-[11px] font-mono text-[#53645D]">Case Docket: {payment.caseId}</p>
            </div>

            <div>
              <span className="text-[#53645D]">Payment Reference:</span>
              <p className="font-mono font-semibold text-[#12352C] mt-0.5">{payment.reference}</p>
              <p className="text-[11px] text-[#53645D]">Method: {payment.method}</p>
            </div>
          </div>

          {/* Service Description */}
          <div className="p-3.5 rounded-xl bg-[#F7FAF8] border border-[#E1EDE6] text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#006747]">Statutory Matter</span>
            <p className="font-semibold text-[#12352C] text-sm mt-0.5">{payment.service}</p>
          </div>

          {/* Fee Itemization Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#53645D]">
              Statutory Cost Itemization
            </h4>
            <div className="border border-[#DCEBE2] rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7FAF8] text-[#53645D] border-b border-[#DCEBE2]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Service / Statutory Component</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Fee (NGN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF3F0]">
                  {payment.breakdown.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-4 text-[#293B35]">{item.item}</td>
                      <td className="py-2.5 px-4 font-mono font-medium text-right text-[#12352C]">{item.fee}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#EDF7F2] font-bold border-t border-[#DCEBE2]">
                  <tr>
                    <td className="py-3 px-4 text-[#12352C]">Total Amount Paid</td>
                    <td className="py-3 px-4 font-mono text-base text-right text-[#006747]">
                      {payment.amountNgn}
                      {payment.amountGbp && (
                        <span className="text-xs text-[#53645D] font-normal ml-2">({payment.amountGbp})</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Seal & Legal Notice */}
          <div className="pt-4 border-t border-[#DCEBE2] flex items-center justify-between text-xs text-[#53645D]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#006747]" />
              <span>Duly processed via Paystack Central Clearing & Verified Court Cashier</span>
            </div>
            <span className="font-mono text-[10px]">AUTH-VER-{payment.invoiceNumber.split('-')[2] || 'OK'}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#DCEBE2] bg-[#F7FAF8] px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
