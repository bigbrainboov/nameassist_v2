/* SIRI.DEV */
import React, { useState } from 'react';
import { X, UserCheck, ShieldCheck, Mail, Phone, MapPin, FileSpreadsheet, AlertTriangle, ExternalLink } from 'lucide-react';
import { type AdminCustomer } from './types';
import { getStoredApplications } from './adminData';

interface AdminCustomerModalProps {
  customer: AdminCustomer | null;
  onClose: () => void;
  onUpdateCustomer: (updated: AdminCustomer) => void;
}

export function AdminCustomerModal({ customer, onClose, onUpdateCustomer }: AdminCustomerModalProps) {
  if (!customer) return null;

  const [currentStatus, setCurrentStatus] = useState(customer.status);
  const applications = getStoredApplications();
  const customerCases = applications.filter(a =>
    customer.linkedCaseIds.includes(a.id) || a.applicantEmail.toLowerCase() === customer.email.toLowerCase()
  );

  const handleToggleStatus = (newStatus: AdminCustomer['status']) => {
    setCurrentStatus(newStatus);
    const updated: AdminCustomer = {
      ...customer,
      status: newStatus
    };
    onUpdateCustomer(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#DCEBE2] overflow-hidden">
        {/* Header */}
        <div className="bg-[#12352C] text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#006747] text-white font-serif font-bold text-lg flex items-center justify-center shrink-0">
              {customer.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-white">{customer.fullName}</h3>
                <span className="font-mono text-[10px] bg-white/20 px-2 py-0.5 rounded text-white">
                  {customer.id}
                </span>
              </div>
              <p className="text-xs text-[#A9D8C0] mt-0.5 flex items-center gap-1.5">
                <MapPin size={13} />
                {customer.location}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* KYC Status Banner */}
          <div className="p-4 rounded-xl border border-[#DCEBE2] bg-[#F7FAF8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#53645D]">KYC / Identity Status</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    currentStatus === 'verified'
                      ? 'bg-emerald-100 text-emerald-900'
                      : currentStatus === 'pending_verification'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-red-100 text-red-900'
                  }`}
                >
                  {currentStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs font-mono font-medium text-[#12352C] mt-1">
                {customer.ninOrPassport}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {currentStatus !== 'verified' && (
                <button
                  type="button"
                  onClick={() => handleToggleStatus('verified')}
                  className="px-3 py-1.5 rounded-lg bg-[#006747] text-white text-xs font-semibold hover:bg-[#12352C] transition flex items-center gap-1"
                >
                  <UserCheck size={13} />
                  <span>Verify Identity</span>
                </button>
              )}
              {currentStatus !== 'flagged' && (
                <button
                  type="button"
                  onClick={() => handleToggleStatus('flagged')}
                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1"
                >
                  <AlertTriangle size={13} />
                  <span>Flag Account</span>
                </button>
              )}
            </div>
          </div>

          {/* Contact Particulars & Financials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-[#E1EDE6] space-y-2">
              <p className="font-semibold text-[#12352C] uppercase tracking-wider text-[10px]">Contact Methods</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-[#006747]" />
                  <a href={`mailto:${customer.email}`} className="text-[#12352C] hover:underline font-mono">
                    {customer.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-[#006747]" />
                  <a href={`tel:${customer.phone}`} className="text-[#12352C] hover:underline font-mono">
                    {customer.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[#E1EDE6] space-y-2">
              <p className="font-semibold text-[#12352C] uppercase tracking-wider text-[10px]">Account Metrics</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#53645D]">Member Since:</span>
                  <span className="font-semibold text-[#12352C]">{customer.joinedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#53645D]">Total Applications:</span>
                  <span className="font-semibold text-[#12352C]">{customerCases.length} filed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#53645D]">Lifetime Spend:</span>
                  <span className="font-bold text-[#006747]">{customer.totalSpentNgn}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Linked Statutory Applications */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#12352C] flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-[#006747]" />
              Filing History & Active Dockets ({customerCases.length})
            </h4>

            {customerCases.length === 0 ? (
              <p className="text-xs text-[#53645D] p-4 bg-[#F7FAF8] rounded-xl border border-[#DCEBE2] text-center">
                No active cases found for this customer email.
              </p>
            ) : (
              <div className="space-y-2">
                {customerCases.map(c => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-[#DCEBE2] bg-white hover:border-[#006747] transition flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#006747]">{c.id}</span>
                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-700">
                          Stage {c.currentStageIndex + 1}/6
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#12352C] mt-1">{c.serviceName}</p>
                      <p className="text-[11px] text-[#53645D] mt-0.5">{c.jurisdiction}</p>
                    </div>

                    <a
                      href={`#/admin/applications?search=${c.id}`}
                      onClick={onClose}
                      className="p-2 rounded-lg bg-[#EDF7F2] text-[#006747] hover:bg-[#006747] hover:text-white transition text-xs font-medium shrink-0 flex items-center gap-1"
                    >
                      <span>View</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#DCEBE2] bg-[#F7FAF8] px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
