import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Link as LinkIcon, 
  ArrowRight, 
  FileText, 
  ShieldAlert, 
  ClipboardList,
  Activity
} from 'lucide-react';
import { 
  unifiedApiRegistry, 
  type ModuleKey 
} from '../api/unified-api';

interface RelatedRecord {
  id: string;
  type: ModuleKey;
  title: string;
  status?: string;
}

interface RelatedRecordsProps {
  currentId: string;
  relations: Array<{
    targetModule: ModuleKey;
    filterField: string;
    label: string;
    icon: React.ReactNode;
  }>;
}

const getRelatedRecordPath = (item: RelatedRecord) => {
  const id = encodeURIComponent(item.id);

  const paths: Record<ModuleKey, string> = {
    ncr: `/quality/records/ncr/${id}`,
    capa: `/quality/records/capa/${id}`,
    'eight-d': `/8d/${id}`,
    fmea: `/fmea/${id}`,
    deviations: `/deviation/${id}`,
    'change-control': `/change-control/${id}`,
    complaints: `/complaints/${id}`,
    'control-plans': `/control-plan/${id}`,
    suppliers: `/supplier-quality/${id}`,
    inspections: `/inspection/${id}`,
    calibrations: `/calibration/${id}`,
    audits: `/compliance/hub/audit/${id}`,
    'defect-logs': '/defect-log',
    'production-layout': '/production-layout'
  };

  return paths[item.type] ?? '/quality';
};

export const RelatedRecords: React.FC<RelatedRecordsProps> = ({ 
  currentId, 
  relations 
}) => {
  const [relatedItems, setRelatedItems] = useState<RelatedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      const allFound: RelatedRecord[] = [];

      for (const rel of relations) {
        try {
          const api = (unifiedApiRegistry as any)[rel.targetModule];
          if (!api) continue;

          const result = await api.getAll({ [rel.filterField]: currentId });
          if (result.data && result.data.length > 0) {
            result.data.forEach((item: any) => {
              allFound.push({
                id: item.id,
                type: rel.targetModule,
                title: item.title || item.subject || item.name || item.id,
                status: item.status
              });
            });
          }
        } catch (err) {
          console.error(`Failed to fetch related ${rel.targetModule}`, err);
        }
      }

      setRelatedItems(allFound);
      setLoading(false);
    };

    if (currentId) {
      fetchRelated();
    }
  }, [currentId, relations]);

  if (loading) return <div className="animate-pulse h-20 bg-white/5 rounded-xl" />;
  if (relatedItems.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2 px-1">
        <LinkIcon className="w-4 h-4 text-[#00A3E0]" />
        <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Related Flow Records</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {relatedItems.map((item) => (
          <Link 
            key={`${item.type}-${item.id}`}
            to={getRelatedRecordPath(item)}
            className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#00A3E0]/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-gray-400 group-hover:text-[#00A3E0] transition-colors">
                {item.type === 'ncr' && <ShieldAlert className="w-4 h-4" />}
                {item.type === 'capa' && <Activity className="w-4 h-4" />}
                {item.type === 'eight-d' && <ClipboardList className="w-4 h-4" />}
                {!['ncr', 'capa', 'eight-d'].includes(item.type) && <FileText className="w-4 h-4" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#00A3E0] uppercase tracking-tighter leading-none mb-1">
                  {item.type.replace('-', ' ')}
                </span>
                <span className="text-sm font-bold text-white line-clamp-1">{item.title}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
};
