/* SIRI.DEV */
import React, { useState, useEffect } from 'react';
import { SERVICES } from '../data';
import { type ServiceItem } from '../types';
import { StampSeal } from './StampSeal';
import { X, Check, ArrowRight, ArrowLeft, Upload, ShieldCheck, CreditCard } from 'lucide-react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceId?: string;
  initialStep?: number;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  preselectedServiceId,
  initialStep = 1
}) => {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [locationType, setLocationType] = useState<'nigeria' | 'diaspora'>('diaspora');
  const [diasporaCountry, setDiasporaCountry] = useState<string>('United Kingdom');
  const [nigerianState, setNigerianState] = useState<string>('Lagos');
  
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preselectedServiceId || 'change-of-name'
  );

  // Form Fields
  const [currentFullName, setCurrentFullName] = useState('');
  const [desiredFullName, setDesiredFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reasonForChange, setReasonForChange] = useState('Marriage / Post-marital');
  const [uploadedDocCount, setUploadedDocCount] = useState(2);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedAppId, setGeneratedAppId] = useState('NA-2026-9812-LAG');

  useEffect(() => {
    if (!isOpen) return;
    setCurrentStep(Math.min(4, Math.max(1, initialStep)));
    setSelectedServiceId(preselectedServiceId || 'change-of-name');
    setIsSubmitted(false);
    const country = sessionStorage.getItem('nameassist-intake-country');
    if (country) {
      setLocationType(country === 'Nigeria' ? 'nigeria' : 'diaspora');
      setDiasporaCountry(country === 'Other Country' ? 'Other' : country);
      sessionStorage.removeItem('nameassist-intake-country');
    }
  }, [isOpen, initialStep, preselectedServiceId]);

  if (!isOpen) return null;

  const currentService: ServiceItem =
    SERVICES.find((s) => s.id === selectedServiceId) || SERVICES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stateSuffix = locationType === 'nigeria' ? nigerianState.substring(0, 3).toUpperCase() : diasporaCountry.substring(0, 3).toUpperCase();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setGeneratedAppId(`NA-2026-${randomDigits}-${stateSuffix}`);
    setIsSubmitted(true);
  };

  const resetAndClose = () => {
    setIsSubmitted(false);
    setCurrentStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#12352C]/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] border-2 border-[#12352C] shadow-flat-navy p-6 sm:p-8">
        
        {/* Modal Top Bar */}
        <div className="flex items-start justify-between pb-4 mb-6 border-b border-[#12352C]/20">
          <div>
            <span className="text-[10px] font-mono-data uppercase px-1.5 py-0.5 bg-[#006747] text-white">
              YOUR NEXT CHAPTER
            </span>
            <h3 className="font-display text-2xl text-[#12352C] font-semibold mt-1">
              {isSubmitted ? 'Application Transmitted' : 'Start Your Application'}
            </h3>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            className="p-1.5 text-[#12352C] hover:bg-[#EDF7F2] border border-transparent hover:border-[#12352C]/30 rounded-xs transition-colors cursor-pointer"
            aria-label="Close intake dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation View */}
        {isSubmitted ? (
          <div className="space-y-6 text-center py-4">
            <div className="flex justify-center">
              <StampSeal
                text="HIGH COURT INTAKE"
                centerText="RECEIVED"
                subtext="OFFICIAL LODGEMENT"
                variant="green"
                size="md"
                rotation={-2}
              />
            </div>

            <div>
              <span className="text-xs font-sans text-[#293B35]/75 block mb-1">
                Your statutory intake dossier has been lodged under reference:
              </span>
              <span className="font-mono-data text-2xl font-bold text-[#12352C] px-3 py-1 bg-[#EDF7F2] border border-[#12352C]/30 inline-block">
                {generatedAppId}
              </span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#12352C]/20 p-4 text-left text-xs font-sans text-[#293B35] space-y-2">
              <div className="flex justify-between border-b border-[#12352C]/10 pb-1.5">
                <span className="text-[#293B35]/70">Applicant:</span>
                <span className="font-semibold">{currentFullName || 'Ademola O. Balogun'} → {desiredFullName || 'Ademola O. Adeleke'}</span>
              </div>
              <div className="flex justify-between border-b border-[#12352C]/10 pb-1.5">
                <span className="text-[#293B35]/70">Service:</span>
                <span className="font-semibold">{currentService.title}</span>
              </div>
              <div className="flex justify-between border-b border-[#12352C]/10 pb-1.5">
                <span className="text-[#293B35]/70">Jurisdiction:</span>
                <span className="font-semibold">{locationType === 'nigeria' ? `${nigerianState} State High Court` : `Diaspora Desk (${diasporaCountry})`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#293B35]/70">Initial Fee:</span>
                <span className="font-mono-data font-semibold text-[#006747]">{currentService.feeNgn} ({currentService.feeGbp})</span>
              </div>
            </div>

            <p className="text-xs text-[#293B35]/80 font-sans max-w-md mx-auto">
              Our legal intake officers in Lagos will audit your supporting scans within 2 hours. A copy of this brief and secure tracker credentials have been sent to your email.
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-6 py-2.5 bg-[#006747] text-white text-xs font-sans font-medium rounded-xs shadow-flat-sm"
              >
                Return to landing page
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Step Intake Form */
          <div>
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#12352C]/10 text-xs font-mono-data">
              <span className={currentStep >= 1 ? 'text-[#006747] font-semibold' : 'text-[#293B35]/40'}>
                1. Location
              </span>
              <span className="text-[#12352C]/20">→</span>
              <span className={currentStep >= 2 ? 'text-[#006747] font-semibold' : 'text-[#293B35]/40'}>
                2. Service
              </span>
              <span className="text-[#12352C]/20">→</span>
              <span className={currentStep >= 3 ? 'text-[#006747] font-semibold' : 'text-[#293B35]/40'}>
                3. Particulars
              </span>
              <span className="text-[#12352C]/20">→</span>
              <span className={currentStep >= 4 ? 'text-[#006747] font-semibold' : 'text-[#293B35]/40'}>
                4. Review
              </span>
            </div>

            {/* Step 1: Location */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h4 className="font-display text-lg text-[#12352C] font-semibold">
                  Where are you currently located?
                </h4>
                <p className="text-xs text-[#293B35]/80 font-sans">
                  We determine the competent High Court registry in Nigeria and arrange diaspora courier logistics accordingly.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setLocationType('diaspora')}
                    className={`p-4 border text-left rounded-xs transition-all ${
                      locationType === 'diaspora'
                        ? 'bg-[#EDF7F2] border-[#12352C] shadow-flat-sm'
                        : 'bg-[#FFFFFF] border-[#12352C]/30'
                    }`}
                  >
                    <span className="font-semibold text-xs text-[#12352C] block">Outside Nigeria (Diaspora)</span>
                    <span className="text-[11px] text-[#293B35]/70 block mt-1">UK, US, Canada, EU, UAE, etc.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocationType('nigeria')}
                    className={`p-4 border text-left rounded-xs transition-all ${
                      locationType === 'nigeria'
                        ? 'bg-[#EDF7F2] border-[#12352C] shadow-flat-sm'
                        : 'bg-[#FFFFFF] border-[#12352C]/30'
                    }`}
                  >
                    <span className="font-semibold text-xs text-[#12352C] block">Within Nigeria</span>
                    <span className="text-[11px] text-[#293B35]/70 block mt-1">Lagos, Abuja, Port Harcourt, etc.</span>
                  </button>
                </div>

                {locationType === 'diaspora' ? (
                  <div className="pt-2">
                    <label className="block text-xs font-sans text-[#12352C] font-medium mb-1">
                      Residence country:
                    </label>
                    <select
                      value={diasporaCountry}
                      onChange={(e) => setDiasporaCountry(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-sans bg-[#FFFFFF] border border-[#12352C]/30 focus:outline-none focus:border-[#006747]"
                    >
                      <option value="United Kingdom">United Kingdom (London, Manchester, Birmingham, etc.)</option>
                      <option value="United States">United States (Atlanta, Houston, New York, Maryland, etc.)</option>
                      <option value="Australia">Australia</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Canada">Canada (Toronto, Calgary, Ottawa, Vancouver, etc.)</option>
                      <option value="Germany">Germany (Berlin, Frankfurt, Munich, Hamburg, etc.)</option>
                      <option value="Ireland">Ireland (Dublin, Cork, etc.)</option>
                      <option value="Other">Other Diaspora Country</option>
                    </select>
                  </div>
                ) : (
                  <div className="pt-2">
                    <label className="block text-xs font-sans text-[#12352C] font-medium mb-1">
                      Origin or Filing State in Nigeria:
                    </label>
                    <select
                      value={nigerianState}
                      onChange={(e) => setNigerianState(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-sans bg-[#FFFFFF] border border-[#12352C]/30 focus:outline-none focus:border-[#006747]"
                    >
                      <option value="Lagos">Lagos State (Ikeja / TBS High Court)</option>
                      <option value="FCT Abuja">FCT Abuja (Maitama / Wuse High Court)</option>
                      <option value="Rivers">Rivers State (Port Harcourt Division)</option>
                      <option value="Oyo">Oyo State (Ibadan Division)</option>
                      <option value="Enugu">Enugu State (Enugu Division)</option>
                      <option value="Kano">Kano State (Kano Division)</option>
                      <option value="Other">Other State</option>
                    </select>
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 bg-[#006747] hover:bg-[#0b4834] text-white text-xs font-sans font-medium rounded-xs shadow-flat-sm flex items-center gap-1.5"
                  >
                    <span>Next: Select service</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Service Selection */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h4 className="font-display text-lg text-[#12352C] font-semibold">
                  Choose your documentation package
                </h4>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-[#12352C]/15 p-2 bg-[#FFFFFF]">
                  {SERVICES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedServiceId(s.id)}
                      className={`w-full p-3 border text-left rounded-xs transition-all flex items-center justify-between ${
                        selectedServiceId === s.id
                          ? 'bg-[#EDF7F2] border-[#12352C] shadow-flat-sm'
                          : 'bg-[#FFFFFF] border-[#12352C]/20 hover:bg-[#FFFFFF]'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-xs text-[#12352C] block">
                          {s.title}
                        </span>
                        <span className="text-[11px] text-[#293B35]/70 block">
                          {s.shortDesc}
                        </span>
                      </div>
                      <div className="shrink-0 text-right pl-3">
                        <span className="font-mono-data text-xs font-semibold text-[#12352C] block">
                          {s.feeNgn}
                        </span>
                        <span className="text-[10px] font-mono-data text-[#006747]">
                          {s.turnaroundDays}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 border border-[#12352C] text-xs font-sans font-medium rounded-xs flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 bg-[#006747] hover:bg-[#0b4834] text-white text-xs font-sans font-medium rounded-xs shadow-flat-sm flex items-center gap-1.5"
                  >
                    <span>Next: Personal details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Personal Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h4 className="font-display text-lg text-[#12352C] font-semibold">
                  Personal and legal particulars
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-sans text-[#12352C] font-medium mb-1">
                      Current legal name (as on ID):
                    </label>
                    <input
                      type="text"
                      required
                      value={currentFullName}
                      onChange={(e) => setCurrentFullName(e.target.value)}
                      placeholder="e.g. Chidinma Nkiru Eze"
                      className="w-full px-3 py-2 text-xs font-sans bg-[#FFFFFF] border border-[#12352C]/30 focus:border-[#006747] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans text-[#12352C] font-medium mb-1">
                      Intended legal name:
                    </label>
                    <input
                      type="text"
                      required
                      value={desiredFullName}
                      onChange={(e) => setDesiredFullName(e.target.value)}
                      placeholder="e.g. Chidinma Nkiru Okafor"
                      className="w-full px-3 py-2 text-xs font-sans bg-[#FFFFFF] border border-[#12352C]/30 focus:border-[#006747] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-sans text-[#12352C] font-medium mb-1">
                      Email address for court correspondence:
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. chidinma@example.com"
                      className="w-full px-3 py-2 text-xs font-sans bg-[#FFFFFF] border border-[#12352C]/30 focus:border-[#006747] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans text-[#12352C] font-medium mb-1">
                      Phone / WhatsApp:
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +44 7700 900123"
                      className="w-full px-3 py-2 text-xs font-sans bg-[#FFFFFF] border border-[#12352C]/30 focus:border-[#006747] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans text-[#12352C] font-medium mb-1">
                    Primary ground for statutory declaration:
                  </label>
                  <select
                    value={reasonForChange}
                    onChange={(e) => setReasonForChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-sans bg-[#FFFFFF] border border-[#12352C]/30 focus:outline-none focus:border-[#006747]"
                  >
                    <option value="Marriage / Post-marital">Marriage / Adoption of Spouse Surname</option>
                    <option value="Spelling correction">Clerical Spelling / Date Discrepancy Correction</option>
                    <option value="Personal preference">Personal Preference / Given Name Addition</option>
                    <option value="Religion">Religious Re-alignment</option>
                    <option value="Academic transcript">WAEC / University Degree Reconciliation</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 border border-[#12352C] text-xs font-sans font-medium rounded-xs flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-5 py-2.5 bg-[#006747] hover:bg-[#0b4834] text-white text-xs font-sans font-medium rounded-xs shadow-flat-sm flex items-center gap-1.5"
                  >
                    <span>Next: Review &amp; lodge</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Lodge */}
            {currentStep === 4 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h4 className="font-display text-lg text-[#12352C] font-semibold">
                  Review case brief &amp; lodge with Registry
                </h4>

                <div className="bg-[#EDF7F2]/60 border border-[#12352C] p-4 text-xs font-sans space-y-2">
                  <div className="flex justify-between border-b border-[#12352C]/15 pb-1">
                    <span className="text-[#293B35]/70">Selected Package:</span>
                    <span className="font-semibold text-[#12352C]">{currentService.title}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#12352C]/15 pb-1">
                    <span className="text-[#293B35]/70">Jurisdiction:</span>
                    <span className="font-semibold text-[#12352C]">
                      {locationType === 'nigeria' ? `${nigerianState} State High Court` : `Diaspora Liaison (${diasporaCountry})`}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#12352C]/15 pb-1">
                    <span className="text-[#293B35]/70">Current Legal Name:</span>
                    <span className="font-semibold text-[#12352C]">{currentFullName || 'Pending Entry'}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#12352C]/15 pb-1">
                    <span className="text-[#293B35]/70">Intended Legal Name:</span>
                    <span className="font-semibold text-[#006747]">{desiredFullName || 'Pending Entry'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-medium text-[#12352C]">Statutory Filing Fee:</span>
                    <span className="font-mono-data text-sm font-bold text-[#12352C]">
                      {currentService.feeNgn} <span className="text-xs text-[#293B35]/60">({currentService.feeGbp})</span>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#FFFFFF] border border-dashed border-[#12352C]/30 flex items-center gap-3 text-xs font-sans text-[#293B35]">
                  <ShieldCheck className="w-5 h-5 text-[#006747] shrink-0" />
                  <span>
                    No immediate debit required. Our legal officers vet your supporting documents first before statutory filing fees are placed into judicial escrow.
                  </span>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 border border-[#12352C] text-xs font-sans font-medium rounded-xs flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#006747] hover:bg-[#0b4834] text-white text-xs font-sans font-medium rounded-xs shadow-flat-sm flex items-center gap-2 cursor-pointer"
                  >
                    <span>Lodge application brief</span>
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
