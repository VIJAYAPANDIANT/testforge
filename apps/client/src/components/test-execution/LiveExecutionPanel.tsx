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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            Queued
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Running
          </span>
        );
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" />
            Passed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Live Test Execution</h3>
            <p className="text-xs text-gray-500">Real-time Playwright execution progress via Socket.IO</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge()}
          {durationMs !== undefined && (
            <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
              {(durationMs / 1000).toFixed(2)}s
            </span>
          )}
          {onClose && status !== 'running' && status !== 'queued' && (
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Reconnecting Alert */}
      {isReconnecting && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center gap-2 text-xs font-medium text-amber-800">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
          Reconnecting to test execution stream...
        </div>
      )}

      {/* Execution Progress Summary Bar */}
      <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>
            Total Steps: <strong>{totalSteps}</strong>
          </span>
          <span className="text-emerald-700">
            Passed: <strong>{passedCount}</strong>
          </span>
          {failedCount > 0 && (
            <span className="text-rose-700">
              Failed: <strong>{failedCount}</strong>
            </span>
          )}
        </div>
        <div>
          Progress:{' '}
          <strong>
            {passedCount + failedCount} / {totalSteps}
          </strong>
        </div>
      </div>

      {/* Steps List */}
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {testCaseSteps.map((step, idx) => {
          const stepExecState = steps.find((s) => s.stepIndex === idx);
          const stepStatus = stepExecState?.status || 'pending';

          return (
            <div
              key={step.id || idx}
              className={`p-4 flex flex-col gap-2 transition-colors ${
                stepStatus === 'running'
                  ? 'bg-blue-50/40 border-l-4 border-blue-500'
                  : stepStatus === 'passed'
                  ? 'bg-emerald-50/20'
                  : stepStatus === 'failed'
                  ? 'bg-rose-50/30 border-l-4 border-rose-500'
                  : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Step Status Indicator Icon & Text Label */}
                  {stepStatus === 'pending' && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                      <span className="text-sm leading-none">○</span> Pending
                    </span>
                  )}
                  {stepStatus === 'running' && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-300">
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-600" /> ▶ Running
                    </span>
                  )}
                  {stepStatus === 'passed' && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> ✓ Passed
                    </span>
                  )}
                  {stepStatus === 'failed' && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-300">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" /> ✕ Failed
                    </span>
                  )}

                  <span className="text-xs font-mono text-gray-400">Step {idx + 1}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase">
                    {step.type}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{getStepSummaryText(step)}</span>
                </div>
              </div>

              {/* Step Failure Error Message */}
              {stepStatus === 'failed' && stepExecState?.error && (
                <div className="mt-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-mono text-rose-800 whitespace-pre-wrap">
                  <div className="font-semibold text-rose-900 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Step Error Details
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
        <div className="p-4 bg-rose-50 border-t border-rose-200">
          <div className="flex items-start gap-2.5 text-xs text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-mono whitespace-pre-wrap">{error}</div>
          </div>
        </div>
      )}

      {/* Screenshot Preview (if failure screenshot was generated) */}
      {screenshotPath && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <ImageIcon className="w-4 h-4 text-gray-500" />
            Failure Screenshot captured
          </div>
          <a
            href={getScreenshotUrl(screenshotPath)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View Screenshot <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
