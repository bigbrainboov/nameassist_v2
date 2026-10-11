/* SIRI.DEV */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, Gift, History, Landmark, LoaderCircle, Search, Wallet } from 'lucide-react';
import { Dialog } from '../components/Dialog';
import { money } from '../applications/payment';
import { adminErrorMessage, adminList, getReferralHistory, recordReferralPayment, type ReferralRewardRecord, type ReferralHistoryEvent } from './api';

const date = (value: string | null) => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const inputStyle = 'mt-2 w-full rounded-xl border border-[#D5E2D9] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#00865C] focus:ring-2 focus:ring-[#00865C]/10 disabled:bg-[#F5F8F6]';
const legacy = (reward: ReferralRewardRecord) => reward.status === 'paid' && reward.payment_method !== 'manual';
function Status({ reward }: { reward: ReferralRewardRecord }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${reward.status === 'pending' ? 'bg-[#FFF7E6] text-[#946C17]' : legacy(reward) ? 'bg-[#F0F2F4] text-[#6A737B]' : 'bg-[#EAF5EE] text-[#006747]'}`}>{reward.status === 'pending' ? <Clock3 size={11} /> : <CheckCircle2 size={11} />}{reward.status === 'pending' ? 'Pending' : legacy(reward) ? 'Legacy record' : 'Payment recorded'}</span>;
}

function ReferralDetails({ reward, onClose, onUpdated }: { reward: ReferralRewardRecord; onClose: () => void; onUpdated: (reward: ReferralRewardRecord) => void }) {
  const [amount, setAmount] = useState(reward.amount);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ReferralHistoryEvent[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);
  const pending = reward.status === 'pending';
  const completeBank = !!(reward.bank_name.trim() && reward.account_number.trim() && reward.account_name.trim());
  useEffect(() => {
    let active = true;
    setLoading(true); setHistoryError('');
    getReferralHistory(reward.id).then(events => { if (active) setHistory(events); })
      .catch(err => { if (active) setHistoryError(adminErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reward.id, reward.status, revision]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current || !completeBank || !confirmed) return;
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim()) || Number(amount) <= 0 || Number(amount) > 99999999.99) {
      setError('Enter a positive amount with at most two decimal places.'); return;
    }
    if (!reference.trim()) { setError('Enter the reference for the completed manual payment.'); return; }
    submitting.current = true; setBusy(true); setError('');
    try {
      onUpdated(await recordReferralPayment({ reward_id: reward.id, amount: amount.trim(), payment_reference: reference.trim(), confirmed_paid: confirmed, note: note.trim(),
        bank_details: { bank_name: reward.bank_name, account_number: reward.account_number, account_name: reward.account_name } }));
      setRevision(n => n + 1);
    } catch (err) { setError(adminErrorMessage(err)); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <Dialog variant="admin" busy={busy} title="Referral details" subtitle={`${reward.referrer_name || reward.referrer_email} → ${reward.referred_name || reward.referred_email}`} onClose={() => { if (!busy) onClose(); }}>
    <div className="space-y-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F3F8F4] p-4"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B8373]">{pending ? 'Current reward' : 'Recorded amount'}</p><p className="mt-1 text-2xl font-semibold text-[#003D35]">{money(reward.amount)}</p></div><Status reward={reward} /></div>
      <dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[#78887D]">Referrer</dt><dd className="mt-1 font-medium">{reward.referrer_name || '—'}</dd><dd className="break-all text-xs text-[#63786A]">{reward.referrer_email}</dd></div><div><dt className="text-xs text-[#78887D]">Referred customer</dt><dd className="mt-1 font-medium">{reward.referred_name || '—'}</dd><dd className="break-all text-xs text-[#63786A]">{reward.referred_email}</dd></div><div><dt className="text-xs text-[#78887D]">Referral code</dt><dd className="mt-1 font-semibold tracking-wide">{reward.referral_code || '—'}</dd></div><div><dt className="text-xs text-[#78887D]">Created</dt><dd className="mt-1 text-xs">{date(reward.created_at)}</dd></div></dl>
      <section className="rounded-xl border border-[#DFE8E2] p-4"><h3 className="mb-3 flex items-center gap-2 text-xs font-semibold"><Landmark size={15} className="text-[#006747]" />{pending ? 'Payout account' : 'Current profile bank details'}</h3><dl className="grid gap-3 text-xs sm:grid-cols-3">{[['Bank', reward.bank_name], ['Account number', reward.account_number], ['Account name', reward.account_name]].map(([label, value]) => <div key={label}><dt className="text-[#78887D]">{label}</dt><dd className="mt-1 break-words font-medium">{value || 'Not provided'}</dd></div>)}</dl>{!pending && <p className="mt-3 text-[11px] text-[#78887D]">The bank details recorded with the payment are preserved in the history below.</p>}</section>
      {pending ? <form onSubmit={submit} className="rounded-2xl border border-[#CFE2D5] bg-[#F8FBF8] p-5"><h3 className="text-sm font-semibold">Approve & record payment</h3><p className="mt-2 text-xs leading-relaxed text-[#63786A]">Use this after completing the bank transfer yourself. This action records the payment; it does not send money.</p>
        {!completeBank && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">The referrer must add complete bank details in My Profile before this payment can be recorded.</p>}
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <fieldset disabled={busy || !completeBank} className="mt-4 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium">Amount paid (NGN)<input value={amount} onChange={e => setAmount(e.target.value)} type="text" inputMode="decimal" required className={inputStyle} /></label><label className="text-xs font-medium">Payment reference<input value={reference} onChange={e => setReference(e.target.value)} maxLength={100} required placeholder="Bank transfer reference" className={inputStyle} /></label></div><label className="block text-xs font-medium">Note <span className="font-normal text-[#839087]">(optional)</span><textarea value={note} onChange={e => setNote(e.target.value)} maxLength={1000} rows={2} placeholder="Add context for the payment record" className={inputStyle} /></label>
          <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[#435C4C]"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} required className="mt-0.5 h-4 w-4 shrink-0 accent-[#006747]" />I confirm that the amount above has already been paid manually to the referrer’s account shown above.</label>
          <button type="submit" disabled={!confirmed || busy || !completeBank} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006747] px-4 py-3 text-sm font-semibold text-white hover:bg-[#004D38] disabled:opacity-40">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{busy ? 'Recording payment…' : 'Approve & record payment'}</button>
        </fieldset></form> : <section className={`rounded-xl p-4 text-xs ${legacy(reward) ? 'bg-[#F2F4F6] text-[#626F77]' : 'bg-[#ECF6EF] text-[#2B6140]'}`} role="status"><p className="font-semibold">{legacy(reward) ? 'Historical record — not a confirmed manual payout' : 'Manual payment recorded'}</p><p className="mt-2 break-all">Reference: {reward.gateway_reference || '—'}</p><p className="mt-1">Recorded: {date(reward.disbursed_at)}</p>{legacy(reward) && <p className="mt-2">{reward.payment_method === 'legacy_mock' ? 'This entry came from the previous simulated payout flow.' : 'This entry predates manual payment recording.'}</p>}</section>}
      <section><h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><History size={16} className="text-[#006747]" />Referral history</h3>
        {loading ? <p role="status" className="text-xs text-[#78887D]">Loading history…</p> : historyError ? <p role="alert" className="text-xs text-red-700">{historyError} <button onClick={() => setRevision(n => n + 1)} className="underline">Retry</button></p> : <ol className="space-y-4">{history.map(event => <li key={event.id} className="border-l-2 border-[#BDDAC7] pl-4"><p className="text-xs font-semibold">{event.action === 'record_referral_payment' ? 'Approved and manual payment recorded' : event.action.replaceAll('_', ' ')}</p><p className="mt-1 break-all text-[11px] text-[#78887D]">{date(event.created_at)} · {event.actor_email}</p>{event.after.amount !== undefined && <p className="mt-2 text-xs">Amount: {money(String(event.after.amount))}{event.before.amount !== event.after.amount && event.before.amount !== undefined ? ` (previously ${money(String(event.before.amount))})` : ''}</p>}{event.after.payment_reference !== undefined && <p className="mt-1 break-all text-xs">Reference: {String(event.after.payment_reference)}</p>}{event.after.bank_name !== undefined && <p className="mt-1 break-words text-xs text-[#63786A]">{String(event.after.bank_name)} · {String(event.after.account_number)} · {String(event.after.account_name)}</p>}{event.after.note ? <p className="mt-2 whitespace-pre-wrap text-xs text-[#63786A]">{String(event.after.note)}</p> : null}</li>)}<li className="border-l-2 border-[#E1E9E3] pl-4"><p className="text-xs font-medium">Referral created</p><p className="mt-1 text-[11px] text-[#78887D]">{date(reward.created_at)}</p></li></ol>}
      </section>
    </div>
  </Dialog>;
}

export function ReferralsView() {
  const [rewards, setRewards] = useState<ReferralRewardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    adminList<ReferralRewardRecord>('referral-rewards/').then(data => { if (active) setRewards(data); })
      .catch(err => { if (active) setError(adminErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  const pending = rewards.filter(reward => reward.status === 'pending');
  const paid = rewards.filter(reward => reward.payment_method === 'manual' && reward.status === 'paid');
  const selected = rewards.find(reward => reward.id === selectedId);
  const filtered = rewards.filter(reward => (filter === 'all' || (filter === 'pending' ? reward.status === 'pending' : filter === 'paid' ? reward.payment_method === 'manual' && reward.status === 'paid' : legacy(reward))) &&
    [reward.referrer_name, reward.referrer_email, reward.referred_name, reward.referred_email, reward.referral_code, reward.gateway_reference].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="space-y-6"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6A8072]">Community & rewards</p><h1 className="mt-1 text-2xl font-semibold">Referrals</h1><p className="mt-2 text-sm text-[#63786A]">Review referrals, record manual payments, and keep a clear history.</p></div><button onClick={() => setRevision(n => n + 1)} disabled={loading} className="rounded-xl border border-[#D5E2D9] bg-white px-4 py-2.5 text-xs font-semibold text-[#006747] disabled:opacity-40">Refresh records</button></header>
    <div className="grid gap-4 sm:grid-cols-3">{[{ label: 'Total referrals', value: String(rewards.length), icon: Gift }, { label: 'Awaiting payment record', value: String(pending.length), icon: Clock3 }, { label: 'Manual payments recorded', value: money((paid.reduce((sum, reward) => sum + Math.round(Number(reward.amount) * 100), 0) / 100).toFixed(2)), icon: Wallet }].map(item => <section key={item.label} className="rounded-2xl border border-[#DEE8E1] bg-white p-5"><div className="flex items-center justify-between"><p className="text-xs text-[#6A8072]">{item.label}</p><item.icon size={17} className="text-[#8BA995]" /></div><p className="mt-3 text-2xl font-semibold text-[#003D35]">{loading ? '—' : item.value}</p></section>)}</div>
    <section className="overflow-hidden rounded-2xl border border-[#DEE8E1] bg-white"><div className="flex flex-col gap-4 border-b border-[#E6EDE8] p-5 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-1 rounded-xl bg-[#F3F7F4] p-1">{[['all', 'All referrals'], ['pending', 'Pending'], ['paid', 'Payments recorded'], ['legacy', 'Legacy']].map(([key, label]) => <button key={key} onClick={() => setFilter(key)} aria-pressed={filter === key} className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${filter === key ? 'bg-white text-[#006747] shadow-sm' : 'text-[#738579]'}`}>{label}</button>)}</div><label className="flex items-center gap-2 rounded-xl border border-[#DCE6DF] px-3 py-2.5"><Search size={15} className="text-[#849B8D]" /><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Search referrals" placeholder="Search name, email or reference" className="w-full min-w-0 bg-transparent text-xs outline-none sm:w-52" /></label></div>
      {loading ? <p role="status" className="p-10 text-center text-sm text-[#63786A]">Loading referrals…</p> : error ? <p role="alert" className="p-6 text-sm text-red-700">{error}</p> : !filtered.length ? <div className="p-12 text-center"><Gift size={28} className="mx-auto mb-3 text-[#9AB8A3]" /><h2 className="text-sm font-semibold">{rewards.length ? 'No matching referrals' : 'Your referral history starts here'}</h2><p className="mt-2 text-xs text-[#738579]">{rewards.length ? 'Try another search or filter.' : 'New referrals appear when customers sign up using a referral code.'}</p></div> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-[#FAFCFA] text-[10px] uppercase tracking-wider text-[#7A8B7E]"><tr>{['Referrer', 'Referred customer', 'Reward', 'Status', 'Created', ''].map((label, index) => <th key={index} className="whitespace-nowrap px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#EDF2EE]">{filtered.map(reward => <tr key={reward.id} className="hover:bg-[#FAFCFA]"><td className="px-5 py-4"><p className="font-semibold">{reward.referrer_name || '—'}</p><p className="mt-1 text-[11px] text-[#7A8B7E]">{reward.referrer_email}</p></td><td className="px-5 py-4"><p>{reward.referred_name || '—'}</p><p className="mt-1 text-[11px] text-[#7A8B7E]">{reward.referred_email}</p></td><td className="whitespace-nowrap px-5 py-4 font-semibold text-[#31583E]">{money(reward.amount)}</td><td className="whitespace-nowrap px-5 py-4"><Status reward={reward} /></td><td className="whitespace-nowrap px-5 py-4 text-[11px] text-[#7A8B7E]">{date(reward.created_at)}</td><td className="px-5 py-4"><button onClick={() => setSelectedId(reward.id)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#D6E4DA] px-3 py-2 text-[11px] font-semibold text-[#006747] hover:bg-[#F0F7F2]">{reward.status === 'pending' ? 'Review' : 'View history'}<ArrowUpRight size={13} /></button></td></tr>)}</tbody></table></div>}
    </section>
    {selected && <ReferralDetails key={selected.id} reward={selected} onClose={() => setSelectedId(null)} onUpdated={updated => setRewards(old => old.map(reward => reward.id === updated.id ? updated : reward))} />}
  </div>;
}
