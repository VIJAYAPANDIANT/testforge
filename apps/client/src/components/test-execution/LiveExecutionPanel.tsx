import React from 'react';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { LiveRunState, TestStep } from '../../types';

interface LiveExecutionPanelProps {
  runState: LiveRunState;
  testCaseSteps: TestStep[];
  isReconnecting?: boolean;
  onClose?: () => void;
}

export const LiveExecutionPanel: React.FC<LiveExecutionPanelProps> = ({
  runState,
  testCaseSteps,
  isReconnecting = false,
  onClose,
}) => {
  const { status, durationMs, error, screenshotPath, steps } = runState;

  // Calculate passed and failed count
  const passedCount = steps.filter((s) => s.status === 'passed').length;
  const failedCount = steps.filter((s) => s.status === 'failed').length;
  const totalSteps = testCaseSteps.length;

  const getStatusBadge = () => {
    switch (status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            Queued
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Running
          </span>
        );
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            Passed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Idle
          </span>
        );
    }
  };

  const getStepSummaryText = (step: TestStep) => {
    switch (step.type) {
      case 'navigate':
        return `Navigate to ${step.url}`;
      case 'click':
        return `Click ${step.locator?.strategy} "${step.locator?.value || step.locator?.role || ''}"`;
      case 'fill':
        return `Fill ${step.locator?.strategy} "${step.locator?.value || ''}" with "${step.value}"`;
      case 'assertVisible':
        return `Assert ${step.locator?.strategy} "${step.locator?.value || step.locator?.role || ''}" is visible`;
      case 'assertText':
        return `Assert text "${step.expectedText}" on ${step.locator?.strategy} "${step.locator?.value || ''}"`;
      case 'wait':
        return `Wait ${step.duration}ms`;
      case 'screenshot':
        return `Take screenshot ${step.name ? `"${step.name}"` : ''}`;
      default:
        return 'Execute step';
    }
  };

  // Helper function to resolve backend URL for static screenshot asset
  const getScreenshotUrl = (pathStr: string) => {
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${baseUrl}${pathStr}`;
  };

  return (
    <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Play className="w-5 h-5 fill-blue-400/20" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Live Test Execution</span>
              {status === 'running' && (
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping inline-block" />
              )}
            </h3>
            <p className="text-xs text-slate-400">Real-time Playwright execution progress via Socket.IO</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge()}
          {durationMs !== undefined && (
            <span className="text-xs font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
              {(durationMs / 1000).toFixed(2)}s
            </span>
          )}
          {onClose && status !== 'running' && status !== 'queued' && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium px-2.5 py-1 rounded-lg hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Reconnecting Alert */}
      {isReconnecting && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-5 py-2.5 flex items-center gap-2 text-xs font-medium text-amber-400">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          Reconnecting to test execution stream...
        </div>
      )}

      {/* Execution Progress Summary Bar */}
      <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Total Steps: <strong className="text-slate-200">{totalSteps}</strong>
          </span>
          <span className="text-emerald-400">
            Passed: <strong className="text-emerald-400">{passedCount}</strong>
          </span>
          {failedCount > 0 && (
            <span className="text-red-400">
              Failed: <strong className="text-red-400">{failedCount}</strong>
            </span>
          )}
        </div>
        <div className="font-mono text-slate-300">
          Progress:{' '}
          <strong className="text-blue-400">
            {passedCount + failedCount} / {totalSteps}
          </strong>
        </div>
      </div>

      {/* Steps List */}
      <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
        {testCaseSteps.map((step, idx) => {
          const stepExecState = steps.find((s) => s.stepIndex === idx);
          const stepStatus = stepExecState?.status || 'pending';

          return (
            <div
              key={step.id || idx}
              className={`p-4 flex flex-col gap-2 transition-colors ${
                stepStatus === 'running'
                  ? 'bg-blue-950/25 border-l-4 border-blue-500'
                  : stepStatus === 'passed'
                  ? 'bg-emerald-950/10'
                  : stepStatus === 'failed'
                  ? 'bg-red-950/20 border-l-4 border-red-500'
                  : 'bg-[#111827]/80 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Step Status Indicator Icon & Text Label */}
                  {stepStatus === 'pending' && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
                      <span className="text-sm leading-none text-slate-500">○</span> Pending
                    </span>
                  )}
                  {stepStatus === 'running' && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/30 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-400" /> Running
                    </span>
                  )}
                  {stepStatus === 'passed' && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Passed
                    </span>
                  )}
                  {stepStatus === 'failed' && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/30">
                      <XCircle className="w-3.5 h-3.5 text-red-400" /> Failed
                    </span>
                  )}

                  <span className="text-xs font-mono text-slate-500">Step {idx + 1}</span>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase border border-slate-700/50">
                    {step.type}
                  </span>
                  <span className="text-xs font-medium text-slate-200">{getStepSummaryText(step)}</span>
                </div>
              </div>

              {/* Step Failure Error Message */}
              {stepStatus === 'failed' && stepExecState?.error && (
                <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400 whitespace-pre-wrap">
                  <div className="font-semibold text-red-300 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" /> Step Error Details
                  </div>
                  {stepExecState.error}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Run Error Banner */}
      {status === 'failed' && error && (
        <div className="p-4 bg-red-500/10 border-t border-red-500/30">
          <div className="flex items-start gap-2.5 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-mono whitespace-pre-wrap">{error}</div>
          </div>
        </div>
      )}

      {/* Screenshot Preview (if failure screenshot was generated) */}
      {screenshotPath && (
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <ImageIcon className="w-4 h-4 text-slate-400" />
            Failure Screenshot captured
          </div>
          <a
            href={getScreenshotUrl(screenshotPath)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            View Screenshot <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
