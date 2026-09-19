import {
  Admin,
  AuthResponse,
  Contractor,
  CreateAdminResult,
  CreateEngineerResult,
  CustomerPayment,
  DailyLog,
  DashboardSummary,
  EnterpriseSettings,
  InventoryItem,
  InventoryTransaction,
  PaginatedResult,
  RecentWagePayment,
  Site,
  User,
  WageSummaryRow,
  WorkLog,
  WorkLogBucket,
  WorkLogOverlap,
  WorkLogPayable,
} from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function authHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

async function requestBlob(path: string): Promise<Blob> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed with status ${res.status}`);
  }

  return res.blob();
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

type ListParams = { page?: number; limit?: number; search?: string };

export const api = {
  auth: {
    signup: (data: { name: string; email: string; phone: string; password: string }) =>
      request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<User>('/auth/me'),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<void>('/auth/me/password', { method: 'PATCH', body: JSON.stringify(data) }),
    createEngineer: (data: { name: string; email: string; phone: string; assignedSites: string[] }) =>
      request<CreateEngineerResult>('/auth/engineers', { method: 'POST', body: JSON.stringify(data) }),
    listEngineers: (params: ListParams = {}) =>
      request<PaginatedResult<User>>(
        `/auth/engineers${toQueryString({ page: params.page, limit: params.limit, search: params.search })}`
      ),
    deleteEngineer: (id: string) => request<void>(`/auth/engineers/${id}`, { method: 'DELETE' }),
    updateEngineerSites: (id: string, assignedSites: string[]) =>
      request<User>(`/auth/engineers/${id}/sites`, { method: 'PATCH', body: JSON.stringify({ assignedSites }) }),
    resetEngineerPassword: (id: string) =>
      request<CreateEngineerResult>(`/auth/engineers/${id}/reset-password`, { method: 'PATCH' }),
    createAdmin: (data: {
      name: string;
      email: string;
      phone: string;
      enterpriseName: string;
      enterpriseAddress: string;
    }) => request<CreateAdminResult>('/auth/admins', { method: 'POST', body: JSON.stringify(data) }),
    listAdmins: (params: ListParams = {}) =>
      request<PaginatedResult<Admin>>(
        `/auth/admins${toQueryString({ page: params.page, limit: params.limit, search: params.search })}`
      ),
    resetAdminPassword: (id: string) =>
      request<CreateAdminResult>(`/auth/admins/${id}/reset-password`, { method: 'PATCH' }),
  },
  sites: {
    list: () => request<Site[]>('/sites'),
    create: (data: Partial<Site>) => request<Site>('/sites', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Site>) =>
      request<Site>(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    payments: {
      list: (siteId: string) => request<CustomerPayment[]>(`/sites/${siteId}/payments`),
      create: (siteId: string, data: { amount: number; date: string; note?: string }) =>
        request<CustomerPayment>(`/sites/${siteId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
      delete: (siteId: string, id: string) =>
        request<void>(`/sites/${siteId}/payments/${id}`, { method: 'DELETE' }),
    },
  },
  contractors: {
    list: (siteId?: string) => request<Contractor[]>(`/contractors${toQueryString({ site: siteId })}`),
    create: (data: Partial<Contractor>) =>
      request<Contractor>('/contractors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Contractor>) =>
      request<Contractor>(`/contractors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/contractors/${id}`, { method: 'DELETE' }),
  },
  dailyLogs: {
    list: (
      siteId?: string,
      filter?: { from?: string; to?: string; contractor?: string; workerType?: string; workLog?: string }
    ) =>
      request<DailyLog[]>(
        `/daily-logs${toQueryString({
          site: siteId,
          from: filter?.from,
          to: filter?.to,
          contractor: filter?.contractor,
          workerType: filter?.workerType,
          workLog: filter?.workLog,
        })}`
      ),
    create: (data: Omit<Partial<DailyLog>, 'paid'>) =>
      request<DailyLog>('/daily-logs', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/daily-logs/${id}`, { method: 'DELETE' }),
  },
  workLogs: {
    list: (params: {
      site?: string;
      contractor?: string;
      bucket?: WorkLogBucket;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    }) =>
      request<PaginatedResult<WorkLog>>(
        `/work-logs${toQueryString({
          site: params.site,
          contractor: params.contractor,
          bucket: params.bucket,
          from: params.from,
          to: params.to,
          page: params.page,
          limit: params.limit,
        })}`
      ),
    get: (id: string) => request<WorkLog>(`/work-logs/${id}`),
    create: (data: { site: string; contractor: string; from: string; to: string }) =>
      request<{ _id: string }>('/work-logs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { from: string; to: string }) =>
      request<void>(`/work-logs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/work-logs/${id}`, { method: 'DELETE' }),
    overlaps: (params: { site: string; contractors: string[]; from: string; to: string }) =>
      request<WorkLogOverlap[]>(
        `/work-logs/overlaps${toQueryString({
          site: params.site,
          contractors: params.contractors.join(','),
          from: params.from,
          to: params.to,
        })}`
      ),
  },
  wages: {
    summary: (siteId: string, from: string, to: string) =>
      request<WageSummaryRow[]>(`/wages/summary${toQueryString({ site: siteId, from, to })}`),
    workLogPayables: (siteId: string) =>
      request<WorkLogPayable[]>(`/wages/work-log-payables${toQueryString({ site: siteId })}`),
    recentPaid: (siteId: string, params: { page?: number; limit?: number; from?: string; to?: string } = {}) =>
      request<PaginatedResult<RecentWagePayment>>(
        `/wages/recent-paid${toQueryString({
          site: siteId,
          page: params.page,
          limit: params.limit,
          from: params.from,
          to: params.to,
        })}`
      ),
    exportPaysheet: (siteId: string, from: string, to: string, contractorId?: string) =>
      requestBlob(`/wages/paysheet-export${toQueryString({ site: siteId, from, to, contractor: contractorId })}`),
    markPaid: (data: { site: string; contractor: string; workerType: string; from: string; to: string; amount: number }) =>
      request<void>('/wages/mark-paid', { method: 'PATCH', body: JSON.stringify(data) }),
    markUnpaid: (data: { site: string; contractor: string; workerType: string; from: string; to: string }) =>
      request<void>('/wages/mark-unpaid', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  inventory: {
    list: (siteId?: string, params: { page?: number; limit?: number } = {}) =>
      request<PaginatedResult<InventoryItem>>(
        `/inventory${toQueryString({ site: siteId, page: params.page, limit: params.limit })}`
      ),
    get: (id: string) => request<InventoryItem>(`/inventory/${id}`),
    create: (data: Partial<InventoryItem>) =>
      request<InventoryItem>('/inventory', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<InventoryItem>) =>
      request<InventoryItem>(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    transactions: {
      list: (itemId: string, date?: string) =>
        request<InventoryTransaction[]>(`/inventory/${itemId}/transactions${toQueryString({ date })}`),
      create: (itemId: string, data: Partial<InventoryTransaction>) =>
        request<InventoryTransaction>(`/inventory/${itemId}/transactions`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      delete: (itemId: string, transactionId: string) =>
        request<void>(`/inventory/${itemId}/transactions/${transactionId}`, { method: 'DELETE' }),
      updateAmount: (itemId: string, transactionId: string, amount: number) =>
        request<InventoryTransaction>(`/inventory/${itemId}/transactions/${transactionId}/amount`, {
          method: 'PATCH',
          body: JSON.stringify({ amount }),
        }),
    },
  },
  dashboard: {
    get: (siteId: string) => request<DashboardSummary>(`/dashboard${toQueryString({ site: siteId })}`),
    exportXlsx: (siteId: string, from: string, to: string) =>
      requestBlob(`/dashboard/export${toQueryString({ site: siteId, from, to })}`),
  },
  enterprise: {
    get: () => request<EnterpriseSettings>('/enterprise'),
    update: (data: EnterpriseSettings) =>
      request<EnterpriseSettings>('/enterprise', { method: 'PUT', body: JSON.stringify(data) }),
  },
};
