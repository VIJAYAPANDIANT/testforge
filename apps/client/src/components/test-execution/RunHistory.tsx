import React from 'react';
import {
  History,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Webhook,
} from 'lucide-react';
import { RunItem } from '../../types';

interface RunHistoryProps {
  runs: RunItem[];
  loading: boolean;
  error: string | null;
  onSelectRun: (runId: string) => void;
  onRefresh?: () => void;
}

export const RunHistory: React.FC<RunHistoryProps> = ({
  runs,
  loading,
  error,
  onSelectRun,
  onRefresh,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 animate-spin" />
            ○ Queued
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" />
            ▶ Running
          </span>
        );
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />
            ✓ Passed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3" />
            ✕ Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const getTriggerBadge = (triggerSource?: string) => {
    if (triggerSource === 'github') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 shrink-0"
          title="GitHub Push Webhook Trigger"
        >
          <Webhook className="w-3 h-3 text-purple-400" /> GitHub
        </span>
      );
    }
    if (triggerSource === 'webhook') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0"
          title="Generic Webhook Trigger"
        >
          <Webhook className="w-3 h-3" /> Webhook
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 shrink-0"
        title="Manual Run"
      >
        Manual
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Run History</h3>
            <p className="text-[11px] text-slate-400">Previous test execution runs and results</p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Refresh Run History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-10 text-xs text-slate-400 space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span>Loading run history...</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && runs.length === 0 && (
        <div className="py-10 text-center space-y-2 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-300">No test runs yet</p>
          <p className="text-[11px] text-slate-500">
            Run this test case to record execution history and inspect step results.
          </p>
        </div>
      )}

      {/* History List */}
      {!loading && !error && runs.length > 0 && (
        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          {runs.map((run) => (
            <div
              key={run.id}
              onClick={() => onSelectRun(run.id)}
              className="p-3.5 flex items-center justify-between hover:bg-slate-800/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3.5">
                {getStatusBadge(run.status)}

                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                    {formatDate(run.createdAt)}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    ID: {run.id.substring(0, 10)}...
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-400">
                {getTriggerBadge(run.triggerSource)}

                {run.screenshotPath && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                    title="Failure Screenshot available"
                  >
                    <ImageIcon className="w-3 h-3" /> Screenshot
                  </span>
                )}

                <span className="font-mono text-slate-300">
                  {run.durationMs ? `${(run.durationMs / 1000).toFixed(2)}s` : '—'}
                </span>

                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
