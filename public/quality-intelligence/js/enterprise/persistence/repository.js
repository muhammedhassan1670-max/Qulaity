/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/persistence/repository.js
 * ============================================================================
 * Generic Repository pattern enforcing the Enterprise Data Model invariants:
 * - Every entity has: id, createdAt, updatedAt, createdBy, updatedBy, status
 * - Stable, prefixed IDs (never relying on display names)
 * - Safe soft deletion (status: 'DELETED') and recovery
 * ============================================================================
 */

(function (window) {
    'use strict';

    let _idCounter = Date.now();

    function generateStableId(prefix = 'ent') {
        _idCounter++;
        const rand = Math.random().toString(36).substring(2, 9);
        return `${prefix}_${_idCounter.toString(36)}_${rand}`;
    }

    class Repository {
        /**
         * @param {string} collectionName
         * @param {string} idPrefix
         * @param {Object} [adapter]
         */
        constructor(collectionName, idPrefix = 'ent', adapter = null) {
            this.collectionName = collectionName;
            this.idPrefix = idPrefix;
            this._customAdapter = adapter;
        }

        _getAdapter() {
            if (this._customAdapter) return this._customAdapter;
            const reg = window.UDIP?.Enterprise?.StorageAdapter;
            return reg ? reg.getActiveAdapter() : null;
        }

        /**
         * Create a new entity with enforced enterprise metadata
         * @param {Object} data
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        create(data = {}, actorId = 'system') {
            const adapter = this._getAdapter();
            if (!adapter) throw new Error(`No storage adapter available for repository ${this.collectionName}`);

            const now = new Date().toISOString();
            const id = data.id || generateStableId(this.idPrefix);

            const entity = {
                ...data,
                id,
                createdAt: data.createdAt || now,
                updatedAt: now,
                createdBy: data.createdBy || actorId,
                updatedBy: actorId,
                status: data.status || 'ACTIVE'
            };

            return adapter.save(this.collectionName, id, entity);
        }

        /**
         * Find entity by ID
         * @param {string} id
         * @param {boolean} [includeDeleted=false]
         * @returns {Object|null}
         */
        findById(id, includeDeleted = false) {
            if (!id) return null;
            const adapter = this._getAdapter();
            if (!adapter) return null;

            const item = adapter.get(this.collectionName, id);
            if (!item) return null;
            if (!includeDeleted && item.status === 'DELETED') return null;
            return item;
        }

        /**
         * Find all entities matching an optional filter
         * @param {Function} [filterFn]
         * @param {boolean} [includeDeleted=false]
         * @returns {Array}
         */
        findAll(filterFn = null, includeDeleted = false) {
            const adapter = this._getAdapter();
            if (!adapter) return [];

            const items = adapter.list(this.collectionName, item => {
                if (!includeDeleted && item.status === 'DELETED') return false;
                return typeof filterFn === 'function' ? filterFn(item) : true;
            });

            return items;
        }

        /**
         * Update entity fields
         * @param {string} id
         * @param {Object} updates
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        update(id, updates = {}, actorId = 'system') {
            if (!id) return null;
            const adapter = this._getAdapter();
            if (!adapter) return null;

            const existing = this.findById(id, true);
            if (!existing) return null;

            const now = new Date().toISOString();
            const sanitizedUpdates = { ...updates };
            // Protect immutable creation metadata
            delete sanitizedUpdates.id;
            delete sanitizedUpdates.createdAt;
            delete sanitizedUpdates.createdBy;

            sanitizedUpdates.updatedAt = now;
            sanitizedUpdates.updatedBy = actorId;

            return adapter.update(this.collectionName, id, sanitizedUpdates);
        }

        /**
         * Soft delete entity
         * @param {string} id
         * @param {string} [actorId='system']
         * @returns {boolean}
         */
        softDelete(id, actorId = 'system') {
            const existing = this.findById(id, false);
            if (!existing) return false;

            const updated = this.update(id, {
                status: 'DELETED',
                deletedAt: new Date().toISOString()
            }, actorId);

            return Boolean(updated);
        }

        /**
         * Restore soft-deleted entity
         * @param {string} id
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        restore(id, actorId = 'system') {
            const existing = this.findById(id, true);
            if (!existing || existing.status !== 'DELETED') return null;

            return this.update(id, {
                status: 'ACTIVE',
                restoredAt: new Date().toISOString()
            }, actorId);
        }

        /**
         * Hard delete entity from storage
         * @param {string} id
         * @returns {boolean}
         */
        hardDelete(id) {
            if (!id) return false;
            const adapter = this._getAdapter();
            return adapter ? adapter.delete(this.collectionName, id) : false;
        }

        /**
         * Count entities
         * @param {Function} [filterFn]
         * @param {boolean} [includeDeleted=false]
         * @returns {number}
         */
        count(filterFn = null, includeDeleted = false) {
            return this.findAll(filterFn, includeDeleted).length;
        }

        /**
         * Clear collection
         */
        clear() {
            const adapter = this._getAdapter();
            if (adapter && typeof adapter.clear === 'function') {
                adapter.clear(this.collectionName);
            }
        }
    }

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.Repository = Repository;
    window.UDIP.Enterprise.generateStableId = generateStableId;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { Repository, generateStableId };
    }
})(typeof window !== 'undefined' ? window : global);
