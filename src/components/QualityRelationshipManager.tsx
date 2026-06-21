import { useEffect, useMemo, useState } from 'react';
import { Link2, Save, Search, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import type {
  CapaData,
  DefectLogData,
  EightDData,
  NcrData,
  InspectionData,
  SupplierData,
  ComplaintData,
  ControlPlanData,
  ChangeControlData,
  DeviationData,
  AuditData,
  CalibrationData,
  FmeaData,
} from '@/api/unified-api';
import type { QualityImprovementAction } from '@/services/qualityImprovementActions';
import { loadImprovementActions } from '@/services/qualityImprovementActions';
import {
  blockedRelationshipAudit,
  createQualityRelationship,
  relationshipExists,
  relationshipsForEntity,
  removeQualityRelationship,
  updateQualityRelationshipNote,
  type QualityRelationshipEntityType,
  type QualityRelationshipRecord,
} from '@/services/qualityRelationships';
import { loadSafeLocalDefectRecords } from '@/services/safeDefectStorage';

interface RelationshipRecordCollections {
  defects: DefectLogData[];
  ncrs: NcrData[];
  capas: CapaData[];
  eightDs: EightDData[];
  actions: QualityImprovementAction[];
  inspections: InspectionData[];
  suppliers: SupplierData[];
  complaints: ComplaintData[];
  controlPlans: ControlPlanData[];
  changeControls: ChangeControlData[];
  deviations: DeviationData[];
  audits: AuditData[];
  calibrations: CalibrationData[];
  fmeas: FmeaData[];
}

interface SearchableRecord {
  type: QualityRelationshipEntityType;
  id: string;
  title: string;
  description: string;
  status?: string;
  raw: unknown;
}

interface QualityRelationshipManagerProps {
  currentType: QualityRelationshipEntityType;
  currentId: string;
  currentLabel?: string;
  records?: Partial<RelationshipRecordCollections>;
  canManage?: boolean;
  disabledReason?: string;
  onChanged?: () => void | Promise<void>;
}

function readLocalList<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeById<T extends { id?: string }>(localRows: T[], externalRows: T[] = []): T[] {
  const map = new Map<string, T>();
  [...localRows, ...externalRows].forEach((row) => {
    if (row.id) map.set(String(row.id), row);
  });
  return [...map.values()];
}

function entityLabel(type: QualityRelationshipEntityType): string {
  if (type === 'defect') return 'Defect';
  if (type === 'ncr') return 'NCR';
  if (type === 'capa') return 'CAPA';
  if (type === 'eightD') return '8D';
  if (type === 'improvement-action') return 'Improvement Action';
  if (type === 'inspection') return 'Inspection';
  if (type === 'supplier') return 'Supplier';
  if (type === 'complaint') return 'Customer Complaint';
  if (type === 'control-plan') return 'Control Plan';
  if (type === 'change-control') return 'Change Control';
  if (type === 'deviation') return 'Deviation';
  if (type === 'audit') return 'Audit';
  if (type === 'calibration') return 'Calibration';
  if (type === 'fmea') return 'FMEA';
  return 'Record';
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function asSearchable(collections: RelationshipRecordCollections): SearchableRecord[] {
  const defects = collections.defects.map((record) => ({
    type: 'defect' as const,
    id: String(record.id),
    title: record.defectType || record.description || 'Defect record',
    description: [record.productionLine, record.model, record.partNumber || record.partId, record.customerName, record.supplierNameAtTime || record.supplierName, record.status, record.severity, record.date].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  const ncrs = collections.ncrs.map((record) => ({
    type: 'ncr' as const,
    id: String(record.id),
    title: record.title || record.ncrNumber || 'NCR',
    description: [record.description, record.status, record.priority, record.source, record.detectedDate].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  const capas = collections.capas.map((record) => ({
    type: 'capa' as const,
    id: String(record.id),
    title: record.title || record.capaNumber || 'CAPA',
    description: [record.description, record.status, record.priority, record.sourceNcrId, record.targetCloseDate].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  const eightDs = collections.eightDs.map((record) => ({
    type: 'eightD' as const,
    id: String(record.id),
    title: record.subject || record.eightDNumber || '8D',
    description: [record.description, record.status, record.ncrReportId].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  const actions = collections.actions.map((record) => ({
    type: 'improvement-action' as const,
    id: record.id,
    title: record.title,
    description: [record.description, record.status, record.owner, record.sourceType, record.linkedDefectType, record.linkedProductionLine].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  const inspections = collections.inspections.map((record) => ({
    type: 'inspection' as const,
    id: String(record.id),
    title: `Inspection: ${record.productName || record.inspectionNumber || 'Unnamed'}`,
    description: [record.type, record.batchNumber, record.result, record.inspectedBy, record.inspectionDate].filter(Boolean).join(' | '),
    status: record.result,
    raw: record,
  }));
  const suppliers = collections.suppliers.map((record) => ({
    type: 'supplier' as const,
    id: String(record.id),
    title: `Supplier: ${record.name || record.supplierCode || 'Unnamed'}`,
    description: [record.category, record.status, record.primaryContact, record.email].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  const complaints = collections.complaints.map((record) => ({
    type: 'complaint' as const,
    id: String(record.id),
    title: `Complaint: ${record.subject || record.complaintId || 'Unnamed'}`,
    description: [record.customerName, record.priority, record.status, record.receivedDate].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  const controlPlans = collections.controlPlans.map((record) => ({
    type: 'control-plan' as const,
    id: String(record.id),
    title: `Control Plan: ${record.title || record.controlPlanId || 'Unnamed'}`,
    description: [record.productName, record.status].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  const changeControls = collections.changeControls.map((record) => ({
    type: 'change-control' as const,
    id: String(record.id),
    title: `Change Control: ${record.title || record.changeNumber || 'Unnamed'}`,
    description: [record.type, record.priority, record.status, record.requestDate].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  const deviations = collections.deviations.map((record) => ({
    type: 'deviation' as const,
    id: String(record.id),
    title: `Deviation: ${record.title || record.deviationNumber || 'Unnamed'}`,
    description: [record.type, record.category, record.status, record.productName, record.batchNumber].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  const audits = collections.audits.map((record) => ({
    type: 'audit' as const,
    id: String(record.id),
    title: `Audit: ${record.title || record.auditNumber || 'Unnamed'}`,
    description: [record.type, record.status, record.auditor, record.auditee, record.scheduledDate].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  const calibrations = collections.calibrations.map((record) => ({
    type: 'calibration' as const,
    id: String(record.id),
    title: `Calibration: ${record.description || record.itemCode || 'Unnamed'}`,
    description: [record.equipmentType, record.serialNumber, record.status, record.location, record.nextCalibrationDate].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  const fmeas = collections.fmeas.map((record) => ({
    type: 'fmea' as const,
    id: String(record.id),
    title: `FMEA: ${record.title || record.fmeaNumber || 'Unnamed'}`,
    description: [record.type, record.status].filter(Boolean).join(' | '),
    status: record.status,
    raw: record,
  }));
  return [
    ...defects, ...ncrs, ...capas, ...eightDs, ...actions,
    ...inspections, ...suppliers, ...complaints, ...controlPlans,
    ...changeControls, ...deviations, ...audits, ...calibrations, ...fmeas
  ].filter((record) => record.id);
}

function resolveLinkedRecord(relationship: QualityRelationshipRecord, currentType: QualityRelationshipEntityType, currentId: string, allRecords: SearchableRecord[]): SearchableRecord {
  const isSource = relationship.sourceType === currentType && normalize(relationship.sourceId) === normalize(currentId);
  const type = isSource ? relationship.targetType : relationship.sourceType;
  const id = isSource ? relationship.targetId : relationship.sourceId;
  return allRecords.find((record) => record.type === type && normalize(record.id) === normalize(id)) || {
    type,
    id,
    title: `${entityLabel(type)} ${id}`,
    description: 'Related record is not loaded locally yet.',
    status: 'linked',
    raw: {},
  };
}

export function QualityRelationshipManager({
  currentType,
  currentId,
  currentLabel,
  records,
  canManage = true,
  disabledReason = 'Your current role cannot change relationships.',
  onChanged,
}: QualityRelationshipManagerProps) {
  const [query, setQuery] = useState('');
  const [targetType, setTargetType] = useState<QualityRelationshipEntityType>('defect');
  const [notes, setNotes] = useState('');
  const [relationshipVersion, setRelationshipVersion] = useState(0);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const availableTargetTypes = useMemo(
    () => (['defect', 'ncr', 'capa', 'eightD', 'improvement-action', 'inspection', 'supplier', 'complaint', 'control-plan', 'change-control', 'deviation', 'audit', 'calibration', 'fmea'] as QualityRelationshipEntityType[]).filter((type) => type !== currentType),
    [currentType],
  );

  useEffect(() => {
    if (targetType === currentType || !availableTargetTypes.includes(targetType)) {
      setTargetType(availableTargetTypes[0] || 'defect');
    }
  }, [availableTargetTypes, currentType, targetType]);

  const collections = useMemo<RelationshipRecordCollections>(() => ({
    defects: mergeById(loadSafeLocalDefectRecords(), records?.defects || []),
    ncrs: mergeById(readLocalList<NcrData>('qms_local_ncr'), records?.ncrs || []),
    capas: mergeById(readLocalList<CapaData>('qms_local_capa'), records?.capas || []),
    eightDs: mergeById(readLocalList<EightDData>('qms_local_eight-d'), records?.eightDs || []),
    actions: mergeById(loadImprovementActions(), records?.actions || []),
    inspections: mergeById(readLocalList<InspectionData>('qms_local_inspections'), records?.inspections || []),
    suppliers: mergeById(readLocalList<SupplierData>('qms_local_suppliers'), records?.suppliers || []),
    complaints: mergeById(readLocalList<ComplaintData>('qms_local_complaints'), records?.complaints || []),
    controlPlans: mergeById(readLocalList<ControlPlanData>('qms_local_control-plans'), records?.controlPlans || []),
    changeControls: mergeById(readLocalList<ChangeControlData>('qms_local_change-control'), records?.changeControls || []),
    deviations: mergeById(readLocalList<DeviationData>('qms_local_deviations'), records?.deviations || []),
    audits: mergeById(readLocalList<AuditData>('qms_local_audits'), records?.audits || []),
    calibrations: mergeById(readLocalList<CalibrationData>('qms_local_calibrations'), records?.calibrations || []),
    fmeas: mergeById(readLocalList<FmeaData>('qms_local_fmea'), records?.fmeas || []),
  }), [records, relationshipVersion]);

  const allRecords = useMemo(() => asSearchable(collections), [collections]);
  const relationships = useMemo(() => relationshipsForEntity(currentType, currentId), [currentType, currentId, relationshipVersion]);
  const linkedRecords = useMemo(() => relationships.map((relationship) => ({
    relationship,
    record: resolveLinkedRecord(relationship, currentType, currentId, allRecords),
  })), [relationships, currentType, currentId, allRecords]);

  const options = useMemo(() => {
    const activeQuery = normalize(query);
    return allRecords
      .filter((record) => record.type === targetType)
      .filter((record) => !(record.type === currentType && normalize(record.id) === normalize(currentId)))
      .filter((record) => {
        if (!activeQuery) return true;
        return normalize(`${record.id} ${record.title} ${record.description} ${record.status}`).includes(activeQuery);
      })
      .slice(0, 20);
  }, [allRecords, targetType, query, currentType, currentId]);

  const refresh = async () => {
    setRelationshipVersion((value) => value + 1);
    await onChanged?.();
  };

  const handleLink = async (record: SearchableRecord) => {
    if (!canManage) {
      blockedRelationshipAudit({ sourceType: currentType, sourceId: currentId, targetType: record.type, targetId: record.id, reason: disabledReason });
      toast.error('Relationship action blocked', { description: disabledReason });
      return;
    }
    const result = createQualityRelationship({
      sourceType: currentType,
      sourceId: currentId,
      targetType: record.type,
      targetId: record.id,
      relationshipType: 'traceability',
      notes,
    });
    if (result.duplicate) {
      toast.info('Already linked', { description: 'This relationship already exists for traceability.' });
      return;
    }
    setNotes('');
    await refresh();
    toast.success('Relationship added', { description: 'Relationship added for traceability and effectiveness recalculation.' });
  };

  const handleUnlink = async (relationship: QualityRelationshipRecord) => {
    if (!canManage) {
      blockedRelationshipAudit({ sourceType: relationship.sourceType, sourceId: relationship.sourceId, targetType: relationship.targetType, targetId: relationship.targetId, reason: disabledReason });
      toast.error('Relationship action blocked', { description: disabledReason });
      return;
    }
    const confirmed = window.confirm('Unlink these records? The original records will not be deleted.');
    if (!confirmed) return;
    removeQualityRelationship(relationship.id);
    await refresh();
    toast.success('Relationship removed', { description: 'The linked records were unlinked without deleting original records.' });
  };

  const handleSaveNote = async (relationship: QualityRelationshipRecord) => {
    if (!canManage) {
      toast.error('Relationship action blocked', { description: disabledReason });
      return;
    }
    updateQualityRelationshipNote(relationship.id, noteDrafts[relationship.id] ?? relationship.notes ?? '');
    await refresh();
    toast.success('Relationship note updated');
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#00A3E0]" />
            <h3 className="text-lg font-black text-white">Linked Records & Relationship Manager</h3>
          </div>
          <p className="text-xs text-white/45 mt-1">
            {currentLabel || `${entityLabel(currentType)} ${currentId}`} relationships are traceability signals and require verification.
          </p>
        </div>
        {!canManage && <span className="px-3 py-1 rounded-full border border-amber-400/20 bg-amber-400/10 text-amber-200 text-xs font-black">{disabledReason}</span>}
      </div>

      <div className="mt-5">
        <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Relationship Map</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-2 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/25 text-[#8be3ff] text-xs font-black">
            {entityLabel(currentType)}: {currentId}
          </span>
          {linkedRecords.length === 0 ? (
            <span className="text-xs text-white/35">No related records yet.</span>
          ) : linkedRecords.slice(0, 12).map(({ relationship, record }) => (
            <span key={relationship.id} className="flex items-center gap-2 text-xs text-white/60">
              <span className="text-white/25">-&gt;</span>
              <span className="px-3 py-2 rounded-xl bg-black/10 border border-white/10">
                {entityLabel(record.type)}: {record.title}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Current Relationships</p>
          {linkedRecords.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/10 p-5 text-sm text-white/35">
              No linked records yet. Search existing local records to add traceability.
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
              {linkedRecords.map(({ relationship, record }) => (
                <div key={relationship.id} className="rounded-xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">{entityLabel(record.type)}: {record.title}</p>
                      <p className="text-xs text-white/45 mt-1">{record.id} | {record.description || 'No extra context'}</p>
                      <p className="text-[10px] text-white/30 mt-2">Source {relationship.relationshipType} | {new Date(relationship.createdAt).toLocaleString()} | {relationship.createdByRole}</p>
                    </div>
                    <button type="button" onClick={() => handleUnlink(relationship)} className="p-2 rounded-lg hover:bg-red-400/10 text-red-200" title="Unlink relationship">
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input
                      value={noteDrafts[relationship.id] ?? relationship.notes ?? ''}
                      onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [relationship.id]: event.target.value }))}
                      placeholder="Relationship notes"
                      className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white"
                    />
                    <button type="button" onClick={() => handleSaveNote(relationship)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60">
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Search Existing Local Records</p>
          <div className="grid grid-cols-1 md:grid-cols-[160px_minmax(0,1fr)] gap-2">
            <select
              value={targetType}
              onChange={(event) => setTargetType(event.target.value as QualityRelationshipEntityType)}
              className="rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white"
            >
              {availableTargetTypes.map((type) => (
                <option key={type} value={type}>{entityLabel(type)}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by id, title, status, model, part, line, customer, supplier..."
                className="w-full rounded-xl bg-black/20 border border-white/10 pl-10 pr-3 py-3 text-sm text-white"
              />
            </div>
          </div>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional relationship note"
            className="mt-2 w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white"
          />
          <div className="mt-3 space-y-3 max-h-[520px] overflow-auto pr-1">
            {options.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/10 p-5 text-sm text-white/35">
                No local records match this search.
              </div>
            ) : options.map((record) => {
              const linked = relationshipExists(currentType, currentId, record.type, record.id);
              return (
                <div key={`${record.type}-${record.id}`} className="rounded-xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">{record.title}</p>
                      <p className="text-xs text-white/45 mt-1">{entityLabel(record.type)} | {record.id}</p>
                      <p className="text-xs text-white/35 mt-1 line-clamp-2">{record.description || 'No searchable context'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLink(record)}
                      disabled={linked}
                      className="px-3 py-2 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/25 text-[#8be3ff] text-xs font-black disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {linked ? 'Already linked' : 'Link'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QualityRelationshipManager;
