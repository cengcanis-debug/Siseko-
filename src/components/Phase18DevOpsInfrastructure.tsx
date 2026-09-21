import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Cpu, 
  HardDrive, 
  Database, 
  DollarSign, 
  RefreshCw, 
  Zap, 
  TrendingUp,
  Sliders,
  Bell,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface Phase18Props {
  formatZAR: (val: number) => string;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
}

export const Phase18DevOpsInfrastructure: React.FC<Phase18Props> = ({
  formatZAR,
  addAuditLog,
  showBanner
}) => {
  const [connections, setConnections] = useState<number>(18);
  const [storageGb, setStorageGb] = useState<number>(45.5);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoSimulateLoad, setAutoSimulateLoad] = useState<boolean>(false);

  // Fetch metrics from backend
  const fetchMetrics = async (conn: number, store: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/metrics?db_connections_override=${conn}&storage_gb_override=${store}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        if (data.warning_flag_active) {
          addAuditLog(
            'RUNWAY_METRIC_BREACH',
            `Operational processing costs exceeded 80% of MRR (${data.runway_efficiency_ratio}%). Critical Sev-1 sysadmin alert generated.`,
            'crit'
          );
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch runway metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(connections, storageGb);
  }, [connections, storageGb]);

  // Live spike simulation
  const handleTriggerSpike = () => {
    setConnections(72);
    setStorageGb(120);
    showBanner('⚠️ High-traffic load spike simulated (72 DB pool connections, 120GB)!');
  };

  const handleResetOptimal = () => {
    setConnections(14);
    setStorageGb(45.5);
    showBanner('✅ Reset infrastructure pool to optimal levels (14 connections).');
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="phase18-container">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded uppercase">
              Phase 18 Enhancement
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Cloud SQL • Cloud Run • SITA GovTech Spec
            </span>
          </div>
          <h3 className="text-lg font-black text-white mt-1 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            DevOps Infrastructure & Runway Cockpit
          </h3>
          <p className="text-xs text-white/60">
            Real-time server operational cost modelling vs Gross Monthly Recurring Revenue (MRR) with automated Sev-1 alerting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMetrics(connections, storageGb)}
            disabled={loading}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* CRITICAL COST ALERT BANNER */}
      {metrics?.warning_flag_active && (
        <div className="p-4 bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-slate-900/90 border border-rose-500/50 rounded-2xl shadow-xl shadow-rose-950/40 animate-pulse space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                CRITICAL SEV-1: INFRASTRUCTURE COST RUNWAY BREACH
              </h4>
            </div>
            <span className="text-xs font-mono font-bold bg-rose-500/30 text-rose-200 px-2.5 py-0.5 rounded border border-rose-500/40">
              RATIO: {metrics.runway_efficiency_ratio}%
            </span>
          </div>
          <p className="text-xs text-rose-200 leading-relaxed">
            Operational server costs ({formatZAR(metrics.estimated_server_processing_cost_zar)}) have approached within 20% of Gross MRR ({formatZAR(metrics.monthly_recurring_revenue_zar)}). 
            System administrator SMS alerts have been dispatched.
          </p>
          <div className="pt-2 text-[11px] font-mono text-rose-300 bg-black/40 p-2.5 rounded-xl border border-rose-500/30">
            <strong>Admin Action Recommended:</strong> {metrics.alert_payload?.admin_action_recommended}
          </div>
        </div>
      )}

      {/* REVENUE & COST METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* GROSS MRR */}
        <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase text-white/50">Gross Monthly MRR</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {metrics ? formatZAR(metrics.monthly_recurring_revenue_zar) : '...'}
          </div>
          <p className="text-[10px] text-white/40">
            {metrics?.subscriber_counts?.lite || 0} Lite • {metrics?.subscriber_counts?.pro || 0} Pro • {metrics?.subscriber_counts?.wealth || 0} Wealth
          </p>
        </div>

        {/* SERVER PROCESSING COST */}
        <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase text-white/50">Cloud Processing Cost</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400 font-mono">
            {metrics ? formatZAR(metrics.estimated_server_processing_cost_zar) : '...'}
          </div>
          <p className="text-[10px] text-white/40">Base R450 + Connections + Storage + CPU</p>
        </div>

        {/* EFFICIENCY RATIO */}
        <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase text-white/50">Runway Efficiency</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className={`text-xl font-black font-mono ${
            (metrics?.runway_efficiency_ratio || 0) >= 80 ? 'text-rose-400' : 'text-cyan-400'
          }`}>
            {metrics ? `${metrics.runway_efficiency_ratio}%` : '...'}
          </div>
          <p className="text-[10px] text-white/40">Target &lt; 50% • Warning threshold 80%</p>
        </div>

        {/* DB RESOURCE POOL */}
        <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase text-white/50">Active DB Connections</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            {connections} / 100
          </div>
          <p className="text-[10px] text-white/40">PostgreSQL Cloud SQL pool</p>
        </div>
      </div>

      {/* SIMULATION SLIDERS */}
      <div className="p-5 bg-gradient-to-br from-slate-900/70 to-slate-950 border border-white/10 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Interactive Capacity & Cost Stress Simulator
          </h4>
          <div className="flex gap-2">
            <button
              onClick={handleTriggerSpike}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Simulate Load Spike (Sev-1)
            </button>
            <button
              onClick={handleResetOptimal}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Reset Optimal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* CONNECTIONS SLIDER */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60 font-medium">PostgreSQL Pool Connections:</span>
              <span className="font-mono font-bold text-white">{connections} channels</span>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              value={connections}
              onChange={(e) => setConnections(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono">
              <span>5 (Idle)</span>
              <span>45 (High)</span>
              <span>95 (Critical)</span>
            </div>
          </div>

          {/* STORAGE SLIDER */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60 font-medium">Database Disk Volume (GB):</span>
              <span className="font-mono font-bold text-white">{storageGb} GB</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={storageGb}
              onChange={(e) => setStorageGb(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono">
              <span>10 GB</span>
              <span>100 GB</span>
              <span>200 GB</span>
            </div>
          </div>
        </div>
      </div>

      {/* RAW RESOURCE UTILIZATION METRICS */}
      {metrics?.resource_metrics && (
        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            Live Container Metrics Snapshot
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[9.5px]">CPU USAGE</span>
              <span className="text-emerald-400 font-bold">{metrics.resource_metrics.cpu_usage_pct}%</span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[9.5px]">MEMORY USED</span>
              <span className="text-indigo-400 font-bold">{metrics.resource_metrics.memory_used_mb} MB</span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[9.5px]">STORAGE BYTES</span>
              <span className="text-cyan-400 font-bold">{(metrics.resource_metrics.storage_bytes / 1024 / 1024 / 1024).toFixed(1)} GB</span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[9.5px]">CONTAINER SLA</span>
              <span className="text-emerald-400 font-bold">99.98% OK</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
