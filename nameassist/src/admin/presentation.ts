/* SIRI.DEV */
import type { AdminApplicationRecord } from './api';
import { money } from '../applications/payment';
import { statusLabel } from '../applications/api';
import { APPLICATION_STAGES } from '../applications/progress';
export const ADMIN_STAGES = APPLICATION_STAGES;
export const STAGE_NAMES = ADMIN_STAGES.map(statusLabel);
export function presentApplication(application: AdminApplicationRecord) {
  const details = application.change_of_name;
  return {
    id: application.id, reference: application.reference_no,
    applicantName: details ? [details.new_title, details.new_first_name, details.new_middle_name, details.new_last_name].filter(Boolean).join(' ') : application.customer_name,
    applicantEmail: details?.email || application.customer_email, applicantPhone: details?.phone || '—',
    serviceName: application.service_name, newspaper: details?.newspaper_name || '—',
    filingDate: new Date(application.created_at).toLocaleDateString('en-GB'),
    currentStageIndex: ADMIN_STAGES.indexOf(application.status), status: application.status,
    feeNgn: money(application.payment.amount), paymentReference: application.payment.reference || '—',
    amount: application.payment.amount, original: application,
  };
}
export type ApplicationRow = ReturnType<typeof presentApplication>;
export function manifestCsv(rows: ApplicationRow[]) {
  const cell = (value: string) => {
    const safe = /^[\s]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return [['Reference', 'Applicant', 'Email', 'Service', 'Newspaper', 'Status', 'Amount (NGN)', 'Payment reference'],
    ...rows.map(row => [row.reference, row.applicantName, row.applicantEmail, row.serviceName, row.newspaper, statusLabel(row.status), row.amount, row.paymentReference])]
    .map(row => row.map(cell).join(',')).join('\r\n');
}
