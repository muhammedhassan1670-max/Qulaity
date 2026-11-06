/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/identity/user-manager.js
 * ============================================================================
 * Enterprise User Management with profile lifecycle, status enforcement,
 * and current session identity tracking.
 * Strictly labels identity as: LOCAL DEVELOPMENT IDENTITY
 * Never stores passwords or security tokens in client-side storage.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const USER_STATUSES = Object.freeze({
        ACTIVE: 'ACTIVE',
        SUSPENDED: 'SUSPENDED',
        INVITED: 'INVITED',
        DISABLED: 'DISABLED'
    });

    const DEFAULT_USERS = [
        {
            id: 'usr_admin',
            displayName: 'Enterprise Administrator',
            email: 'admin@enterprise.udip.internal',
            roleIds: ['Administrator'],
            status: 'ACTIVE',
            organizationId: 'org_default',
            createdAt: '2026-01-01T00:00:00.000Z',
            lastActiveAt: new Date().toISOString()
        },
        {
            id: 'usr_analyst',
            displayName: 'Senior Data Analyst',
            email: 'analyst@enterprise.udip.internal',
            roleIds: ['Analyst'],
            status: 'ACTIVE',
            organizationId: 'org_default',
            createdAt: '2026-01-01T00:00:00.000Z',
            lastActiveAt: new Date().toISOString()
        },
        {
            id: 'usr_viewer',
            displayName: 'Executive Stakeholder',
            email: 'viewer@enterprise.udip.internal',
            roleIds: ['Viewer'],
            status: 'ACTIVE',
            organizationId: 'org_default',
            createdAt: '2026-01-01T00:00:00.000Z',
            lastActiveAt: new Date().toISOString()
        },
        {
            id: 'usr_auditor',
            displayName: 'Compliance Officer',
            email: 'auditor@enterprise.udip.internal',
            roleIds: ['Auditor'],
            status: 'ACTIVE',
            organizationId: 'org_default',
            createdAt: '2026-01-01T00:00:00.000Z',
            lastActiveAt: new Date().toISOString()
        }
    ];

    let _currentUser = null;

    class UserManager {
        constructor() {
            this._repository = null;
            this._initialized = false;
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    this._repository = new RepoClass('users', 'usr');
                }
            }
            return this._repository;
        }

        /**
         * Initialize User Manager and seed default users if empty
         */
        init() {
            const repo = this._getRepo();
            if (!repo) return;

            if (repo.count(null, true) === 0) {
                for (const u of DEFAULT_USERS) {
                    repo.create(u, 'system_bootstrap');
                }
            }

            if (!_currentUser) {
                _currentUser = this.getUser('usr_admin') || DEFAULT_USERS[0];
            }
            this._initialized = true;
        }

        /**
         * Create a new enterprise user
         * @param {Object} userData
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        createUser({ displayName, email, roleIds = ['Viewer'], organizationId = 'org_default', status = 'ACTIVE' }, actorId = 'system') {
            if (!displayName || !email) {
                throw new Error('displayName and email are required for user creation');
            }

            const repo = this._getRepo();
            if (!repo) throw new Error('User repository unavailable');

            // Prevent duplicate emails
            const existing = repo.findAll(u => u.email.toLowerCase() === email.toLowerCase());
            if (existing.length > 0) {
                throw new Error(`User with email "${email}" already exists`);
            }

            const newUser = repo.create({
                displayName,
                email: email.toLowerCase(),
                roleIds: Array.isArray(roleIds) ? roleIds : [roleIds],
                organizationId,
                status: USER_STATUSES[status] || USER_STATUSES.ACTIVE,
                lastActiveAt: new Date().toISOString()
            }, actorId);

            // Audit
            this._audit('USER_CREATED', newUser.id, actorId, { email, roleIds });
            return newUser;
        }

        /**
         * Get user by ID
         * @param {string} id
         * @param {boolean} [includeDeleted=false]
         * @returns {Object|null}
         */
        getUser(id, includeDeleted = false) {
            const repo = this._getRepo();
            if (!repo) {
                return DEFAULT_USERS.find(u => u.id === id) || null;
            }
            return repo.findById(id, includeDeleted);
        }

        /**
         * Update user profile
         * @param {string} id
         * @param {Object} updates
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        updateUser(id, updates = {}, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return null;

            const updated = repo.update(id, updates, actorId);
            if (updated) {
                this._audit('USER_UPDATED', id, actorId, updates);
                if (_currentUser && _currentUser.id === id) {
                    _currentUser = updated;
                }
            }
            return updated;
        }

        /**
         * Set user status (ACTIVE, SUSPENDED, INVITED, DISABLED)
         * @param {string} id
         * @param {string} status
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        setUserStatus(id, status, actorId = 'system') {
            if (!USER_STATUSES[status]) {
                throw new Error(`Invalid user status: ${status}. Must be one of ${Object.keys(USER_STATUSES).join(', ')}`);
            }
            return this.updateUser(id, { status }, actorId);
        }

        /**
         * Soft delete user
         * @param {string} id
         * @param {string} [actorId='system']
         * @returns {boolean}
         */
        deleteUser(id, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return false;
            const success = repo.softDelete(id, actorId);
            if (success) {
                this._audit('USER_DELETED', id, actorId, { softDelete: true });
            }
            return success;
        }

        /**
         * List all users
         * @param {Function} [filterFn]
         * @returns {Array<Object>}
         */
        listUsers(filterFn = null) {
            const repo = this._getRepo();
            if (!repo) return DEFAULT_USERS;
            return repo.findAll(filterFn);
        }

        /**
         * Get the currently active session user
         * @returns {Object}
         */
        getCurrentUser() {
            if (!_currentUser) {
                this.init();
            }
            return _currentUser || DEFAULT_USERS[0];
        }

        /**
         * Switch or set active session user
         * @param {string|Object} userOrId
         * @returns {Object}
         */
        setCurrentUser(userOrId) {
            if (!userOrId) return this.getCurrentUser();
            if (typeof userOrId === 'string') {
                const found = this.getUser(userOrId);
                if (found) {
                    _currentUser = found;
                }
            } else if (typeof userOrId === 'object' && userOrId.id) {
                _currentUser = userOrId;
            }
            return _currentUser;
        }

        _audit(action, resourceId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'USER',
                        resourceId,
                        result: 'SUCCESS',
                        metadata
                    });
                }
            } catch (e) {
                // Non-blocking
            }
        }
    }

    const instance = new UserManager();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.UserManager = instance;
    window.UDIP.Enterprise.USER_STATUSES = USER_STATUSES;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
