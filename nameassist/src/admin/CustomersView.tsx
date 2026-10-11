/* SIRI.DEV */
import React, { useState } from 'react';
import {
  Search,
  Users,
  UserCheck,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  CreditCard,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { type AdminCustomer } from './types';
import { getStoredCustomers, saveStoredCustomers } from './adminData';
import { AdminCustomerModal } from './AdminCustomerModal';

export function CustomersView() {
  const [customers, setCustomers] = useState<AdminCustomer[]>(getStoredCustomers());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);

  const handleUpdateCustomer = (updated: AdminCustomer) => {
    const nextList = customers.map(c => (c.id === updated.id ? updated : c));
    setCustomers(nextList);
    saveStoredCustomers(nextList);
    setSelectedCustomer(updated);
  };

  const filtered = customers.filter(cust => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        cust.fullName.toLowerCase().includes(q) ||
        cust.email.toLowerCase().includes(q) ||
        cust.phone.toLowerCase().includes(q) ||
        cust.location.toLowerCase().includes(q) ||
        cust.ninOrPassport.toLowerCase().includes(q) ||
        cust.id.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (statusFilter !== 'all' && cust.status !== statusFilter) {
      return false;
    }

    if (locationFilter !== 'all') {
      if (locationFilter === 'diaspora' && cust.countryCode === 'NG') return false;
      if (locationFilter === 'domestic' && cust.countryCode !== 'NG') return false;
    }

    return true;
  });

  const verifiedCount = customers.filter(c => c.status === 'verified').length;
  const diasporaCount = customers.filter(c => c.countryCode !== 'NG').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#12352C]">
            Customer Registry & KYC Management
          </h1>
          <p className="text-xs sm:text-sm text-[#53645D] mt-0.5">
            Verified identity dossiers, diaspora residency records, and linked court applications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-[#EDF7F2] text-[#006747] px-3 py-1.5 rounded-xl border border-[#C5E5D5]">
            {verifiedCount} of {customers.length} KYC Verified
          </span>
        </div>
      </div>

      {/* Summary KPI Mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#DCEBE2] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#53645D]">Total Registered Clients</p>
            <p className="text-xl font-bold text-[#12352C] mt-0.5">{customers.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EDF7F2] text-[#006747] flex items-center justify-center">
            <Users size={18} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#DCEBE2] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#53645D]">Diaspora Applicants (UK/US/CA/EU)</p>
            <p className="text-xl font-bold text-[#006747] mt-0.5">{diasporaCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#006747] flex items-center justify-center">
            <MapPin size={18} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#DCEBE2] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#53645D]">Identity KYC Verified</p>
            <p className="text-xl font-bold text-[#12352C] mt-0.5">{verifiedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <UserCheck size={18} />
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
              placeholder="Search by customer name, email, phone, NIN, passport, location…"
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
              <option value="all">All KYC Statuses</option>
              <option value="verified">Verified Identity</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="flagged">Flagged Account</option>
            </select>

            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="rounded-lg border border-[#CCDAD2] px-3 py-2 text-xs bg-white focus:border-[#006747] outline-none"
            >
              <option value="all">All Locations</option>
              <option value="diaspora">Diaspora Only (UK, US, Canada, EU)</option>
              <option value="domestic">Nigeria Domestic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="rounded-2xl border border-[#DCEBE2] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#F7FAF8] text-[#53645D] border-b border-[#DCEBE2]">
              <tr>
                <th className="py-3 px-4 font-semibold">Customer Particulars</th>
                <th className="py-3 px-4 font-semibold">Location / Jurisdiction</th>
                <th className="py-3 px-4 font-semibold">KYC Verification</th>
                <th className="py-3 px-4 font-semibold">Active Dockets</th>
                <th className="py-3 px-4 font-semibold">Lifetime Spend</th>
                <th className="py-3 px-4 font-semibold">Registered</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF3F0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#53645D]">
                    <Users size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-sm">No customers found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(cust => (
                  <tr
                    key={cust.id}
                    className="hover:bg-[#F7FAF8] transition cursor-pointer"
                    onClick={() => setSelectedCustomer(cust)}
                  >
                    {/* Name & Contact */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#12352C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {cust.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#12352C]">{cust.fullName}</p>
                          <p className="text-[11px] font-mono text-[#53645D]">{cust.email}</p>
                          <p className="text-[11px] font-mono text-[#53645D]">{cust.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-1.5 font-medium text-[#12352C]">
                        <MapPin size={13} className="text-[#006747] shrink-0" />
                        <span>{cust.location}</span>
                      </div>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold text-gray-500 font-mono">
                        ISO: {cust.countryCode}
                      </span>
                    </td>

                    {/* KYC Identification */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1">
                        <span
                          className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                            cust.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-900'
                              : cust.status === 'pending_verification'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-red-100 text-red-900'
                          }`}
                        >
                          {cust.status.replace('_', ' ')}
                        </span>
                        <p className="text-[11px] font-mono text-[#293B35] font-medium">{cust.ninOrPassport}</p>
                      </div>
                    </td>

                    {/* Active Cases */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="font-semibold text-[#12352C]">{cust.activeCasesCount} active</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">{cust.linkedCaseIds.join(', ')}</p>
                    </td>

                    {/* Total Spend */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="font-mono font-bold text-[#006747]">{cust.totalSpentNgn}</span>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="text-gray-500 font-mono text-[11px]">{cust.joinedDate}</span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedCustomer(cust);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#EDF7F2] text-[#006747] font-semibold hover:bg-[#006747] hover:text-white transition text-xs"
                      >
                        View Profile
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
            Total: <strong>{filtered.length}</strong> clients registered on NameAssist
          </span>
          <span className="font-mono text-[11px]">Nigerian Identity Management Commission (NIMC) Compliant</span>
        </div>
      </div>

      {/* Customer Modal */}
      {selectedCustomer && (
        <AdminCustomerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdateCustomer={handleUpdateCustomer}
        />
      )}
    </div>
  );
}
