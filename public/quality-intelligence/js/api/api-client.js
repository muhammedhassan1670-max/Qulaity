/**
 * Enterprise API Client
 * Universal Data Intelligence Platform (UDIP)
 *
 * Facilitates browser communication with the backend API Gateway (/api/v1/).
 * Handles session tokens, automatic refresh rotation, and fallback resilience.
 */

class ApiClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000/api/v1';
    this.token = null;
    this.refreshToken = null;
    this.currentUser = null;
    this._isRefreshing = false;
  }

  setSession(token, refreshToken = null, user = null) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.currentUser = user;
  }

  clearSession() {
    this.token = null;
    this.refreshToken = null;
    this.currentUser = null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const fetchOptions = {
      method: options.method || 'GET',
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
    };

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (err) {
      // Return synthetic offline response if server unreachable
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: `Unable to connect to backend: ${err.message}` }
      };
    }

    // Auto-refresh token on 401 if refreshToken is available
    if (response.status === 401 && this.refreshToken && !this._isRefreshing && endpoint !== '/auth/refresh') {
      this._isRefreshing = true;
      try {
        const refreshRes = await this.auth.refresh(this.refreshToken);
        if (refreshRes.success && refreshRes.data.token) {
          this.token = refreshRes.data.token;
          if (refreshRes.data.refreshToken) {
            this.refreshToken = refreshRes.data.refreshToken;
          }
          headers['Authorization'] = `Bearer ${this.token}`;
          fetchOptions.headers = headers;
          response = await fetch(url, fetchOptions);
        }
      } catch (e) {
        this.clearSession();
      } finally {
        this._isRefreshing = false;
      }
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = { success: response.ok, status: response.status };
    }

    return payload;
  }

  // Auth
  get auth() {
    return {
      register: (userData) => this.request('/auth/register', { method: 'POST', body: userData }),
      login: async (credentials) => {
        const res = await this.request('/auth/login', { method: 'POST', body: credentials });
        if (res.success && res.data) {
          this.setSession(res.data.token, res.data.refreshToken, res.data.user);
        }
        return res;
      },
      refresh: (refreshToken) => this.request('/auth/refresh', { method: 'POST', body: { refreshToken } }),
      logout: async () => {
        const res = await this.request('/auth/logout', { method: 'POST' });
        this.clearSession();
        return res;
      },
      me: () => this.request('/auth/me')
    };
  }

  // Projects
  get projects() {
    return {
      list: () => this.request('/projects'),
      create: (data) => this.request('/projects', { method: 'POST', body: data }),
      get: (id) => this.request(`/projects/${id}`),
      addMember: (id, member) => this.request(`/projects/${id}/members`, { method: 'POST', body: member })
    };
  }

  // Datasets
  get datasets() {
    return {
      list: (workspaceId) => this.request(`/datasets?workspaceId=${encodeURIComponent(workspaceId)}`),
      create: (data) => this.request('/datasets', { method: 'POST', body: data }),
      get: (id) => this.request(`/datasets/${id}`),
      ingestVersion: (id, versionData) => this.request(`/datasets/${id}/versions`, { method: 'POST', body: versionData }),
      listVersions: (id) => this.request(`/datasets/${id}/versions`)
    };
  }

  // Copilot
  get copilot() {
    return {
      query: (data) => this.request('/copilot/query', { method: 'POST', body: data })
    };
  }

  // Jobs
  get jobs() {
    return {
      list: (status = null) => this.request(`/jobs${status ? `?status=${encodeURIComponent(status)}` : ''}`),
      get: (id) => this.request(`/jobs/${id}`),
      enqueue: (data) => this.request('/jobs', { method: 'POST', body: data })
    };
  }

  // Health
  get health() {
    return {
      check: () => this.request('/health')
    };
  }
}

if (typeof window !== 'undefined') {
  window.ApiClient = ApiClient;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiClient };
}
