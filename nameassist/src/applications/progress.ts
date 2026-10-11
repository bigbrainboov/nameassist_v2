/* SIRI.DEV */
import type { ApplicationRecord } from './api';
export const APPLICATION_STAGES = ['received', 'document_review', 'processing', 'newspaper_publication', 'final_documentation', 'completed'];
export const stageDescriptions: Record<string, string> = {
  received: 'Your application has been received and is awaiting review.',
  document_review: 'Your submitted documents are being checked.',
  processing: 'Your application is being processed.',
  newspaper_publication: 'Your application is at the newspaper publication stage.',
  final_documentation: 'Your final documents are being prepared.',
  completed: 'Your application is complete. View your completed documents below.',
};
export function applicationProgress(application: ApplicationRecord) {
  const index = APPLICATION_STAGES.indexOf(application.status);
  const visited = new Set(application.status_history.map(event => event.status));
  const waitingForPayment = application.status === 'received' && application.payment.status !== 'paid';
  return {
    waitingForPayment,
    description: waitingForPayment ? 'Your application is saved. Complete payment so our team can begin review.' : stageDescriptions[application.status] || 'Check your application history for the latest update.',
    steps: APPLICATION_STAGES.map((status, position) => ({ status,
      state: status === application.status ? (status === 'completed' ? 'done' : 'current')
        : position < index ? (visited.has(status) ? 'done' : 'skipped') : 'upcoming',
    })),
    latest: [...application.status_history].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0],
  };
}
