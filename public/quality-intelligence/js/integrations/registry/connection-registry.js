/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/registry/connection-registry.js
 * ============================================================================
 * Central Enterprise Connection Registry.
 * Manages external system connections across lifecycle states:
 * DRAFT -> CONFIGURED -> CONNECTED -> DEGRADED -> ERROR -> DISABLED
 * Enforces project scope isolation, RBAC permissions, and credential masking.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const CONNECTION_STATUSES = Object.freeze({
        DRAFT: 'DRAFT',
        CONFIGURED: 'CONFIGURED',
        CONNECTED: 'CONNECTED',
        DEGRADED: 'DEGRADED',
        ERROR: 'ERROR',
        DISABLED: 'DISABLED'
    });

    const SENSITIVE_KEYS = new Set([
        'password',
        'secret',
        'apiKey',
        'api_key',
        'token',
        'bearer',
        'access_token',
        'client_secret',
        'private_key'
    ]);

    class ConnectionRegistry {
        constructor() {
            this._repository = null;
            this._memStore = new Map();
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    try {
                        this._repository = new RepoClass('connections', 'cn');
                    } catch (e) {
                        this._repository = null;
                    }
                }
            }
            return this._repository;
        }

        /**
         * Register/Create a new external connection record
         * @param {Object} connData
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        registerConnection(connData = {}, actorId = 'system') {
            const name = connData.name;
            const type = (connData.type || connData.sourceType || 'FILE').toLowerCase();
            const projectId = connData.projectId || 'prj_default';
            const workspaceId = connData.workspaceId || null;
            const rawConfig = connData.config || connData.configuration || {};
            const initialStatus = connData.status || CONNECTION_STATUSES.CONFIGURED;

            if (!name) throw new Error('Connection name is required');

            // 1. Extract plaintext credentials for Ephemeral CredentialProvider
            const extractedCreds = {};
            for (const [k, v] of Object.entries(rawConfig)) {
                if (SENSITIVE_KEYS.has(k) || SENSITIVE_KEYS.has(k.toLowerCase())) {
                    extractedCreds[k] = v;
                }
            }
            if (connData.credentials) {
                Object.assign(extractedCreds, connData.credentials);
            }

            // 2. Sanitize/redact configuration
            const authStrategy = window.UDIP?.Integrations?.AuthStrategy;
            const sanitizedConfig = authStrategy ? authStrategy.redactConfig(rawConfig) : { ...rawConfig };

            const id = connData.id || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const record = {
                id,
                name,
                type,
                sourceType: type.toUpperCase(),
                connectorId: `connector_${type}`,
                projectId,
                workspaceId,
                ownerId: actorId,
                config: sanitizedConfig,
                configuration: sanitizedConfig,
                status: CONNECTION_STATUSES[initialStatus] || CONNECTION_STATUSES.CONFIGURED,
                health: 'UNKNOWN',
                lastSyncAt: null,
                lastError: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const repo = this._getRepo();
            if (repo) {
                const created = repo.create(record, actorId);
                record.id = created.id || record.id;
            } else {
                this._memStore.set(record.id, record);
            }

            // 3. Store credentials in ephemeral memory
            const credProvider = window.UDIP?.Integrations?.CredentialProvider;
            if (credProvider && typeof credProvider.setCredentials === 'function' && Object.keys(extractedCreds).length > 0) {
                credProvider.setCredentials(record.id, extractedCreds);
            }

            this._audit('CONNECTION_CREATED', record.id, projectId, actorId, { name, type });
            return { ...record };
        }

        createConnection(connData, actorId) {
            return this.registerConnection(connData, actorId);
        }

        /**
         * Get connection by ID
         * @param {string} id
         * @returns {Object|null}
         */
        getConnection(id) {
            const repo = this._getRepo();
            if (repo) {
                const found = repo.findById(id);
                return found ? { ...found } : null;
            }
            const mem = this._memStore.get(id);
            return mem ? { ...mem } : null;
        }

        /**
         * Update connection configuration or status
         * @param {string} id
         * @param {Object} updates
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        updateConnection(id, updates = {}, actorId = 'system') {
            const existing = this.getConnection(id);
            if (!existing) return null;

            const sanitized = { ...updates, updatedAt: new Date().toISOString() };
            if (sanitized.config || sanitized.configuration) {
                const cfg = sanitized.config || sanitized.configuration;
                const authStrategy = window.UDIP?.Integrations?.AuthStrategy;
                sanitized.config = authStrategy ? authStrategy.redactConfig(cfg) : cfg;
                sanitized.configuration = sanitized.config;
            }

            if (updates.credentials) {
                const credProvider = window.UDIP?.Integrations?.CredentialProvider;
                if (credProvider) credProvider.setCredentials(id, updates.credentials);
                delete sanitized.credentials;
            }

            const repo = this._getRepo();
            if (repo) {
                return repo.update(id, sanitized, actorId);
            }

            const merged = { ...existing, ...sanitized };
            this._memStore.set(id, merged);
            return { ...merged };
        }

        /**
         * Update status helper
         * @param {string} id
         * @param {string} status
         * @param {string} [reason]
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        updateStatus(id, status, reason = null, actorId = 'system') {
            const validStatus = CONNECTION_STATUSES[status] || status;
            return this.updateConnection(id, {
                status: validStatus,
                statusReason: reason
            }, actorId);
        }

        /**
         * Disable a connection
         * @param {string} id
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        disableConnection(id, actorId = 'system') {
            return this.updateStatus(id, CONNECTION_STATUSES.DISABLED, 'Administratively disabled', actorId);
        }

        /**
         * List connections with optional filtering
         * @param {Object|string} [filter] - { projectId, type, status } or string projectId
         * @param {Object} [user]
         * @returns {Array<Object>}
         */
        listConnections(filter = null, user = null) {
            let options = {};
            if (typeof filter === 'string') {
                options.projectId = filter;
            } else if (filter && typeof filter === 'object') {
                options = { ...filter };
            }

            const repo = this._getRepo();
            let all = [];
            if (repo) {
                all = repo.findAll(c => {
                    if (options.projectId && c.projectId !== options.projectId) return false;
                    if (options.type && c.type !== options.type) return false;
                    if (options.status && c.status !== options.status) return false;
                    return true;
                });
            } else {
                all = Array.from(this._memStore.values()).filter(c => {
                    if (options.projectId && c.projectId !== options.projectId) return false;
                    if (options.type && c.type !== options.type) return false;
                    if (options.status && c.status !== options.status) return false;
                    return true;
                });
            }

            if (!user) return all.map(c => ({ ...c }));

            const perm = window.UDIP?.Enterprise?.PermissionEngine;
            if (!perm) return all.map(c => ({ ...c }));

            return all.filter(c => perm.can(user, 'dataset.read', c).allowed).map(c => ({ ...c }));
        }

        /**
         * Clear connection registry state
         */
        reset() {
            this._memStore.clear();
        }

        _audit(action, connectionId, projectId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'CONNECTION',
                        resourceId: connectionId,
                        projectId,
                        result: 'SUCCESS',
                        metadata
                    });
                }
            } catch (e) { /* non-blocking */ }
        }
    }

    const instance = new ConnectionRegistry();
    instance.ConnectionRegistry = ConnectionRegistry;
    instance.CONNECTION_STATUSES = CONNECTION_STATUSES;

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.ConnectionRegistry = instance;
    window.UDIP.Integrations.defaultConnectionRegistry = instance;
    window.UDIP.Integrations.CONNECTION_STATUSES = CONNECTION_STATUSES;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
