/* SIRI.DEV */
export interface DocumentPreview {
  url: string;
  kind: 'pdf' | 'image';
  extension: '.pdf' | '.png' | '.jpg';
  size: number;
  dispose: () => void;
}

// Use file signatures so an HTML error page or spoofed MIME type is never embedded.
export async function createDocumentPreview(blob: Blob): Promise<DocumentPreview> {
  const header = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  const matches = (signature: number[]) => signature.every((byte, index) => header[index] === byte);
  let type: string;
  let kind: DocumentPreview['kind'];
  let extension: DocumentPreview['extension'];
  if (matches([37, 80, 68, 70, 45])) {
    type = 'application/pdf'; kind = 'pdf'; extension = '.pdf';
  } else if (matches([137, 80, 78, 71, 13, 10, 26, 10])) {
    type = 'image/png'; kind = 'image'; extension = '.png';
  } else if (matches([255, 216, 255])) {
    type = 'image/jpeg'; kind = 'image'; extension = '.jpg';
  } else {
    throw new Error('Preview is not available for this file. You can still download it.');
  }
  const url = URL.createObjectURL(blob.slice(0, blob.size, type));
  return { url, kind, extension, size: blob.size, dispose: () => URL.revokeObjectURL(url) };
}

export const fileSizeLabel = (bytes: number) => bytes >= 1024 * 1024
  ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  : `${Math.max(1, Math.round(bytes / 1024))} KB`;
