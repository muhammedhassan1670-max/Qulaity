import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CloudRain, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Database,
  ArrowRight,
  Server
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader, PageSection } from '@/components/PageHeader';
import { 
  loadQualitySyncQueue, 
  updateQualitySyncItemStatus, 
  clearSyncedQualitySyncItems,
  type QualitySyncItem
} from '@/services/qualitySyncQueue';

export default function OfflineSyncManager() {
  const [items, setItems] = useState<QualitySyncItem[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentSyncId, setCurrentSyncId] = useState<string | null>(null);

  // Load items
  const refreshQueue = useCallback(() => {
    setItems(loadQualitySyncQueue());
  }, []);

  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  const pendingItems = items.filter(i => i.status === 'pending');
  const syncedItems = items.filter(i => i.status === 'synced');
  const failedItems = items.filter(i => i.status === 'failed' || i.status === 'conflict');

  // Simulated Sync Logic
  const handleSyncAll = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline. Please toggle Network Status to Online.');
      return;
    }
    
    if (pendingItems.length === 0 && failedItems.length === 0) {
      toast.info('Everything is up to date.');
      return;
    }

    setIsSyncing(true);
    toast.info('Starting Background Sync...');

    const itemsToProcess = [...pendingItems, ...failedItems];
    
    for (const item of itemsToProcess) {
      setCurrentSyncId(item.id);
      
      // Artificial Delay (1-2 seconds) to simulate network
      await new Promise(res => setTimeout(res, Math.random() * 1000 + 1000));
      
      // Simulate 90% success rate
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        updateQualitySyncItemStatus(item.id, 'synced');
      } else {
        updateQualitySyncItemStatus(item.id, 'failed', 'Simulated Network Timeout Error [ERR_NET_504]');
      }
      refreshQueue();
    }

    setCurrentSyncId(null);
    setIsSyncing(false);
    toast.success('Sync complete.', { description: 'All items have been processed by the background worker.' });
  };

  const handleClearSynced = () => {
    clearSyncedQualitySyncItems();
    refreshQueue();
    toast.success('Cleared synced history.');
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Smart Offline Sync Manager" 
        subtitle="Q-Elite Background Worker for seamless Shopfloor data synchronization"
      />

      <PageSection>
        {/* Top Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 mb-8">
          
          <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-center">
            {/* Background animated elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00A3E0]/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 relative">
              <div className="flex items-center gap-6">
                {/* Radar Icon */}
                <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-black/40 border border-white/10 shrink-0 shadow-xl">
                  {isSyncing && (
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-[#00A3E0]/50"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  {isSyncing && (
                    <motion.div 
                      className="absolute inset-0 rounded-full border border-[#00A3E0]/30"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                    />
                  )}
                  <Activity className={`w-8 h-8 ${isOnline ? 'text-[#00A3E0]' : 'text-red-400'} ${isSyncing ? 'animate-pulse' : ''}`} />
                </div>
                
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    {isOnline ? 'Online (Connected)' : 'Offline (Disconnected)'}
                    {!isOnline && <WifiOff className="w-5 h-5 text-red-400" />}
                    {isOnline && <Wifi className="w-5 h-5 text-[#00A3E0]" />}
                  </h3>
                  <p className="text-sm text-white/50 mt-1">
                    {isOnline 
                      ? 'Local cache is ready to synchronize with central cloud database.' 
                      : 'Working in offline mode. Actions will be queued.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[200px]">
                <button
                  type="button"
                  onClick={() => setIsOnline(!isOnline)}
                  disabled={isSyncing}
                  className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
                    isOnline 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                  } disabled:opacity-50`}
                >
                  {isOnline ? 'Simulate Disconnect' : 'Reconnect Network'}
                </button>
                <button
                  type="button"
                  onClick={handleSyncAll}
                  disabled={isSyncing || (!pendingItems.length && !failedItems.length) || !isOnline}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white text-sm font-bold shadow-lg hover:shadow-[#00A3E0]/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync All Now'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-rows-3 gap-3">
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                  <CloudRain className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-white/40">Pending Queue</p>
                  <p className="text-xl font-black text-white">{pendingItems.length}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-white/40">Failed / Conflicts</p>
                  <p className="text-xl font-black text-white">{failedItems.length}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors" onClick={handleClearSynced}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-400/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-white/40">Synced</p>
                  <p className="text-xl font-black text-white">{syncedItems.length}</p>
                </div>
              </div>
              <div className="text-[10px] text-white/30 group-hover:text-white/60 transition-colors uppercase font-bold tracking-wider">
                Clear
              </div>
            </div>
          </div>
        </div>

        {/* Sync Queue List */}
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden mt-8">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-[#00A3E0]" />
              Local Sync Ledger
            </h3>
            <span className="text-xs text-white/40 bg-black/40 px-3 py-1 rounded-full border border-white/10">
              {items.length} records in ledger
            </span>
          </div>

          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto no-scrollbar bg-black/20">
            <AnimatePresence mode="popLayout">
              {items.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center">
                  <Server className="w-12 h-12 text-white/10 mb-4" />
                  <p className="text-white/40 text-sm">Ledger is completely empty.</p>
                </div>
              ) : (
                items.map(item => {
                  const isCurrent = currentSyncId === item.id;
                  
                  return (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 lg:p-6 transition-all ${isCurrent ? 'bg-[#00A3E0]/10 border-l-2 border-l-[#00A3E0]' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {item.status === 'pending' && <CloudRain className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                          {item.status === 'synced' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                          {(item.status === 'failed' || item.status === 'conflict') && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-black uppercase text-white/60 tracking-wider">
                                {item.entityType}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-[#00A3E0]/20 text-[10px] font-black uppercase text-[#8be3ff] tracking-wider border border-[#00A3E0]/30">
                                {item.operation}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-white truncate mb-1">
                              {item.payloadSummary || `Record ID: ${item.entityId}`}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-white/40">
                              <span>Created: {new Date(item.createdAt).toLocaleString()}</span>
                              {item.retryCount > 0 && <span>• Retries: {item.retryCount}</span>}
                              <span className="font-mono text-[9px] bg-white/5 px-1 rounded truncate">ID: {item.id}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 lg:w-48 shrink-0 justify-end">
                          {isCurrent && (
                            <motion.div 
                              className="text-xs font-bold text-[#00A3E0] flex items-center gap-2"
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                            >
                              Uploading <ArrowRight className="w-3 h-3" />
                            </motion.div>
                          )}
                          {!isCurrent && item.lastError && (
                            <p className="text-[10px] text-red-400 font-mono truncate max-w-[150px]">
                              {item.lastError}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}
