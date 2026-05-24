// Audit API Service
const RAW_API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001/api';
const API_BASE = RAW_API_BASE.replace(/\/api\/v\d+$/i, '/api');

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  return `${b}/${p}`;
}

function getAuthToken(): string | null {
  return (
    localStorage.getItem('qms_access_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token')
  );
}

export interface AuditData {
  id?: string;
  auditNumber?: string;
  title: string;
  description?: string;
  status?: string;
  auditType: string;
  plantId: string;
  departmentId?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  leadAuditorId?: string;
  metadata?: any;
}

export interface AuditResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const auditApi = {
  async getAll(query?: { status?: string; auditType?: string; search?: string; page?: number; limit?: number }): Promise<AuditResponse> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.auditType) params.append('auditType', query.auditType);
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    
    const token = getAuthToken();
    const url = joinUrl(API_BASE, `audit?${params.toString()}`);
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error('Failed to fetch Audits');

    const json = await res.json();
    const pagination = json?.pagination || {};
    return {
      data: json?.data || [],
      total: pagination.total ?? (json?.data?.length || 0),
      page: pagination.page ?? 1,
      limit: pagination.limit ?? (json?.data?.length || 0),
      totalPages: pagination.totalPages ?? 1,
    };
  },

  async getById(id: string): Promise<any> {
    const token = getAuthToken();
    const res = await fetch(joinUrl(API_BASE, `audit/${id}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error('Failed to fetch Audit');
    return res.json();
  },

  async create(data: AuditData): Promise<any> {
    const token = getAuthToken();
    const res = await fetch(joinUrl(API_BASE, 'audit'), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create Audit');
    return res.json();
  },

  async update(id: string, data: Partial<AuditData>): Promise<any> {
    const token = getAuthToken();
    const res = await fetch(joinUrl(API_BASE, `audit/${id}`), {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update Audit');
    return res.json();
  },

  async delete(id: string): Promise<any> {
    const token = getAuthToken();
    const res = await fetch(joinUrl(API_BASE, `audit/${id}`), {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error('Failed to delete Audit');
    return res.json();
  },
};
