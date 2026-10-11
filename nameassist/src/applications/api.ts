/* SIRI.DEV */
import { authenticatedRequest, authenticatedUpload, type UploadProgress } from '../auth/api';
import { capturePreviewSession, invalidatePreview, readPreview, seedPreview } from './previewCache';

export interface Newspaper { slug: string; name: string; logo_url: string }
export interface IntakeOptions {
  newspapers: Newspaper[];
  fee: string | null; currency: string;
  change_of_name_available: boolean;
  document_types: Record<string, string>;
  max_files: number;
  max_file_size: number;
}
export interface NameDetails {
  former_title: string; former_first_name: string; former_middle_name: string; former_last_name: string;
  new_title: string; new_first_name: string; new_middle_name: string; new_last_name: string;
  email: string; phone: string; newspaper: string; newspaper_name: string;
}
export interface ApplicationRecord {
  can_manage_documents: boolean;
  id: string; reference_no: string; service_name: string; status: string; created_at: string; updated_at: string;
  payment: { amount: string; currency: string; status: 'paid' | 'unpaid'; reference: string | null };
  change_of_name: NameDetails | null;
  status_history: { status: string; timestamp: string; note: string }[];
}
export interface DocumentRecord {
  updated_at: string; original_filename: string; can_replace: boolean; can_delete: boolean;
  id: string; application: string; reference_no: string; content_sha256?: string; doc_type: string; is_deliverable: boolean; created_at: string;
}
export async function uploadDocument(application: string, docType: string, file: File, onProgress: (progress: UploadProgress) => void = () => {}) {
  const sameSession = capturePreviewSession();
  const body = new FormData();
  body.append('application', application); body.append('doc_type', docType); body.append('file', file);
  const saved = await authenticatedUpload<DocumentRecord>('/documents/', body, onProgress);
  if (sameSession()) void seedPreview(saved, file);
  return saved;
}
export async function replaceDocument(document: DocumentRecord, file: File, onProgress: (progress: UploadProgress) => void = () => {}) {
  const sameSession = capturePreviewSession();
  const body = new FormData();
  body.append('file', file); body.append('updated_at', document.updated_at);
  const saved = await authenticatedUpload<DocumentRecord>(`/documents/${document.id}/replace/`, body, onProgress);
  if (sameSession()) {
    await invalidatePreview(document.id);
    if (sameSession()) void seedPreview(saved, file);
  }
  return saved;
}
export async function deleteDocument(document: DocumentRecord) {
  const sameSession = capturePreviewSession();
  await authenticatedRequest<void>(`/documents/${document.id}/`, { updated_at: document.updated_at }, 'json', 'DELETE');
  if (sameSession()) await invalidatePreview(document.id);
}
export interface PaymentRecord {
  id: string; application: string; amount: string; status: string; provider: string; created_at: string;
  gateway_reference: string | null; currency: string; verified_at: string | null;
}
export const statusLabel = (status: string) => ({
  received: 'Received', document_review: 'Document review', processing: 'Processing',
  newspaper_publication: 'Newspaper publication', final_documentation: 'Final documentation', completed: 'Completed',
}[status] || status.replaceAll('_', ' '));
export const documentLabel = (type: string) => ({
  affidavit: 'Sworn affidavit', nin: 'NIN slip (NIMC)', bvn_bank: 'BVN / bank account document',
  passport: 'International passport', drivers_license: 'Driver’s license', education: 'Educational certificate', work: 'Work certificate',
}[type] || type.replaceAll('_', ' '));

export async function loadAll<T>(resource: string): Promise<T[]> {
  const result: T[] = [];
  let page = 1;
  while (true) {
    const data = await authenticatedRequest<{ results: T[]; next: string | null }>(`/${resource}/?page=${page}`);
    result.push(...data.results);
    if (!data.next) return result;
    page += 1;
  }
}
export async function downloadDocument(document: DocumentRecord) {
  const blob = await readPreview(document, () => authenticatedRequest<Blob>(`/documents/${document.id}/content/`, undefined, 'blob'));
  const extension = blob.type.includes('pdf') ? '.pdf' : blob.type.includes('png') ? '.png' : blob.type.includes('jpeg') ? '.jpg' : '';
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${documentLabel(document.doc_type)}${extension}`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
