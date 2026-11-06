/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/persistence/storage-adapter.js
 * ============================================================================
 * Storage abstraction layer decoupling enterprise logic from storage engines.
 * Supports MemoryAdapter (tests/node) and LocalStorageAdapter (browser client),
 * designed to be extensible to IndexedDB, Supabase, Postgres, REST APIs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    /**
     * In-Memory Storage Adapter
     */
    class MemoryAdapter {
        constructor() {
            this._store = new Map();
        }

        _getCollection(collection) {
            if (!this._store.has(collection)) {
                this._store.set(collection, new Map());
            }
            return this._store.get(collection);
        }

        save(collection, id, data) {
            if (!collection || !id) throw new Error('Collection and ID required');
            const col = this._getCollection(collection);
            const cloned = JSON.parse(JSON.stringify(data));
            col.set(id, cloned);
            return JSON.parse(JSON.stringify(cloned));
        }

        get(collection, id) {
            if (!collection || !id) return null;
            const col = this._getCollection(collection);
            const item = col.get(id);
            return item ? JSON.parse(JSON.stringify(item)) : null;
        }

        update(collection, id, partial) {
            if (!collection || !id) throw new Error('Collection and ID required');
            const existing = this.get(collection, id);
            if (!existing) return null;
            const updated = { ...existing, ...JSON.parse(JSON.stringify(partial)) };
            return this.save(collection, id, updated);
        }

        delete(collection, id) {
            if (!collection || !id) return false;
            const col = this._getCollection(collection);
            return col.delete(id);
        }

        list(collection, filterFn = null) {
            if (!collection) return [];
            const col = this._getCollection(collection);
            const items = Array.from(col.values()).map(v => JSON.parse(JSON.stringify(v)));
            return typeof filterFn === 'function' ? items.filter(filterFn) : items;
        }

        query(collection, queryObj = {}) {
            return this.list(collection, item => {
                for (const [key, val] of Object.entries(queryObj)) {
                    if (item[key] !== val) return false;
                }
                return true;
            });
        }

        clear(collection = null) {
            if (collection) {
                this._getCollection(collection).clear();
            } else {
                this._store.clear();
            }
        }

        createSnapshot() {
            const snap = {};
            for (const [colName, colMap] of this._store.entries()) {
                snap[colName] = {};
                for (const [id, val] of colMap.entries()) {
                    snap[colName][id] = JSON.parse(JSON.stringify(val));
                }
            }
            return snap;
        }

        restoreSnapshot(snapshot) {
            this._store.clear();
            if (!snapshot) return;
            for (const [colName, records] of Object.entries(snapshot)) {
                const colMap = this._getCollection(colName);
                for (const [id, val] of Object.entries(records)) {
                    colMap.set(id, JSON.parse(JSON.stringify(val)));
                }
            }
        }
    }

    /**
     * Browser LocalStorage Adapter with in-memory fallback
     */
    class LocalStorageAdapter {
        constructor(prefix = 'udip_ent_') {
            this.prefix = prefix;
            this._memFallback = new MemoryAdapter();
            this._hasLocalStorage = this._checkLocalStorage();
        }

        _checkLocalStorage() {
            try {
                if (typeof window === 'undefined' || !window.localStorage) return false;
                const testKey = `${this.prefix}__test__`;
                window.localStorage.setItem(testKey, '1');
                window.localStorage.removeItem(testKey);
                return true;
            } catch (e) {
                return false;
            }
        }

        _getKey(collection) {
            return `${this.prefix}${collection}`;
        }

        _readCol(collection) {
            if (!this._hasLocalStorage) return this._memFallback.list(collection);
            try {
                const raw = window.localStorage.getItem(this._getKey(collection));
                return raw ? JSON.parse(raw) : [];
            } catch (e) {
                return this._memFallback.list(collection);
            }
        }

        _writeCol(collection, items) {
            if (!this._hasLocalStorage) {
                this._memFallback.clear(collection);
                items.forEach(it => this._memFallback.save(collection, it.id, it));
                return;
            }
            try {
                window.localStorage.setItem(this._getKey(collection), JSON.stringify(items));
            } catch (e) {
                // Quota exceeded or error -> write to memory fallback
                this._memFallback.clear(collection);
                items.forEach(it => this._memFallback.save(collection, it.id, it));
            }
        }

        save(collection, id, data) {
            const items = this._readCol(collection);
            const idx = items.findIndex(i => i.id === id);
            const itemToSave = { ...data, id };
            if (idx >= 0) {
                items[idx] = itemToSave;
            } else {
                items.push(itemToSave);
            }
            this._writeCol(collection, items);
            return JSON.parse(JSON.stringify(itemToSave));
        }

        get(collection, id) {
            const items = this._readCol(collection);
            const found = items.find(i => i.id === id);
            return found ? JSON.parse(JSON.stringify(found)) : null;
        }

        update(collection, id, partial) {
            const existing = this.get(collection, id);
            if (!existing) return null;
            const updated = { ...existing, ...partial };
            return this.save(collection, id, updated);
        }

        delete(collection, id) {
            const items = this._readCol(collection);
            const next = items.filter(i => i.id !== id);
            if (next.length !== items.length) {
                this._writeCol(collection, next);
                return true;
            }
            return false;
        }

        list(collection, filterFn = null) {
            const items = this._readCol(collection);
            return typeof filterFn === 'function' ? items.filter(filterFn) : items;
        }

        query(collection, queryObj = {}) {
            return this.list(collection, item => {
                for (const [key, val] of Object.entries(queryObj)) {
                    if (item[key] !== val) return false;
                }
                return true;
            });
        }

        clear(collection = null) {
            if (!this._hasLocalStorage) {
                this._memFallback.clear(collection);
                return;
            }
            if (collection) {
                window.localStorage.removeItem(this._getKey(collection));
            } else {
                const keysToRemove = [];
                for (let i = 0; i < window.localStorage.length; i++) {
                    const key = window.localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => window.localStorage.removeItem(k));
            }
        }

        createSnapshot() {
            if (!this._hasLocalStorage) return this._memFallback.createSnapshot();
            const snap = {};
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    const colName = key.slice(this.prefix.length);
                    try {
                        snap[colName] = JSON.parse(window.localStorage.getItem(key));
                    } catch (e) {
                        snap[colName] = [];
                    }
                }
            }
            return snap;
        }

        restoreSnapshot(snapshot) {
            this.clear();
            if (!snapshot) return;
            if (!this._hasLocalStorage) {
                this._memFallback.restoreSnapshot(snapshot);
                return;
            }
            for (const [colName, items] of Object.entries(snapshot)) {
                this._writeCol(colName, Array.isArray(items) ? items : Object.values(items));
            }
        }
    }

    // Default Storage Adapter Registry
    let _activeAdapter = typeof window !== 'undefined' && window.localStorage ? new LocalStorageAdapter() : new MemoryAdapter();

    const StorageAdapterRegistry = {
        MemoryAdapter,
        LocalStorageAdapter,
        getActiveAdapter() {
            return _activeAdapter;
        },
        setActiveAdapter(adapter) {
            if (adapter && typeof adapter.save === 'function') {
                _activeAdapter = adapter;
            }
        },
        useMemory() {
            _activeAdapter = new MemoryAdapter();
            return _activeAdapter;
        },
        useLocalStorage(prefix) {
            _activeAdapter = new LocalStorageAdapter(prefix);
            return _activeAdapter;
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.StorageAdapter = StorageAdapterRegistry;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = StorageAdapterRegistry;
    }
})(typeof window !== 'undefined' ? window : global);
