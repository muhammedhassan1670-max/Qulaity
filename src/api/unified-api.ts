// Unified Quality Module API Adapter
// Provides consistent authentication, endpoint structure, and filtering for NCR, CAPA, 8D, FMEA

import {
  loadSafeLocalDefectRecords,
  mergeDefectRecordSets,
  safeWriteLocalDefectRecords,
} from '@/services/safeDefectStorage';

const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';
const API_BASE = RAW_BASE.replace(/\/+$/, '').replace(/\/api\/v\d+$/i, '/api');
const API_PREFIX = /\/api$/i.test(API_BASE) ? API_BASE : `${API_BASE}/api`;

// Use consistent token key with main API service
const getAuthToken = (): string | null => {
  return localStorage.getItem('qms_access_token') || localStorage.getItem('auth_token');
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem('qms_refresh_token');
};

const setAuthToken = (token: string) => localStorage.setItem('qms_access_token', token);
const setRefreshToken = (token: string) => localStorage.setItem('qms_refresh_token', token);
const clearTokens = () => {
  localStorage.removeItem('qms_access_token');
  localStorage.removeItem('qms_refresh_token');
  localStorage.removeItem('auth_token');
};

const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_PREFIX}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;
    const data = await res.json().catch(() => null);

    const nextAccess = data?.data?.accessToken;
    const nextRefresh = data?.data?.refreshToken;
    if (!nextAccess || !nextRefresh) return false;

    setAuthToken(nextAccess);
    setRefreshToken(nextRefresh);
    return true;
  } catch {
    return false;
  }
};

