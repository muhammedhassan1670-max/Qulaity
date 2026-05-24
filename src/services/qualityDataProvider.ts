import {
  unifiedCapaApi,
  unifiedDefectLogApi,
  unifiedEightDApi,
  unifiedNcrApi,
  type CapaData,
  type DefectLogData,
  type EightDData,
  type NcrData,
} from '@/api/unified-api';
import {
  loadAllQualityMasterTables,
  type QualityMasterRecord,
  type QualityMasterTableId,
} from '@/services/qualityMasterData';
import {
  buildLocalWorkflowUser,
  buildMyWorkflowTasks,
  buildWorkflowNotifications,
  loadDefectWorkflowGovernanceSettings,
  loadLocalWorkflowRole,
  loadReadWorkflowNotificationIds,
  type DefectWorkflowGovernanceSettings,
  type DefectWorkflowNotification,
  type DefectWorkflowTask,
} from '@/services/defectWorkflowGovernance';
import { loadQualitySyncQueue, type QualitySyncItem } from '@/services/qualitySyncQueue';
import {
  buildImprovementActionNotifications,
  buildImprovementActionTasks,
  loadImprovementActions,
  type QualityImprovementAction,
} from '@/services/qualityImprovementActions';
import {
  loadQualityKnowledgeBase,
  type QualityKnowledgeItem,
} from '@/services/qualityKnowledgeBase';
import {
  buildClosedLoopNotifications,
  buildClosedLoopTasks,
} from '@/services/qualityClosedLoopIntegration';

export interface QualityDataSnapshot {
  defectRecords: DefectLogData[];
  masterData: Record<QualityMasterTableId, QualityMasterRecord[]>;
  workflowSettings: DefectWorkflowGovernanceSettings;
  notifications: DefectWorkflowNotification[];
  tasks: DefectWorkflowTask[];
  syncQueue: QualitySyncItem[];
  improvementActions: QualityImprovementAction[];
  qualityKnowledge: QualityKnowledgeItem[];
  ncr: NcrData[];
  capa: CapaData[];
  eightD: EightDData[];
  loadedAt: string;
  provider: 'local' | 'api-placeholder' | 'hybrid-placeholder';
}

export interface QualityDataProvider {
  name: string;
  loadSnapshot(): Promise<QualityDataSnapshot>;
}

function emptySnapshot(provider: QualityDataSnapshot['provider']): QualityDataSnapshot {
  const workflowSettings = loadDefectWorkflowGovernanceSettings();
  return {
    defectRecords: [],
    masterData: loadAllQualityMasterTables(),
    workflowSettings,
    notifications: [],
    tasks: [],
    syncQueue: loadQualitySyncQueue(),
    improvementActions: loadImprovementActions(),
    qualityKnowledge: loadQualityKnowledgeBase(true),
    ncr: [],
    capa: [],
    eightD: [],
    loadedAt: new Date().toISOString(),
    provider,
  };
}

export class LocalQualityDataProvider implements QualityDataProvider {
  name = 'LocalQualityDataProvider';

  async loadSnapshot(): Promise<QualityDataSnapshot> {
    const [defects, ncr, capa, eightD] = await Promise.all([
      unifiedDefectLogApi.getAll().then((response) => response.data || []).catch(() => []),
      unifiedNcrApi.getAll().then((response) => response.data || []).catch(() => []),
      unifiedCapaApi.getAll().then((response) => response.data || []).catch(() => []),
      unifiedEightDApi.getAll().then((response) => response.data || []).catch(() => []),
    ]);
    const workflowSettings = loadDefectWorkflowGovernanceSettings();
    const workflowUser = buildLocalWorkflowUser(null, loadLocalWorkflowRole());
    const readIds = loadReadWorkflowNotificationIds();
    const improvementActions = loadImprovementActions();
    const qualityKnowledge = loadQualityKnowledgeBase(true);
    const workflowNotifications = buildWorkflowNotifications(defects, workflowUser, workflowSettings, readIds);
    const workflowTasks = buildMyWorkflowTasks(defects, workflowUser, workflowSettings);
    const closedLoopNotifications = buildClosedLoopNotifications({ ncrs: ncr, capas: capa, eightDs: eightD, actions: improvementActions, readIds });
    const closedLoopTasks = buildClosedLoopTasks({ ncrs: ncr, capas: capa, eightDs: eightD });
    return {
      defectRecords: defects,
      masterData: loadAllQualityMasterTables(),
      workflowSettings,
      notifications: [...workflowNotifications, ...buildImprovementActionNotifications(improvementActions, readIds), ...closedLoopNotifications],
      tasks: [...workflowTasks, ...buildImprovementActionTasks(improvementActions), ...closedLoopTasks],
      syncQueue: loadQualitySyncQueue(),
      improvementActions,
      qualityKnowledge,
      ncr,
      capa,
      eightD,
      loadedAt: new Date().toISOString(),
      provider: 'local',
    };
  }
}

export class ApiQualityDataProvider implements QualityDataProvider {
  name = 'ApiQualityDataProvider';

  async loadSnapshot(): Promise<QualityDataSnapshot> {
    return emptySnapshot('api-placeholder');
  }
}

export class HybridQualityDataProvider implements QualityDataProvider {
  name = 'HybridQualityDataProvider';

  async loadSnapshot(): Promise<QualityDataSnapshot> {
    const local = new LocalQualityDataProvider();
    const snapshot = await local.loadSnapshot();
    return { ...snapshot, provider: 'hybrid-placeholder' };
  }
}

export function createQualityDataProvider(mode: 'local' | 'api' | 'hybrid' = 'local'): QualityDataProvider {
  if (mode === 'api') return new ApiQualityDataProvider();
  if (mode === 'hybrid') return new HybridQualityDataProvider();
  return new LocalQualityDataProvider();
}
