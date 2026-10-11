/* SIRI.DEV */
import type { DocumentRecord } from './api';

export function groupDocuments(documents: DocumentRecord[]) {
  const groups = new Map<string, { document: DocumentRecord; documents: DocumentRecord[]; references: string[]; types: string[] }>();
  for (const document of documents) {
    // Unknown fingerprints stay separate. Never infer identity from type or filename.
    const key = `${document.is_deliverable ? 'ready' : 'upload'}:${document.content_sha256 || document.id}`;
    const group = groups.get(key);
    if (group) {
      group.documents.push(document);
      if (!group.references.includes(document.reference_no)) group.references.push(document.reference_no);
      if (!group.types.includes(document.doc_type)) group.types.push(document.doc_type);
    } else {
      groups.set(key, { document, documents: [document], references: [document.reference_no], types: [document.doc_type] });
    }
  }
  return [...groups.values()];
}
