export interface ApiErrorPayload {
  statusCode: number;
  code: string;
  message: string | string[];
  errors?: unknown[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
  const payload = (await response.json().catch(() => ({}))) as Partial<ApiErrorPayload>;
  const message = Array.isArray(payload.message)
    ? payload.message.join(', ')
    : (payload.message ?? 'Não foi possível concluir a solicitação.');
  throw new ApiError(response.status, payload.code ?? 'REQUEST_FAILED', message);
}

export async function refreshAuthSession(): Promise<AuthSession | null> {
  const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) return null;
  const session = await parseResponse<AuthSession>(response);
  accessToken = session.accessToken;
  return session;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (response.status === 401 && allowRefresh && path !== '/auth/refresh') {
    const refreshed = await refreshAuthSession();
    if (refreshed) return apiRequest<T>(path, init, false);
  }
  return parseResponse<T>(response);
}

export interface AuthSession {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string; permissions: string[] };
  organization: { id: string; name: string; slug: string };
}

export const authApi = {
  login: (input: { email: string; password: string; organizationSlug: string }) =>
    apiRequest<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  register: (input: {
    name: string;
    email: string;
    password: string;
    organizationName: string;
    organizationSlug?: string;
  }) => apiRequest<AuthSession>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
  refresh: refreshAuthSession,
  me: () =>
    apiRequest<AuthSession['user'] & { organization: AuthSession['organization'] }>('/auth/me'),
};
