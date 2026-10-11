/* SIRI.DEV */
import React, { useState } from 'react';
import { MessageSquare, MessageCircle, Mail, Phone, Clock, CheckCircle2, ChevronDown, ChevronUp, Send, HelpCircle } from 'lucide-react';
import { MOCK_SUPPORT_TICKETS } from './dashboardData';
import { type SupportTicket } from '../types';

export const SupportView: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_SUPPORT_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(MOCK_SUPPORT_TICKETS[0]?.id || null);
  const [replyText, setReplyText] = useState('');
  
  // New inquiry form state
  const [showNewInquiry, setShowNewInquiry] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Diaspora Courier & Tracking');
  const [newCaseId, setNewCaseId] = useState('NA-2026-8841-LAG');
  const [newMessage, setNewMessage] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // FAQ open states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How long does the Federal Gazette publication take to appear?',
      a: 'The Federal Printing Press processes Gazette publications in bi-weekly batches. A public notice takes approximately 7 to 14 business days from the date of the sworn High Court statutory declaration. Once printed, a certified extract is immediately logged into your dashboard.'
    },
    {
      q: 'Can I use the Gazette clipping immediately for Nigerian Passport renewal abroad?',
      a: 'Yes. Nigerian foreign missions (High Commissions & Consulates in London, Washington, Ottawa, Berlin, etc.) require the sworn High Court affidavit and the published newspaper/gazette page clipping to proceed with passport name rectification.'
    },
    {
      q: 'How does MoFA consular authentication work for Canada / UK?',
      a: 'Our Abuja legal unit presents your original sworn affidavit and NPC certificate directly to the Ministry of Foreign Affairs (Legalisation Directorate). MoFA applies their diplomatic seal, which is then courier-dispatched via DHL Express directly to your diaspora residential address.'
    },
    {
      q: 'What if my BVN name order doesn’t match my NIN?',
      a: 'You do not need to repeat the entire process. An Affidavit of Name Discrepancy & Concordance sworn at the High Court specifically links both spelling variations as referring to one and the same person for NIBSS and bank compliance.'
    }
  ];

  const handleSendReply = (ticketId: string) => {
    if (!replyText.trim()) return;

    setTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            lastReply: 'Just now',
            messages: [
              ...t.messages,
              {
                sender: 'user',
                author: 'You',
                time: 'Just now',
                text: replyText
              }
            ]
          };
        }
        return t;
      })
    );

    setReplyText('');
  };

  const handleCreateInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newMessage) return;

    const newTicket: SupportTicket = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: newSubject,
      caseId: newCaseId,
      category: newCategory,
      createdAt: 'Just now',
      lastReply: 'Just now',
      status: 'open',
      priority: 'high',
      messages: [
        {
          sender: 'user',
          author: 'You',
          time: 'Just now',
          text: newMessage
        }
      ]
    };

    setTickets(prev => [newTicket, ...prev]);
    setSelectedTicketId(newTicket.id);
    setShowNewInquiry(false);
    setNewSubject('');
    setNewMessage('');
    setSubmittedMessage(true);
    setTimeout(() => setSubmittedMessage(false), 4000);
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#102B23] tracking-tight">
            Support & Legal Consultation
          </h1>
          <p className="text-sm text-[#53645D] mt-1">
            Direct access to dedicated case officers, consular guidance, and court liaison desks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://wa.me/2348142009941?text=Hello%20NameAssist%20Support%2C%20I%20need%20assistance%20with%20my%20documentation%20case."
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <MessageCircle size={17} />
            Chat on WhatsApp ↗
          </a>
        </div>
      </div>

      {submittedMessage && (
        <div className="p-4 bg-[#EDF7F2] border border-[#006747]/20 rounded-xl text-xs text-[#006747] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>Your inquiry was dispatched to your assigned case officer. Typical response time is under 2 hours.</span>
        </div>
      )}

      {/* Support Channels Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="https://wa.me/2348142009941"
          target="_blank"
          rel="noreferrer"
          className="bg-white border border-[#E5ECE8] hover:border-[#25D366] p-5 rounded-2xl shadow-flat transition group flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E6F9EE] text-[#25D366] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MessageCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#102B23]">WhatsApp Live Desk</h3>
            <p className="text-xs text-[#53645D] mt-0.5">+234 814 200 9941</p>
            <span className="text-[11px] text-[#006747] font-medium mt-1 inline-block">Instant response · 08:00–18:00 WAT</span>
          </div>
        </a>

        <div className="bg-white border border-[#E5ECE8] p-5 rounded-2xl shadow-flat flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EDF7F2] text-[#006747] flex items-center justify-center shrink-0">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#102B23]">Diaspora Legal Affairs</h3>
            <p className="text-xs text-[#53645D] mt-0.5">diaspora@nameassist.ng</p>
            <span className="text-[11px] text-gray-400 mt-1 inline-block">Official case filings & embassy memos</span>
          </div>
        </div>

        <div className="bg-white border border-[#E5ECE8] p-5 rounded-2xl shadow-flat flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3E7] text-[#B86B14] flex items-center justify-center shrink-0">
            <Phone size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#102B23]">Scheduled Callback</h3>
            <p className="text-xs text-[#53645D] mt-0.5">Request phone/Zoom consult</p>
            <span className="text-[11px] text-gray-400 mt-1 inline-block">UK / US / Canada time zone aligned</span>
          </div>
        </div>
      </div>

      {/* Tickets & Inquiries Workspace */}
      <div className="bg-white border border-[#E5ECE8] rounded-2xl shadow-flat overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[#102B23]">
              Case Inquiries & Ticket Threads
            </h2>
            <p className="text-xs text-[#53645D]">
              Direct messaging with your assigned High Court attorney and document specialists.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewInquiry(!showNewInquiry)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#006747] hover:bg-[#00513B] rounded-xl transition self-start sm:self-auto"
          >
            {showNewInquiry ? 'Cancel Inquiry' : '+ Submit New Inquiry'}
          </button>
        </div>

        {/* New Inquiry Drawer / Form */}
        {showNewInquiry && (
          <form onSubmit={handleCreateInquiry} className="p-5 sm:p-6 bg-[#FBFDFB] border-b border-[#E5ECE8] space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expedited Gazette publication request"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#006747]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Related Application</label>
                <select
                  value={newCaseId}
                  onChange={e => setNewCaseId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#006747]"
                >
                  <option value="NA-2026-8841-LAG">NA-2026-8841-LAG (Change of Name)</option>
                  <option value="NA-2026-9104-LDN">NA-2026-9104-LDN (Name Correction & WAEC)</option>
                  <option value="NA-2026-7429-ABJ">NA-2026-7429-ABJ (CAC Harmonisation)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Details / Inquiry</label>
              <textarea
                required
                rows={3}
                placeholder="Provide details about your query or timeline requirement..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#006747]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewInquiry(false)}
                className="px-4 py-2 text-xs text-gray-600 bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#006747] hover:bg-[#00513B] rounded-xl"
              >
                Submit Inquiry
              </button>
            </div>
          </form>
        )}

        {/* Split View: Tickets List & Active Thread */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#E5ECE8]">
          {/* Left: Ticket Cards List */}
          <div className="divide-y divide-[#E5ECE8] max-h-[500px] overflow-y-auto">
            {tickets.map(t => {
              const isSelected = t.id === selectedTicketId;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-4 cursor-pointer transition ${
                    isSelected ? 'bg-[#EDF7F2]' : 'hover:bg-[#FAFDFB]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[11px] font-semibold text-[#006747]">
                      {t.id}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      t.status === 'resolved'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-[#FEF3D6] text-[#925B00]'
                    }`}>
                      {t.status === 'resolved' ? 'Resolved' : 'In Progress'}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#102B23] line-clamp-1">
                    {t.subject}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Last update: {t.lastReply}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Active Message Thread */}
          <div className="lg:col-span-2 p-5 sm:p-6 flex flex-col justify-between space-y-4">
            {selectedTicket ? (
              <>
                <div className="border-b border-[#E5ECE8] pb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-gray-500">
                      {selectedTicket.id} · Case: {selectedTicket.caseId}
                    </span>
                    <span className="text-xs text-gray-400">{selectedTicket.category}</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#102B23]">
                    {selectedTicket.subject}
                  </h3>
                </div>

                {/* Messages conversation bubbles */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {selectedTicket.messages.map((msg, idx) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
                          <span>{msg.author}</span>
                          <span>·</span>
                          <span>{msg.time}</span>
                        </div>
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isUser
                              ? 'bg-[#006747] text-white rounded-br-xs'
                              : 'bg-[#F4F7F5] text-[#102B23] rounded-bl-xs border border-[#E5ECE8]'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply bar */}
                <div className="pt-3 border-t border-[#E5ECE8] flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message to your case officer..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendReply(selectedTicket.id);
                    }}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#006747]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendReply(selectedTicket.id)}
                    className="p-2.5 bg-[#006747] hover:bg-[#00513B] text-white rounded-xl transition"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs">
                Select a ticket to view messages.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Applicant Knowledge Base FAQ */}
      <div className="bg-white border border-[#E5ECE8] rounded-2xl p-5 sm:p-7 shadow-flat space-y-4">
        <div className="flex items-center gap-2 text-[#102B23]">
          <HelpCircle size={18} className="text-[#006747]" />
          <h2 className="text-base sm:text-lg font-semibold">
            Frequently Asked Questions by Active Applicants
          </h2>
        </div>

        <div className="divide-y divide-[#E5ECE8]">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={index} className="py-3.5">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between text-left font-medium text-xs sm:text-sm text-[#102B23] hover:text-[#006747] transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} className="shrink-0 text-gray-400" /> : <ChevronDown size={16} className="shrink-0 text-gray-400" />}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-[#53645D] leading-relaxed animate-fadeIn">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
