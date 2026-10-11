/* SIRI.DEV */
export type EmailAction = { action: 'forgot-password' | 'reset-password' | 'verify-email'; token: string };

export function parseEmailAction(hash: string): EmailAction | null {
  const [route, query = ''] = hash.split('?', 2);
  const action = route.replace(/^#\//, '');
  if (action !== 'forgot-password' && action !== 'reset-password' && action !== 'verify-email') return null;
  const params = new URLSearchParams(query);
  const tokens = params.getAll('token');
  return { action, token: tokens.length === 1 ? tokens[0] : '' };
}

export async function submitPasswordReset(
  token: string,
  password: string,
  confirm: (token: string, password: string) => Promise<unknown>,
  clearSession: () => void,
): Promise<void> {
  await confirm(token, password);
  clearSession();
}
