/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/persistence/transaction-manager.js
 * ============================================================================
 * Coordinates atomic multi-entity operations.
 * Takes pre-operation snapshots and provides complete rollback if any
 * stage of a multi-entity transaction fails.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const TransactionManager = {
        /**
         * Run an asynchronous or synchronous operation inside an atomic transaction
         * @param {Function} transactionFn
         * @param {Object} [options]
         * @returns {Promise<Object>}
         */
        async runInTransaction(transactionFn, options = {}) {
            if (typeof transactionFn !== 'function') {
                throw new Error('Transaction callback function is required');
            }

            const storageReg = window.UDIP?.Enterprise?.StorageAdapter;
            const adapter = options.adapter || (storageReg ? storageReg.getActiveAdapter() : null);

            let snapshot = null;
            if (adapter && typeof adapter.createSnapshot === 'function') {
                snapshot = adapter.createSnapshot();
            }

            const txContext = {
                id: 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6),
                startedAt: new Date().toISOString(),
                adapter,
                aborted: false
            };

            try {
                const result = await transactionFn(txContext);
                return {
                    success: true,
                    transactionId: txContext.id,
                    result
                };
            } catch (err) {
                // Rollback state if snapshot exists
                if (adapter && snapshot && typeof adapter.restoreSnapshot === 'function') {
                    try {
                        adapter.restoreSnapshot(snapshot);
                    } catch (rollbackErr) {
                        console.error('[UDIP:TransactionManager] Critical failure during rollback:', rollbackErr);
                    }
                }

                // Log audit event for transaction failure if AuditManager is loaded
                try {
                    const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                    if (auditMgr && typeof auditMgr.logEvent === 'function') {
                        auditMgr.logEvent({
                            actorId: options.actorId || 'system',
                            action: 'TRANSACTION_ROLLED_BACK',
                            resourceType: 'TRANSACTION',
                            resourceId: txContext.id,
                            result: 'FAILED',
                            metadata: {
                                error: err?.message || String(err),
                                operation: options.name || 'unnamed_transaction'
                            }
                        });
                    }
                } catch (e) {
                    // Non-blocking audit logging
                }

                return {
                    success: false,
                    transactionId: txContext.id,
                    error: err?.message || String(err),
                    rolledBack: Boolean(snapshot)
                };
            }
        },

        /**
         * Synchronous variant for purely synchronous adapters
         * @param {Function} transactionFn
         * @param {Object} [options]
         * @returns {Object}
         */
        runSync(transactionFn, options = {}) {
            if (typeof transactionFn !== 'function') {
                throw new Error('Transaction callback function is required');
            }

            const storageReg = window.UDIP?.Enterprise?.StorageAdapter;
            const adapter = options.adapter || (storageReg ? storageReg.getActiveAdapter() : null);

            let snapshot = null;
            if (adapter && typeof adapter.createSnapshot === 'function') {
                snapshot = adapter.createSnapshot();
            }

            const txContext = {
                id: 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6),
                startedAt: new Date().toISOString(),
                adapter
            };

            try {
                const result = transactionFn(txContext);
                return {
                    success: true,
                    transactionId: txContext.id,
                    result
                };
            } catch (err) {
                if (adapter && snapshot && typeof adapter.restoreSnapshot === 'function') {
                    try {
                        adapter.restoreSnapshot(snapshot);
                    } catch (rollbackErr) {
                        console.error('[UDIP:TransactionManager] Rollback failure:', rollbackErr);
                    }
                }
                return {
                    success: false,
                    transactionId: txContext.id,
                    error: err?.message || String(err),
                    rolledBack: Boolean(snapshot)
                };
            }
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.TransactionManager = TransactionManager;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TransactionManager;
    }
})(typeof window !== 'undefined' ? window : global);
