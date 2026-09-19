import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  Terminal,
  FileCode,
} from 'lucide-react';
import { runService } from '../../services/runService';
import { RunDetailData, TestStep, RunStepResult } from '../../types';

interface RunDetailModalProps {
  runId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RunDetailModal: React.FC<RunDetailModalProps> = ({
  runId,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<RunDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (!isOpen || !runId) {
      setData(null);
      setError(null);
      return;
    }

    const fetchRunDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await runService.getRunById(runId);
        setData(detail);
      } catch (err: any) {
        setError(err.message || 'Unable to load execution run details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRunDetail();
  }, [isOpen, runId]);

  if (!isOpen) return null;

  const run = data?.run;
  const result = data?.result;

  const testCaseObj = typeof run?.testCase === 'object' ? run.testCase : null;
  const projectObj = typeof run?.project === 'object' ? run.project : null;
  const testCaseName = testCaseObj?.name || 'Test Case';
  const projectName = projectObj?.name || 'Project';
  const dslSteps: TestStep[] = testCaseObj?.dsl?.steps || [];

  const screenshotPath = run?.screenshotPath || result?.screenshotPath;

  const getScreenshotUrl = (pathStr: string) => {
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${baseUrl}${pathStr}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            ✓ Passed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            ✕ Failed
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ▶ Running
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Run Details
                {run?.status && getStatusBadge(run.status)}
              </h2>
              <p className="text-xs text-slate-400">
                {projectName} / <span className="text-slate-200">{testCaseName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-200">
          {/* Loading State */}
          {loading && (
            <div className="py-20 flex items-center justify-center text-slate-400 space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span>Loading run execution details...</span>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && run && (
            <>
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] mb-0.5">Duration</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {run.durationMs ? `${(run.durationMs / 1000).toFixed(2)}s` : '—'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] mb-0.5">Exit Code</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {run.exitCode !== null && run.exitCode !== undefined ? run.exitCode : '—'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] mb-0.5">Started At</span>
                  <span className="text-slate-300 text-[11px]">{formatDate(run.startedAt || run.createdAt)}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] mb-0.5">Completed At</span>
                  <span className="text-slate-300 text-[11px]">{formatDate(run.completedAt)}</span>
                </div>
              </div>

              {/* Trigger Source & Webhook Metadata */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Trigger Source:</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      run.triggerSource === 'github'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : run.triggerSource === 'webhook'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {run.triggerSource === 'github'
                      ? '🐙 GitHub Push Webhook'
                      : run.triggerSource === 'webhook'
                      ? '⚡ Generic Webhook'
                      : '👤 Manual Execution'}
                  </span>
                </div>

                {(run.triggerSource === 'webhook' || run.triggerSource === 'github') && run.triggerMetadata && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                    {run.triggerMetadata.branch && (
                      <div>
                        <span className="text-slate-500 block">Branch</span>
                        <span className="font-mono text-indigo-300 font-semibold">{run.triggerMetadata.branch}</span>
                      </div>
                    )}
                    {run.triggerMetadata.commit && (
                      <div>
                        <span className="text-slate-500 block">Commit</span>
                        <span className="font-mono text-slate-300">{run.triggerMetadata.commit}</span>
                      </div>
                    )}
                    {run.triggerMetadata.repository && (
                      <div>
                        <span className="text-slate-500 block">Repository</span>
                        <span className="font-mono text-slate-300 truncate block">{run.triggerMetadata.repository}</span>
                      </div>
                    )}
                    {run.triggerMetadata.event && (
                      <div>
                        <span className="text-slate-500 block">Event</span>
                        <span className="font-mono text-slate-300">{run.triggerMetadata.event}</span>
                      </div>
                    )}
                    {run.triggerMetadata.deliveryId && (
                      <div>
                        <span className="text-slate-500 block">Delivery ID</span>
                        <span className="font-mono text-slate-400 text-[10px] truncate block">{run.triggerMetadata.deliveryId}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step Results Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span>Step Results</span>
                  {dslSteps.length > 0 && (
                    <span className="text-xs text-slate-500 font-normal">
                      ({dslSteps.length} step{dslSteps.length === 1 ? '' : 's'})
                    </span>
                  )}
                </h3>

                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
                  {(result?.stepResults && result.stepResults.length > 0
                    ? result.stepResults
                    : dslSteps.map((s, idx): RunStepResult => ({
                        stepIndex: idx,
                        stepType: s.type,
                        status: run.status === 'passed' ? 'passed' : 'failed',
                        error: undefined,
                        durationMs: undefined,
                      }))
                  ).map((stepRes, idx) => {
                    const stepDef = dslSteps[stepRes.stepIndex || idx];
                    const isPassed = stepRes.status === 'passed';

                    return (
                      <div key={idx} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span
                              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                                isPassed
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}
                            >
                              {isPassed ? (
                                <>
                                  <CheckCircle className="w-3 h-3" /> ✓ Passed
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" /> ✕ Failed
                                </>
                              )}
                            </span>

                            <span className="text-xs font-mono text-slate-500">
                              Step {stepRes.stepIndex + 1}
                            </span>

                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                              {stepRes.stepType}
                            </span>
                          </div>

                          {stepRes.durationMs !== undefined && (
                            <span className="text-xs font-mono text-slate-400">
                              {stepRes.durationMs}ms
                            </span>
                          )}
                        </div>

                        {/* Step Failure Error Message */}
                        {stepRes.status === 'failed' && (stepRes.error || run.stderr) && (
                          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-mono text-red-400 whitespace-pre-wrap">
                            <div className="font-semibold text-red-300 mb-1 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Error Details
                            </div>
                            {stepRes.error || run.stderr}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Failure Screenshot Section */}
              {screenshotPath && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      Failure Screenshot
                    </h3>

                    <a
                      href={getScreenshotUrl(screenshotPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      Open Full Size <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex justify-center">
                    <img
                      src={getScreenshotUrl(screenshotPath)}
                      alt="Execution Failure Screenshot"
                      className="max-h-80 w-auto object-contain rounded-lg border border-slate-700/80 shadow-md"
                    />
                  </div>
                </div>
              )}

              {/* Console Logs Section */}
              {(run.stdout || run.stderr) && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <span>{showLogs ? 'Hide Console Logs' : 'Show Console Logs'}</span>
                  </button>

                  {showLogs && (
                    <div className="mt-3 p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {run.stdout && (
                        <div>
                          <div className="text-slate-500 font-semibold mb-1">STDOUT:</div>
                          {run.stdout}
                        </div>
                      )}
                      {run.stderr && (
                        <div className="mt-3">
                          <div className="text-red-400 font-semibold mb-1">STDERR:</div>
                          <span className="text-red-300">{run.stderr}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