// Common response structure for paginated results
export interface BaseModuleData {
  id: string;
  status?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Common query parameters for all modules
export interface BaseQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Extended query with status filter
export interface StatusQueryParams extends BaseQueryParams {
  status?: string;
}

// Extended query with date range
export interface DateRangeQueryParams extends StatusQueryParams {
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  dateField?: 'createdAt' | 'updatedAt' | 'targetCloseDate' | 'detectedDate';
}

// Module-specific query types
export interface NcrQueryParams extends DateRangeQueryParams {
  priority?: string;
  source?: string;
  plantId?: string;
  departmentId?: string;
}

export interface CapaQueryParams extends DateRangeQueryParams {
  priority?: string;
  capaType?: string;
  sourceNcrId?: string;
  plantId?: string;
  departmentId?: string;
}

export interface EightDQueryParams extends DateRangeQueryParams {
  ownerUserId?: string;
  ncrReportId?: string;
  plantId?: string;
}

export interface FmeaQueryParams extends DateRangeQueryParams {
  type?: string;
  ownerUserId?: string;
  plantId?: string;
  departmentId?: string;
}

export interface DeviationQueryParams extends DateRangeQueryParams {
  type?: string;
  ownerUserId?: string;
  plantId?: string;
  departmentId?: string;
}

export interface ChangeControlQueryParams extends DateRangeQueryParams {
  status?: string;
  type?: string;
  priority?: string;
  search?: string;
}

export interface ComplaintQueryParams extends DateRangeQueryParams {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}

export interface ControlPlanQueryParams extends DateRangeQueryParams {
  status?: string;
  search?: string;
}

export interface SupplierQueryParams extends DateRangeQueryParams {
  status?: string;
  category?: string;
  search?: string;
}

export interface InspectionQueryParams extends DateRangeQueryParams {
  type?: string;
  result?: string;
  search?: string;
}

export interface CalibrationQueryParams extends DateRangeQueryParams {
  status?: string;
  search?: string;
}

export interface ProductionLayoutQueryParams extends BaseQueryParams {
  plantId?: string;
  isPublished?: boolean;
}

// Generic API client factory
function createModuleApi<T, Q extends BaseQueryParams>(endpoint: string) {
  const apiEndpoint = endpoint === 'audits' ? 'audit' : endpoint;
  const isDefectLogsEndpoint = endpoint === 'defect-logs';

  const buildQueryString = (query?: Q): string => {
    const params = new URLSearchParams();
    if (!query) return '';

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return params.toString();
  };

  const getHeaders = (includeContentType = false): HeadersInit => {
    const token = getAuthToken();
    const headers: HeadersInit = {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const tenantId = localStorage.getItem('qms_tenant_id');
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    return headers;
  };

  const fetchWithAuthRetry = async (url: string, init: RequestInit): Promise<Response> => {
    const res = await fetch(url, init);
    if (res.status !== 401) return res;

    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      clearTokens();
      window.location.href = '/login';
      return res;
    }

    // Retry once with updated token
    const retryInit: RequestInit = {
      ...init,
      headers: getHeaders(Boolean((init.headers as any)?.['Content-Type'])),
    };
    return fetch(url, retryInit);
  };

  const parseJson = async (res: Response): Promise<any> => {
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  };

  const normalizeListBody = (body: any, query?: Q): PaginatedResponse<T> => {
    if (body?.pagination && Array.isArray(body?.data)) {
      const { page, limit, total } = body.pagination;
      const lim = limit || 1;
      const totalPages = body.pagination.totalPages ?? Math.max(1, Math.ceil(total / lim));
      return {
        data: body.data as T[],
        page,
        limit,
        total,
        totalPages,
      };
    }
    if (Array.isArray(body?.data) && typeof body.total === 'number') {
      const data = body.data as T[];
      const total = body.total;
      const limit = query?.limit ?? 20;
      const page = query?.page ?? 1;
      return {
        data,
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }
    if (
      body &&
      typeof body === 'object' &&
      Array.isArray(body.data) &&
      typeof body.total === 'number' &&
      typeof body.page === 'number'
    ) {
      return body as PaginatedResponse<T>;
    }
    if (Array.isArray(body)) {
      const data = body as T[];
      const total = data.length;
      const limit = query?.limit ?? 1000; // Use a large limit for local data
      const page = query?.page ?? 1;
      return {
        data,
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }
    return {
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };
  };

  const unwrapEntity = <E>(body: any): E => {
    if (body && typeof body === 'object' && 'data' in body && body.data !== undefined && body.success !== false) {
      return body.data as E;
    }
    return body as E;
  };

  const readLocalItems = (): T[] => {
    if (isDefectLogsEndpoint) {
      return loadSafeLocalDefectRecords() as T[];
    }
    const localData = localStorage.getItem(`qms_local_${endpoint}`);
    if (!localData) return [];
    try {
      const parsed = JSON.parse(localData);
      return Array.isArray(parsed) ? parsed as T[] : [];
    } catch (error) {
      console.error(`Failed to parse local storage data for ${endpoint}`, error);
      return [];
    }
  };

  const writeLocalItems = (items: T[], reason: string, allowEmptyOverwrite = false): void => {
    if (isDefectLogsEndpoint) {
      const result = safeWriteLocalDefectRecords(items as DefectLogData[], {
        reason,
        allowEmptyOverwrite,
      });
      if (!result.ok) {
        throw new Error(result.reason);
      }
      return;
    }
    localStorage.setItem(`qms_local_${endpoint}`, JSON.stringify(items));
  };

  return {
    endpoint,

    async getAll(query?: Q): Promise<PaginatedResponse<T>> {
      const queryString = buildQueryString(query);
      const url = `${API_PREFIX}/${apiEndpoint}${queryString ? `?${queryString}` : ''}`;

      try {
        const res = await fetchWithAuthRetry(url, {
          headers: getHeaders(),
        });

        const body = await parseJson(res);
        const serverResult = normalizeListBody(body, query);

        // Merge with local storage results for offline-first experience
        const localItems = readLocalItems();
        if (isDefectLogsEndpoint && localItems.length > 0 && serverResult.data.length === 0) {
          return normalizeListBody(localItems, query);
        }
        if (localItems.length) {
          // Avoid duplicates if same ID exists in both (server wins). For defect logs,
          // local-only records remain protected even if the server/API returns empty.
          const mergedData = isDefectLogsEndpoint
            ? mergeDefectRecordSets(serverResult.data, localItems) as T[]
            : (() => {
              const serverIds = new Set(serverResult.data.map((x: any) => x.id));
              const uniqueLocal = localItems.filter((x: any) => !serverIds.has(x.id));
              return [...uniqueLocal, ...serverResult.data];
            })();

          return {
            ...serverResult,
            data: mergedData,
            total: mergedData.length,
          };
        }

        return serverResult;
      } catch (err) {
        console.warn(`API getAll failed for ${endpoint}, checking local storage fallback`, err);
        const items = readLocalItems();
        if (items.length) return normalizeListBody(items, query);
        // Graceful fallback to empty instead of throwing
        return normalizeListBody([], query);
      }
    },

    async getById(id: string): Promise<T> {
      const url = `${API_PREFIX}/${apiEndpoint}/${id}`;
      try {
        const res = await fetchWithAuthRetry(url, {
          headers: getHeaders(),
        });

        const body = await parseJson(res);
        return unwrapEntity<T>(body);
      } catch (err) {
        const items = readLocalItems();
        const item = items.find((x: any) => x.id === id);
        if (item) return item;
        throw err;
      }
    },

    async create(data: Omit<T, 'id'>): Promise<T> {
      const url = `${API_PREFIX}/${apiEndpoint}`;
      
      try {
        const res = await fetchWithAuthRetry(url, {
          method: 'POST',
          headers: getHeaders(true),
          body: JSON.stringify(data),
        });

        const body = await parseJson(res);
        return unwrapEntity<T>(body);
      } catch (err) {
        console.warn(`API create failed for ${endpoint}, saving to local storage`, err);
        const items = readLocalItems() as any[];
        
        const newItem = {
          ...data,
          id: `local-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as unknown as T;
        items.unshift(newItem);
        writeLocalItems(items, `create-${endpoint}-fallback`);
        return newItem;
      }
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      const url = `${API_PREFIX}/${apiEndpoint}/${id}`;
      try {
        const res = await fetchWithAuthRetry(url, {
          method: 'PATCH',
          headers: getHeaders(true),
          body: JSON.stringify(data),
        });

        const body = await parseJson(res);
        return unwrapEntity<T>(body);
      } catch (err) {
        const items = readLocalItems() as any[];
        const idx = items.findIndex(x => x.id === id);
        if (idx !== -1) {
          items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
          writeLocalItems(items as T[], `update-${endpoint}-fallback`);
          return items[idx];
        }
        throw err;
      }
    },

    async delete(id: string): Promise<void> {
      const url = `${API_PREFIX}/${apiEndpoint}/${id}`;
      try {
        const res = await fetchWithAuthRetry(url, {
          method: 'DELETE',
          headers: getHeaders(),
        });

        if (!res.ok) throw new Error('Delete failed');
      } catch (err) {
        const items = readLocalItems() as any[];
        if (items.length) {
          const filtered = items.filter(x => x.id !== id);
          writeLocalItems(filtered as T[], `delete-${endpoint}-fallback`, true);
          return;
        }
        throw err;
      }
    },

    // Batch operations
    async batchDelete(ids: string[]): Promise<{ deleted: number }> {
      const res = await fetch(`${API_PREFIX}/${apiEndpoint}/batch`, {
        method: 'DELETE',
        headers: getHeaders(true),
        body: JSON.stringify({ ids }),
      });

      const body = await parseJson(res);
      return unwrapEntity<{ deleted: number }>(body);
    },

    // Export functionality
    async export(format: 'csv' | 'json' | 'xlsx' | 'pdf' = 'csv', query?: Q): Promise<Blob> {
      const queryString = buildQueryString(query);
      const url = `${API_PREFIX}/${apiEndpoint}/export?format=${format}${queryString ? `&${queryString}` : ''}`;

      const res = await fetch(url, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Export failed: ${res.status} ${res.statusText}`);
      }

      return res.blob();
    },
  };
}

// Data interfaces (maintaining compatibility with existing code)
export interface NcrData {
  id?: string;
  ncrNumber?: string;
  title: string;
  description: string;
  status?: string;
  priority: string;
  source: string;
  sourceDefectId?: string; // Link to Daily Defect
  sourceAuditId?: string;  // Link to Audit
  linkedDefectIds?: string[];
  relatedActionIds?: string[];
  relatedDefectIds?: string[];
  relatedNcrIds?: string[];
  relatedCapaIds?: string[];
  relatedEightDIds?: string[];
  relatedCapaId?: string;
  relatedEightDId?: string;
  containmentAction?: string;
  rootCauseNotes?: string;
  verificationStatus?: string;
  effectivenessResult?: string;
  owner?: string;
  nextRequiredRole?: string;
  auditTrail?: Array<Record<string, unknown>>;
  plantId: string;
  departmentId?: string;
  supplierId?: string;
  detectedDate?: string;
  targetCloseDate?: string;
  assignedUserId?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChangeControlData {
  id?: string;
  changeNumber?: string;
  title: string;
  description?: string;
  status?: string;
  type?: string;
  priority?: string;
  category?: string;
  plantId?: string;
  departmentId?: string;
  requestedById?: string;
  requestDate?: string;
  targetDate?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComplaintData {
  id?: string;
  complaintId?: string;
  subject: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  customerName?: string;
  customerContact?: string;
  plantId?: string;
  assignedUserId?: string;
  receivedDate?: string;
  targetCloseDate?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ControlPlanData {
  id?: string;
  controlPlanId?: string;
  title?: string;
  productName?: string;
  status?: string;
  plantId?: string;
  departmentId?: string;
  preparedById?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierData {
  id?: string;
  supplierCode?: string;
  name: string;
  category?: string;
  status?: string;
  address?: any;
  primaryContact?: string;
  email?: string;
  phone?: string;
  rating?: number;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface InspectionData {
  id?: string;
  inspectionNumber?: string;
  type: string;
  productName: string;
  batchNumber?: string;
  inspectedBy?: string;
  inspectionDate?: string;
  result?: string;
  sampleSize?: number;
  defectCount?: number;
  inspectionPoints?: number;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalibrationData {
  id: string;
  itemCode: string;
  description: string;
  equipmentType: string;
  serialNumber: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  status: string;
  assignedTo: string;
  location: string;
  certificateNo?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionLayoutData {
  id: string;
  name: string;
  plantId?: string;
  version?: number;
  isPublished?: boolean;
  layout: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CapaData {
  id?: string;
  capaNumber?: string;
  title: string;
  description: string;
  status?: string;
  priority: string;
  capaType: string;
  sourceNcrId?: string;
  linkedDefectIds?: string[];
  relatedActionIds?: string[];
  relatedDefectIds?: string[];
  relatedNcrIds?: string[];
  relatedCapaIds?: string[];
  relatedEightDIds?: string[];
  relatedEightDId?: string;
  problemStatement?: string;
  rootCause?: string;
  containment?: string;
  correctiveActionPlan?: string;
  preventiveActionPlan?: string;
  owner?: string;
  dueDate?: string;
  verificationMethod?: string;
  verificationStartDate?: string;
  verificationEndDate?: string;
  effectivenessResult?: string;
  plantId: string;
  departmentId?: string;
  targetCloseDate?: string;
  assignedUserId?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface EightDData {
  id?: string;
  eightDNumber?: string;
  subject: string;
  description?: string;
  status?: string;
  plantId: string;
  ownerUserId?: string;
  ncrReportId?: string;
  relatedCapaId?: string;
  linkedDefectIds?: string[];
  relatedActionIds?: string[];
  relatedDefectIds?: string[];
  relatedNcrIds?: string[];
  relatedCapaIds?: string[];
  relatedEightDIds?: string[];
  dSections?: Record<string, Record<string, unknown>>;
  effectivenessResult?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface FmeaData {
  id?: string;
  fmeaNumber?: string;
  title: string;
  description?: string;
  status?: string;
  type: string;
  plantId: string;
  departmentId?: string;
  ownerUserId?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviationData {
  id?: string;
  deviationNumber?: string;
  title: string;
  description: string;
  type: string;
  category: string;
  status?: string;
  plantId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  productCode?: string;
  productName?: string;
  batchNumber?: string;
  processName?: string;
  reason?: string;
  impact?: string;
  riskAssessment?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditData {
  id?: string;
  auditNumber?: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  scope: string;
  auditor: string;
  auditee: string;
  scheduledDate: string;
  duration?: string;
  findings?: number;
  ncCount?: number;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

// Create unified API instances for each module
export const unifiedNcrApi = createModuleApi<NcrData, NcrQueryParams>('ncr');
export const unifiedCapaApi = createModuleApi<CapaData, CapaQueryParams>('capa');
export const unifiedEightDApi = createModuleApi<EightDData, EightDQueryParams>('eight-d');
export const unifiedFmeaApi = createModuleApi<FmeaData, FmeaQueryParams>('fmea');
export const unifiedDeviationApi = createModuleApi<DeviationData, DeviationQueryParams>('deviations');
export const unifiedChangeControlApi = createModuleApi<ChangeControlData, ChangeControlQueryParams>('change-control');
export const unifiedComplaintsApi = createModuleApi<ComplaintData, ComplaintQueryParams>('complaints');
export const unifiedControlPlanApi = createModuleApi<ControlPlanData, ControlPlanQueryParams>('control-plans');
export const unifiedSupplierApi = createModuleApi<SupplierData, SupplierQueryParams>('suppliers');
export const unifiedInspectionApi = createModuleApi<InspectionData, InspectionQueryParams>('inspections');
export const unifiedCalibrationApi = createModuleApi<CalibrationData, CalibrationQueryParams>('calibrations');
export const unifiedAuditApi = createModuleApi<AuditData, DateRangeQueryParams>('audits');
export interface DefectLogData extends BaseModuleData {
  date: string;
  shift: string;
  productionLine: string;
  partId: string;
  partNumber: string;
  recordType?: string;
  defectType: string;
  quantity: number;
  inspectedQuantity?: number;
  productionQuantity?: number;
  estimatedCost?: number;
  costCategory?: string;
  outgoingResult?: string;
  shipmentId?: string;
  customerName?: string;
  releaseTimeHrs?: number;
  returnReference?: string;
  severity: string;
  description: string;
  operatorName: string;
  actionTaken: string;
  relatedNcrId?: string; // Link to NCR
  relatedCapaId?: string;
  relatedEightDId?: string;
  relatedActionIds?: string[];
  relatedDefectIds?: string[];
  relatedNcrIds?: string[];
  relatedCapaIds?: string[];
  relatedEightDIds?: string[];
  model?: string;
  supplierName?: string;
  unitCost?: number;
  productFamily?: string;
  factory?: string;
  workshop?: string;
  capacity?: number;
  inspectionPlan?: string;
  defaultInspectionPoint?: string;
  defectCategory?: string;
  suggestedContainment?: string;
  customerCode?: string;
  market?: string;
  defaultReturnHandling?: string;
  partNameAtTime?: string;
  supplierNameAtTime?: string;
  unitCostAtTime?: number;
  defectCategoryAtTime?: string;
  modelFamilyAtTime?: string;
  productionLineAtTime?: string;
  masterDataVersion?: string;
  masterDataMatchStatus?: string;
  evidence?: Array<Record<string, unknown>>;
  auditTrail?: Array<Record<string, unknown>>;
  comments?: Array<Record<string, unknown>>;
  containmentAction?: string;
  correction?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  responsiblePerson?: string;
  dueDate?: string;
  actionStatus?: string;
  verificationResult?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  loggedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  investigationStartedAt?: string;
  escalatedAt?: string;
  containedAt?: string;
  closedAt?: string;
  reopenedAt?: string;
  approvalRequired?: boolean;
  approvalReasons?: string[];
  reviewStatus?: string;
  assignedTo?: string;
  assignedRole?: string;
  reviewedBy?: string;
  approvedBy?: string;
  rejectedBy?: string;
  closedBy?: string;
  currentOwner?: string;
  nextRequiredRole?: string;
  approvalRole?: string;
  approvalLevel?: string;
  slaStatus?: string;
  slaTargetHours?: number;
  workflowSettingsVersion?: string;
  formTemplateId?: string;
  formTemplateVersion?: number;
  relatedInspectionPlanId?: string;
  relatedInspectionPlanVersion?: number;
  relatedCheckItemId?: string;
  relatedInspectionRunId?: string;
  inspectionResult?: Record<string, unknown>;
  customFields?: Record<string, unknown>;
}

export interface DefectLogQueryParams extends DateRangeQueryParams {
  shift?: string;
  productionLine?: string;
}

export const unifiedDefectLogApi = createModuleApi<DefectLogData, DefectLogQueryParams>('defect-logs');
export const unifiedProductionLayoutApi = createModuleApi<ProductionLayoutData, ProductionLayoutQueryParams>('production-layout');

// Dashboard API
export const dashboardApi = {
  async getKPIs() {
    try {
      const res = await fetch(`${API_PREFIX}/dashboard/kpi`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) return null;
      const body = await res.json();
      return body?.data || body;
    } catch (e) {
      console.warn("Failed to fetch KPIs", e);
      return null;
    }
  },
  async getQualityTrend() {
    try {
      const res = await fetch(`${API_PREFIX}/dashboard/quality-trend`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) return [];
      const body = await res.json();
      const data = body?.data || body;
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn("Failed to fetch Quality Trend", e);
      return [];
    }
  },
  async getPlantPerformance() {
    try {
      const res = await fetch(`${API_PREFIX}/dashboard/plant-performance`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) return [];
      const body = await res.json();
      const data = body?.data || body;
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn("Failed to fetch Plant Performance", e);
      return [];
    }
  },
  async getCOPQStats() {
    try {
      const res = await fetch(`${API_PREFIX}/dashboard/copq`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) return null;
      const body = await res.json();
      return body?.data || body;
    } catch (e) {
      console.warn("Failed to fetch COPQ Stats", e);
      return null;
    }
  },
  async getComplaintsStats() {
    try {
      const res = await fetch(`${API_PREFIX}/dashboard/complaints`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) return null;
      const body = await res.json();
      return body?.data || body;
    } catch (e) {
      console.warn("Failed to fetch Complaints Stats", e);
      return null;
    }
  },
  async getPPMStats() {
    try {
      const res = await fetch(`${API_PREFIX}/dashboard/ppm`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) return null;
      const body = await res.json();
      return body?.data || body;
    } catch (e) {
      console.warn("Failed to fetch PPM Stats", e);
      return null;
    }
  },
  async getOutgoingQualityStats() {
    try {
      const res = await fetch(`${API_PREFIX}/dashboard/outgoing-quality`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) return null;
      const body = await res.json();
      return body?.data || body;
    } catch (e) {
      console.warn("Failed to fetch Outgoing Quality Stats", e);
      return null;
    }
  }
};

// Unified API registry for dynamic module access
export type ModuleKey =
  | 'ncr'
  | 'capa'
  | 'eight-d'
  | 'fmea'
  | 'deviations'
  | 'change-control'
  | 'complaints'
  | 'control-plans'
  | 'suppliers'
  | 'inspections'
  | 'calibrations'
  | 'audits'
  | 'defect-logs'
  | 'production-layout';

export const unifiedApiRegistry = {
  ncr: unifiedNcrApi,
  capa: unifiedCapaApi,
  'eight-d': unifiedEightDApi,
  fmea: unifiedFmeaApi,
  deviations: unifiedDeviationApi,
  'change-control': unifiedChangeControlApi,
  complaints: unifiedComplaintsApi,
  'control-plans': unifiedControlPlanApi,
  suppliers: unifiedSupplierApi,
  inspections: unifiedInspectionApi,
  calibrations: unifiedCalibrationApi,
  audits: unifiedAuditApi,
  'defect-logs': unifiedDefectLogApi,
  'production-layout': unifiedProductionLayoutApi,
} as const;

// Helper to get API by module key
export function getModuleApi<T extends ModuleKey>(module: T) {
  return unifiedApiRegistry[module];
}

// Re-export for convenience (backward compatible names)
export { unifiedNcrApi as ncrApi };
export { unifiedCapaApi as capaApi };
export { unifiedEightDApi as eightDApi };
export { unifiedFmeaApi as fmeaApi };

// Re-export types for backward compatibility
export type NcrResponse = PaginatedResponse<NcrData>;
export type CapaResponse = PaginatedResponse<CapaData>;
export type EightDResponse = PaginatedResponse<EightDData>;
export type FmeaResponse = PaginatedResponse<FmeaData>;
