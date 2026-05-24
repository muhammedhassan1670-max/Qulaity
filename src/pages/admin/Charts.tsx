import { useMemo, useState } from 'react';
import { BarChart3, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useConfigStore } from '../../stores/configStore';

export function ChartsPage() {
  const { chartSettings, setChartSettings } = useConfigStore();

  const [draft, setDraft] = useState(chartSettings);
  const [newCharacteristic, setNewCharacteristic] = useState({
    name: '',
    process: '',
    cpk: 1.33,
    status: 'capable',
    samples: 0
  });

  const dashboardSeries = useMemo(() => Object.keys(draft.dashboard.seriesEnabled), [draft.dashboard.seriesEnabled]);
  const executiveSeries = useMemo(() => Object.keys(draft.executive.seriesEnabled), [draft.executive.seriesEnabled]);

  const handleSave = () => {
    setChartSettings(draft);
    toast.success('Chart settings saved');
  };

  const handleReset = () => {
    setDraft(chartSettings);
    toast.success('Changes reverted');
  };

  const handleAddCharacteristic = () => {
    if (!newCharacteristic.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setDraft((p) => {
      const nextId = (p.spc.characteristics.reduce((acc, c) => Math.max(acc, c.id), 0) || 0) + 1;
      return {
        ...p,
        spc: {
          ...p.spc,
          characteristics: [
            ...p.spc.characteristics,
            {
              id: nextId,
              name: newCharacteristic.name.trim(),
              process: newCharacteristic.process.trim() || 'Process',
              cpk: Number(newCharacteristic.cpk) || 0,
              status: newCharacteristic.status || 'capable',
              samples: Number(newCharacteristic.samples) || 0,
              controlLimits: { ...p.spc.controlLimits },
              specLimits: { ...p.spc.specLimits }
            }
          ]
        }
      };
    });

    setNewCharacteristic({ name: '', process: '', cpk: 1.33, status: 'capable', samples: 0 });
    toast.success('Characteristic added');
  };

  const handleDeleteCharacteristic = (id: number) => {
    setDraft((p) => ({
      ...p,
      spc: {
        ...p.spc,
        characteristics: p.spc.characteristics.filter((c) => c.id !== id)
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30">
            <BarChart3 className="w-6 h-6 text-[#00A3E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Charts Settings</h1>
            <p className="text-sm text-gray-400">Control visibility, colors, and live chart behavior</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
        <h2 className="text-white font-semibold">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboardSeries.map((key) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-white text-sm font-medium">{key}</p>
                <p className="text-xs text-gray-500">Series visibility & color</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={draft.dashboard.seriesColors[key] || '#00A3E0'}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      dashboard: {
                        ...p.dashboard,
                        seriesColors: { ...p.dashboard.seriesColors, [key]: e.target.value }
                      }
                    }))
                  }
                  className="h-9 w-10 rounded bg-transparent border border-white/10"
                />
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={!!draft.dashboard.seriesEnabled[key]}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        dashboard: {
                          ...p.dashboard,
                          seriesEnabled: { ...p.dashboard.seriesEnabled, [key]: e.target.checked }
                        }
                      }))
                    }
                    className="rounded border-white/30"
                  />
                  Enabled
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
        <h2 className="text-white font-semibold">Executive Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {executiveSeries.map((key) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-white text-sm font-medium">{key}</p>
                <p className="text-xs text-gray-500">Series visibility & color</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={draft.executive.seriesColors[key] || '#00A3E0'}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      executive: {
                        ...p.executive,
                        seriesColors: { ...p.executive.seriesColors, [key]: e.target.value }
                      }
                    }))
                  }
                  className="h-9 w-10 rounded bg-transparent border border-white/10"
                />
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={!!draft.executive.seriesEnabled[key]}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        executive: {
                          ...p.executive,
                          seriesEnabled: { ...p.executive.seriesEnabled, [key]: e.target.checked }
                        }
                      }))
                    }
                    className="rounded border-white/30"
                  />
                  Enabled
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
        <h2 className="text-white font-semibold">IoT / SPC Real-Time</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-white text-sm font-medium">Refresh Interval (ms)</p>
            <input
              type="number"
              min={250}
              step={250}
              value={draft.iot.refreshInterval}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  iot: { ...p.iot, refreshInterval: Number(e.target.value) || 1000 }
                }))
              }
              className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
            <p className="text-xs text-gray-500">Controls data refresh speed</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-white text-sm font-medium">Max Data Points</p>
            <input
              type="number"
              min={20}
              step={10}
              value={draft.iot.maxDataPoints}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  iot: { ...p.iot, maxDataPoints: Number(e.target.value) || 100 }
                }))
              }
              className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
            <p className="text-xs text-gray-500">Limits in-memory series length</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <label className="flex items-center justify-between text-sm text-gray-300">
              <span>Show SPC Reference Lines</span>
              <input
                type="checkbox"
                checked={draft.iot.showSPC}
                onChange={(e) => setDraft((p) => ({ ...p, iot: { ...p.iot, showSPC: e.target.checked } }))}
                className="rounded border-white/30"
              />
            </label>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <label className="flex items-center justify-between text-sm text-gray-300">
              <span>Show Anomalies</span>
              <input
                type="checkbox"
                checked={draft.iot.showAnomalies}
                onChange={(e) => setDraft((p) => ({ ...p, iot: { ...p.iot, showAnomalies: e.target.checked } }))}
                className="rounded border-white/30"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
        <h2 className="text-white font-semibold">SPC System</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <label className="flex items-center justify-between text-sm text-gray-300">
              <span>Show Zones</span>
              <input
                type="checkbox"
                checked={draft.spc.showZones}
                onChange={(e) => setDraft((p) => ({ ...p, spc: { ...p.spc, showZones: e.target.checked } }))}
                className="rounded border-white/30"
              />
            </label>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-white text-sm font-medium">Control Limits</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">UCL</p>
                <input
                  type="number"
                  value={draft.spc.controlLimits.ucl}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      spc: {
                        ...p.spc,
                        controlLimits: { ...p.spc.controlLimits, ucl: Number(e.target.value) }
                      }
                    }))
                  }
                  className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">CL</p>
                <input
                  type="number"
                  value={draft.spc.controlLimits.cl}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      spc: {
                        ...p.spc,
                        controlLimits: { ...p.spc.controlLimits, cl: Number(e.target.value) }
                      }
                    }))
                  }
                  className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">LCL</p>
                <input
                  type="number"
                  value={draft.spc.controlLimits.lcl}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      spc: {
                        ...p.spc,
                        controlLimits: { ...p.spc.controlLimits, lcl: Number(e.target.value) }
                      }
                    }))
                  }
                  className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-white text-sm font-medium">Specification Limits</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">USL</p>
                <input
                  type="number"
                  value={draft.spc.specLimits.usl}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      spc: {
                        ...p.spc,
                        specLimits: { ...p.spc.specLimits, usl: Number(e.target.value) }
                      }
                    }))
                  }
                  className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">LSL</p>
                <input
                  type="number"
                  value={draft.spc.specLimits.lsl}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      spc: {
                        ...p.spc,
                        specLimits: { ...p.spc.specLimits, lsl: Number(e.target.value) }
                      }
                    }))
                  }
                  className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="text-white text-sm font-medium">Enabled Rules</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(draft.spc.enabledRules).map((key) => (
                <label key={key} className="flex items-center justify-between text-sm text-gray-300 rounded border border-white/10 bg-white/5 px-3 py-2">
                  <span>{key}</span>
                  <input
                    type="checkbox"
                    checked={!!draft.spc.enabledRules[key]}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        spc: {
                          ...p.spc,
                          enabledRules: { ...p.spc.enabledRules, [key]: e.target.checked }
                        }
                      }))
                    }
                    className="rounded border-white/30"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-white text-sm font-medium">Characteristics</p>
              <p className="text-xs text-gray-500">Add / edit SPC monitored characteristics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              value={newCharacteristic.name}
              onChange={(e) => setNewCharacteristic((p) => ({ ...p, name: e.target.value }))}
              placeholder="Name"
              className="md:col-span-2 h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
            <input
              value={newCharacteristic.process}
              onChange={(e) => setNewCharacteristic((p) => ({ ...p, process: e.target.value }))}
              placeholder="Process"
              className="md:col-span-2 h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
            <input
              type="number"
              value={newCharacteristic.cpk}
              onChange={(e) => setNewCharacteristic((p) => ({ ...p, cpk: Number(e.target.value) }))}
              placeholder="Cpk"
              className="h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
            <Button
              onClick={handleAddCharacteristic}
              className="h-11 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">Name</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">Process</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">Cpk</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">Samples</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">UCL</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">CL</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">LCL</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">USL</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">LSL</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {draft.spc.characteristics.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2 px-2">
                      <input
                        value={c.name}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            spc: {
                              ...p.spc,
                              characteristics: p.spc.characteristics.map((x) =>
                                x.id === c.id ? { ...x, name: e.target.value } : x
                              )
                            }
                          }))
                        }
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        value={c.process}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            spc: {
                              ...p.spc,
                              characteristics: p.spc.characteristics.map((x) =>
                                x.id === c.id ? { ...x, process: e.target.value } : x
                              )
                            }
                          }))
                        }
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={c.cpk}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            spc: {
                              ...p.spc,
                              characteristics: p.spc.characteristics.map((x) =>
                                x.id === c.id ? { ...x, cpk: Number(e.target.value) } : x
                              )
                            }
                          }))
                        }
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={c.status}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            spc: {
                              ...p.spc,
                              characteristics: p.spc.characteristics.map((x) =>
                                x.id === c.id ? { ...x, status: e.target.value } : x
                              )
                            }
                          }))
                        }
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                      >
                        <option value="capable">capable</option>
                        <option value="marginally">marginally</option>
                        <option value="incapable">incapable</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={c.samples}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            spc: {
                              ...p.spc,
                              characteristics: p.spc.characteristics.map((x) =>
                                x.id === c.id ? { ...x, samples: Number(e.target.value) } : x
                              )
                            }
                          }))
                        }
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </td>

                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={(c.controlLimits?.ucl ?? draft.spc.controlLimits.ucl) as number}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            spc: {
                              ...p.spc,
                              characteristics: p.spc.characteristics.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      controlLimits: {
                                        ucl: Number(e.target.value),
                                        cl: x.controlLimits?.cl ?? p.spc.controlLimits.cl,
                                        lcl: x.controlLimits?.lcl ?? p.spc.controlLimits.lcl
                                      }
                                    }
                                  : x
                              )
                            }
                          }))
                        }
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={(c.controlLimits?.cl ?? draft.spc.controlLimits.cl) as number}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            spc: {
                              ...p.spc,
                              characteristics: p.spc.characteristics.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      controlLimits: {
                                        ucl: x.controlLimits?.ucl ?? p.spc.controlLimits.ucl,
                                        cl: Number(e.target.value),
                                        lcl: x.controlLimits?.lcl ?? p.spc.controlLimits.lcl
                                      }
                                    }
                                  : x
                              )
                            }
                          }))
                        }
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={(c.controlLimits?.lcl ?? draft.spc.controlLimits.lcl) as number}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            spc: {
                              ...p.spc,
                              characteristics: p.spc.characteristics.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      controlLimits: {
                                        ucl: x.controlLimits?.ucl ?? p.spc.controlLimits.ucl,
                                        cl: x.controlLimits?.cl ?? p.spc.controlLimits.cl,
                                        lcl: Number(e.target.value)
                                      }
                                    }
                                  : x
                              )
                            }
                          }))
                        }
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </td>

                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={(c.specLimits?.usl ?? draft.spc.specLimits.usl) as number}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            spc: {
                              ...p.spc,
                              characteristics: p.spc.characteristics.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      specLimits: {
                                        usl: Number(e.target.value),
                                        lsl: x.specLimits?.lsl ?? p.spc.specLimits.lsl
                                      }
                                    }
                                  : x
                              )
                            }
                          }))
                        }
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={(c.specLimits?.lsl ?? draft.spc.specLimits.lsl) as number}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            spc: {
                              ...p.spc,
                              characteristics: p.spc.characteristics.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      specLimits: {
                                        usl: x.specLimits?.usl ?? p.spc.specLimits.usl,
                                        lsl: Number(e.target.value)
                                      }
                                    }
                                  : x
                              )
                            }
                          }))
                        }
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </td>

                    <td className="py-2 px-2 text-right">
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteCharacteristic(c.id)}
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {draft.spc.characteristics.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-6 text-center text-sm text-gray-500">
                      No characteristics defined
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChartsPage;
