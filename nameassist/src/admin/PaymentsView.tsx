/* SIRI.DEV */
import React, { useState } from 'react';
import {
  Search,
  CreditCard,
  PlusCircle,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Building2,
  Receipt,
  Eye,
  TrendingUp,
  X
} from 'lucide-react';
import { type AdminPayment } from './types';
import { getStoredPayments, saveStoredPayments } from './adminData';
import { AdminReceiptModal } from './AdminReceiptModal';

export function PaymentsView() {
  const [payments, setPayments] = useState<AdminPayment[]>(getStoredPayments());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual payment form states
  const [manualCaseId, setManualCaseId] = useState('NA-2026-');
  const [manualApplicant, setManualApplicant] = useState('');
  const [manualService, setManualService] = useState('Change of Name (Post-Marital Transition)');
  const [manualAmount, setManualAmount] = useState('₦45,000');
  const [manualMethod, setManualMethod] = useState('Zenith Bank Direct Transfer');
  const [manualRef, setManualRef] = useState(`trf_zenith_${Math.floor(100000 + Math.random() * 900000)}`);

  const handleCreateManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualApplicant.trim()) return;

    const randomInv = Math.floor(1000 + Math.random() * 9000);
    const newPayment: AdminPayment = {
      id: `PAY-${manualCaseId.trim()}`,
      caseId: manualCaseId.trim(),
      applicantName: manualApplicant.trim(),
      service: manualService,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' WAT',
      amountNgn: manualAmount,
      method: manualMethod,
      provider: 'direct_bank_transfer',
      status: 'receipt_issued',
      reference: manualRef.trim(),
      invoiceNumber: `INV-2026-${randomInv}`,
      breakdown: [
        { item: 'Court Commissioner for Oaths Statutory Filing Fee', fee: '₦18,500' },
        { item: 'Federal Gazette Publication & Printing Fee', fee: '₦19,500' },
        { item: 'Certified Archival Extraction & Processing', fee: '₦7,000' }
      ]
    };

    const nextList = [newPayment, ...payments];
    setPayments(nextList);
    saveStoredPayments(nextList);
    setIsManualModalOpen(false);
  };

  const filtered = payments.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.reference.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.applicantName.toLowerCase().includes(q) ||
        p.caseId.toLowerCase().includes(q) ||
        p.service.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (statusFilter !== 'all' && p.status !== statusFilter) {
      return false;
    }

    if (providerFilter !== 'all' && p.provider !== providerFilter) {
      return false;
    }

    return true;
  });

  // Calculate totals
  const totalRevenueNgn = payments.reduce((acc, p) => {
    const numeric = parseInt(p.amountNgn.replace(/[^0-9]/g, ''), 10) || 0;
    return acc + numeric;
  }, 0);

  const paystackRevenueNgn = payments
    .filter(p => p.provider === 'paystack')
    .reduce((acc, p) => {
      const numeric = parseInt(p.amountNgn.replace(/[^0-9]/g, ''), 10) || 0;
      return acc + numeric;
    }, 0);

  const bankTransferRevenueNgn = totalRevenueNgn - paystackRevenueNgn;

  const exportCSV = () => {
    const rows = [
      ['Invoice', 'Reference', 'Applicant', 'Case ID', 'Service', 'Date', 'Amount NGN', 'Status', 'Method'],
      ...filtered.map(p => [
        p.invoiceNumber,
        p.reference,
        p.applicantName,
        p.caseId,
        p.service,
        p.date,
        p.amountNgn,
        p.status,
        p.method
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(i => `"${i}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NameAssist_Revenue_Ledger_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#12352C]">
            Filing Fee & Statutory Revenue Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#53645D] mt-0.5">
            Audit Paystack gateway payments, court cashier tellers, and certified fee invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl border border-[#CCDAD2] bg-white text-xs font-semibold text-[#293B35] hover:bg-[#F7FAF8] transition flex items-center gap-1.5 shadow-sm"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#006747] text-white text-xs font-semibold hover:bg-[#12352C] transition flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle size={15} />
            <span>Record Court Teller / Bank Transfer</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#DCEBE2] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#53645D]">Total Collections</span>
            <div className="w-8 h-8 rounded-lg bg-[#EDF7F2] text-[#006747] flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#006747]">₦{totalRevenueNgn.toLocaleString()}</p>
          <p className="text-[11px] text-[#53645D]">{payments.length} transactions reconciled</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#DCEBE2] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#53645D]">Paystack Gateway</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#12352C]">₦{paystackRevenueNgn.toLocaleString()}</p>
          <p className="text-[11px] text-[#53645D]">Online debit cards & international Visa</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#DCEBE2] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#53645D]">Bank / Court Tellers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006747] flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#12352C]">₦{bankTransferRevenueNgn.toLocaleString()}</p>
          <p className="text-[11px] text-[#53645D]">Direct High Court deposits & wire</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#DCEBE2] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-3 text-[#53645D]/60" />
            <input
              type="text"
              placeholder="Search by Paystack ref (pstk_live_...), invoice no, applicant name, or case ID…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#CCDAD2] pl-10 pr-4 py-2.5 text-xs bg-[#F7FAF8] focus:bg-white focus:border-[#006747] focus:ring-1 focus:ring-[#006747] outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs bg-white focus:border-[#006747] outline-none"
            >
              <option value="all">All Payment Statuses</option>
              <option value="receipt_issued">Receipt Issued</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
            </select>

            <select
              value={providerFilter}
              onChange={e => setProviderFilter(e.target.value)}
              className="rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs bg-white focus:border-[#006747] outline-none"
            >
              <option value="all">All Channels</option>
              <option value="paystack">Paystack Gateway</option>
              <option value="direct_bank_transfer">Direct Bank Wire</option>
              <option value="cash_teller">Court Teller / POS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-[#DCEBE2] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#F7FAF8] text-[#53645D] border-b border-[#DCEBE2]">
              <tr>
                <th className="py-3 px-4 font-semibold">Invoice & Reference</th>
                <th className="py-3 px-4 font-semibold">Applicant & Case ID</th>
                <th className="py-3 px-4 font-semibold">Statutory Service</th>
                <th className="py-3 px-4 font-semibold">Fee Amount</th>
                <th className="py-3 px-4 font-semibold">Payment Channel</th>
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF3F0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#53645D]">
                    <CreditCard size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-sm">No payment records found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr
                    key={p.id}
                    className="hover:bg-[#F7FAF8] transition cursor-pointer"
                    onClick={() => setSelectedPayment(p)}
                  >
                    {/* Invoice & Ref */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-mono font-bold text-[#12352C]">{p.invoiceNumber}</p>
                      <p className="text-[11px] font-mono text-[#006747]">{p.reference}</p>
                      <span className="inline-block mt-0.5 text-[9px] uppercase font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Applicant & Case */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-semibold text-[#12352C]">{p.applicantName}</p>
                      <p className="text-[11px] font-mono text-[#53645D]">{p.caseId}</p>
                    </td>

                    {/* Service */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <p className="font-medium text-[#12352C] line-clamp-1">{p.service}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.breakdown.length} statutory fee items</p>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-mono font-bold text-[#006747] text-sm">{p.amountNgn}</p>
                      {p.amountGbp && (
                        <p className="text-[11px] text-[#53645D] font-mono">({p.amountGbp})</p>
                      )}
                    </td>

                    {/* Channel */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-medium text-[#12352C]">{p.method}</p>
                      <span className="text-[10px] text-gray-400 capitalize font-mono">
                        {p.provider.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="font-mono text-gray-500 text-[11px]">{p.date}</span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedPayment(p);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#EDF7F2] text-[#006747] font-semibold hover:bg-[#006747] hover:text-white transition text-xs flex items-center gap-1 ml-auto"
                      >
                        <Receipt size={13} />
                        <span>Receipt</span>
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
            Total: <strong>{filtered.length}</strong> reconciled receipts
          </span>
          <span className="font-mono text-[11px]">Paystack Settlement Ledger</span>
        </div>
      </div>

      {/* Official Certified Receipt Modal */}
      {selectedPayment && (
        <AdminReceiptModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {/* Record Offline / Bank Transfer Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3 sm:p-5">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DCEBE2] overflow-hidden">
            <div className="bg-[#12352C] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#A9D8C0]" />
                <h3 className="text-base font-serif font-bold text-white">Record Manual Bank / Court Teller</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateManualPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#293B35]">Case Docket Reference *</label>
                <input
                  type="text"
                  required
                  value={manualCaseId}
                  onChange={e => setManualCaseId(e.target.value)}
                  placeholder="e.g. NA-2026-8841-LAG"
                  className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs focus:border-[#006747] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#293B35]">Applicant Legal Name *</label>
                <input
                  type="text"
                  required
                  value={manualApplicant}
                  onChange={e => setManualApplicant(e.target.value)}
                  placeholder="e.g. Adebayo Ogunlesi"
                  className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs focus:border-[#006747] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#293B35]">Service Category</label>
                <input
                  type="text"
                  value={manualService}
                  onChange={e => setManualService(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs focus:border-[#006747] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#293B35]">Amount (NGN)</label>
                  <input
                    type="text"
                    value={manualAmount}
                    onChange={e => setManualAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs focus:border-[#006747] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#293B35]">Deposit Reference / Teller No</label>
                  <input
                    type="text"
                    value={manualRef}
                    onChange={e => setManualRef(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs focus:border-[#006747] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#293B35]">Payment Channel / Bank</label>
                <select
                  value={manualMethod}
                  onChange={e => setManualMethod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs bg-white focus:border-[#006747] outline-none"
                >
                  <option value="Zenith Bank Direct Electronic Transfer">Zenith Bank Direct Transfer</option>
                  <option value="GTBank Direct Transfer / Court Teller">GTBank Direct Transfer</option>
                  <option value="FirstBank High Court Cashier Slip">FirstBank High Court Cashier Slip</option>
                  <option value="Access Bank NIBSS Instant Payment">Access Bank NIBSS Transfer</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#EDF3F0]">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#CCDAD2] text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#006747] hover:bg-[#12352C] text-white text-xs font-semibold shadow-sm transition"
                >
                  Log Payment & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
