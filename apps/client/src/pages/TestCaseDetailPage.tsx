import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { testCaseService } from '../services/testCaseService';
import { runService } from '../services/runService';
import { getSocket, joinRunRoom, leaveRunRoom, SOCKET_EVENTS } from '../services/socket';
import {
  Project,
  TestCase,
  LiveRunState,
  StepExecutionState,
  SocketRunEventPayload,
  SocketStepEventPayload,
  RunItem,
} from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { TestStepEditor } from '../components/test-editor/TestStepEditor';
import { LiveExecutionPanel } from '../components/test-execution/LiveExecutionPanel';
import { RunHistory } from '../components/test-execution/RunHistory';
import { RunDetailModal } from '../components/test-execution/RunDetailModal';
import {
  FileCode,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  ArrowLeft,
  Clock,
  Play,
} from 'lucide-react';

export const TestCaseDetailPage: React.FC = () => {
  const { projectId, testCaseId } = useParams<{ projectId: string; testCaseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live Execution State (Day 19)
  const [runState, setRunState] = useState<LiveRunState | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Run History & Detail State (Day 20)
  const [runsList, setRunsList] = useState<RunItem[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(searchParams.get('runId'));

  // Edit Test Case Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Test Case Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    if (!projectId || !testCaseId) return;

    try {
      setLoading(true);
      setError(null);
      const [projData, tcData] = await Promise.all([
        projectService.getProjectById(projectId),
        testCaseService.getTestCaseById(testCaseId),
      ]);
      setProject(projData);
      setTestCase(tcData);
    } catch (err: any) {
      setError(err.message || 'Unable to load test case details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRunsHistory = useCallback(async () => {
    if (!testCaseId) return;
    try {
      setLoadingRuns(true);
      setRunsError(null);
      const history = await runService.getRuns(testCaseId);
      setRunsList(history);
    } catch (err: any) {
      setRunsError(err.message || 'Unable to load run history.');
    } finally {
      setLoadingRuns(false);
    }
  }, [testCaseId]);

  useEffect(() => {
    fetchData();
    fetchRunsHistory();
  }, [projectId, testCaseId, fetchRunsHistory]);

  // Keep selectedRunId synced with URL search params (e.g. ?runId=123)
  useEffect(() => {
    const urlRunId = searchParams.get('runId');
    if (urlRunId) {
      setSelectedRunId(urlRunId);
    }
  }, [searchParams]);

  const handleOpenRunDetail = (runId: string) => {
    setSelectedRunId(runId);
    setSearchParams({ runId });
  };

  const handleCloseRunDetail = () => {
    setSelectedRunId(null);
    setSearchParams({});
  };

  // Cleanup Socket listeners and leave room on component unmount
  useEffect(() => {
    return () => {
      if (runState?.runId) {
        leaveRunRoom(runState.runId);
      }
      const s = getSocket();
      s.off(SOCKET_EVENTS.RUN_QUEUED);
      s.off(SOCKET_EVENTS.RUN_STARTED);
      s.off(SOCKET_EVENTS.STEP_STARTED);
      s.off(SOCKET_EVENTS.STEP_PASSED);
      s.off(SOCKET_EVENTS.STEP_FAILED);
      s.off(SOCKET_EVENTS.RUN_COMPLETED);
      s.off(SOCKET_EVENTS.RUN_FAILED);
    };
  }, [runState?.runId]);

  const handleRunTest = async () => {
    if (!testCase || !testCase.dsl?.steps || testCase.dsl.steps.length === 0) {
      setRunError('Cannot run test case: Please add at least 1 test step first.');
      return;
    }

    try {
      setIsRunningTest(true);
      setRunError(null);

      // Initialize pending steps array for live tracking UI
      const initialSteps: StepExecutionState[] = testCase.dsl.steps.map((step, idx) => ({
        stepIndex: idx,
        stepType: step.type,
        status: 'pending',
      }));

      setRunState({
        runId: null,
        status: 'queued',
        steps: initialSteps,
      });

      // 1. Trigger backend execution endpoint POST /api/runs
      const runRes = await runService.startRun(testCase.id);
      const currentRunId = runRes.runId;

      setRunState((prev) => (prev ? { ...prev, runId: currentRunId, status: 'queued' } : null));

      // 2. Connect & Join Socket.IO Room for this runId
      const socket = getSocket();

      const handleConnect = () => setIsReconnecting(false);
      const handleDisconnect = () => setIsReconnecting(true);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      joinRunRoom(currentRunId);

      // 3. Register Typed Socket Event Handlers
      socket.on(SOCKET_EVENTS.RUN_QUEUED, (data: SocketRunEventPayload) => {
        if (data.runId === currentRunId) {
          setRunState((prev) => (prev ? { ...prev, status: 'queued' } : null));
        }
      });

      socket.on(SOCKET_EVENTS.RUN_STARTED, (data: SocketRunEventPayload) => {
        if (data.runId === currentRunId) {
          setRunState((prev) =>
            prev ? { ...prev, status: 'running', startedAt: data.startedAt } : null
          );
        }
      });

      socket.on(SOCKET_EVENTS.STEP_STARTED, (data: SocketStepEventPayload) => {
        if (data.runId === currentRunId) {
          setRunState((prev) => {
            if (!prev) return null;
            const updatedSteps = prev.steps.map((s) =>
              s.stepIndex === data.stepIndex ? { ...s, status: 'running' as const } : s
            );
            return { ...prev, steps: updatedSteps };
          });
        }
      });

      socket.on(SOCKET_EVENTS.STEP_PASSED, (data: SocketStepEventPayload) => {
        if (data.runId === currentRunId) {
          setRunState((prev) => {
            if (!prev) return null;
            const updatedSteps = prev.steps.map((s) =>
              s.stepIndex === data.stepIndex ? { ...s, status: 'passed' as const } : s
            );
            return { ...prev, steps: updatedSteps };
          });
        }
      });

      socket.on(SOCKET_EVENTS.STEP_FAILED, (data: SocketStepEventPayload) => {
        if (data.runId === currentRunId) {
          setRunState((prev) => {
            if (!prev) return null;
            const updatedSteps = prev.steps.map((s) =>
              s.stepIndex === data.stepIndex
                ? { ...s, status: 'failed' as const, error: data.error }
                : s
            );
            return { ...prev, steps: updatedSteps };
          });
        }
      });

      socket.on(SOCKET_EVENTS.RUN_COMPLETED, (data: SocketRunEventPayload) => {
        if (data.runId === currentRunId) {
          setRunState((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'passed',
                  durationMs: data.durationMs,
                  completedAt: data.completedAt,
                }
              : null
          );
          setIsRunningTest(false);
          fetchRunsHistory(); // Refresh history list immediately
        }
      });

      socket.on(SOCKET_EVENTS.RUN_FAILED, (data: SocketRunEventPayload) => {
        if (data.runId === currentRunId) {
          setRunState((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'failed',
                  durationMs: data.durationMs,
                  error: data.error,
                  screenshotPath: data.screenshotPath,
                  completedAt: data.completedAt,
                }
              : null
          );
          setIsRunningTest(false);
          fetchRunsHistory(); // Refresh history list immediately
        }
      });
    } catch (err: any) {
      setRunError(err.message || 'Failed to start test execution.');
      setIsRunningTest(false);
      setRunState(null);
    }
  };

  const openEditModal = () => {
    if (!testCase) return;
    setName(testCase.name);
    setDescription(testCase.description || '');
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveTestCaseDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCase) return;

    setModalError(null);
    if (!name.trim() || name.trim().length < 2) {
      setModalError('Test case name must be at least 2 characters.');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await testCaseService.updateTestCase(
        testCase.id,
        name.trim(),
        description.trim()
      );
      setTestCase(updated);
      setIsEditModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to update test case.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTestCase = async () => {
    if (!testCase) return;

    try {
      setIsDeleting(true);
      await testCaseService.deleteTestCase(testCase.id);
      setIsDeleteModalOpen(false);
      navigate(`/projects/${projectId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete test case.');
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-20 text-slate-400 space-x-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Loading test case details...</span>
      </div>
    );
  }

  if (error || !testCase) {
    return (
      <div className="space-y-4">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Project</span>
        </Link>
        <div className="card flex items-center space-x-3 text-red-400 border-red-500/30 bg-red-500/10">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'Test case not found.'}</span>
        </div>
      </div>
    );
  }

  const stepsCount = testCase.dsl?.steps?.length || 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-400">
        <Link to="/projects" className="hover:text-slate-200 transition-colors">
          Projects
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/projects/${projectId}`} className="hover:text-slate-200 transition-colors">
          {project?.name || 'Project'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-200 font-medium">{testCase.name}</span>
      </nav>

      {/* Test Case Header */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{testCase.name}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {testCase.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end sm:self-center">
            {/* Run Test Button */}
            <button
              onClick={handleRunTest}
              disabled={isRunningTest || stepsCount === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:text-emerald-400/50 text-white rounded-lg font-semibold text-xs transition-colors flex items-center space-x-2 shadow-lg shadow-emerald-950/20"
              title={stepsCount === 0 ? 'Add at least 1 step to run test' : 'Run Playwright test in Chromium'}
            >
              {isRunningTest ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Play className="w-4 h-4 text-white fill-current" />
              )}
              <span>{isRunningTest ? 'Executing...' : 'Run Test'}</span>
            </button>

            <button
              onClick={openEditModal}
              className="btn-secondary text-xs flex items-center space-x-1.5"
              title="Edit Test Case Details"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="btn-secondary text-xs flex items-center space-x-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30"
              title="Delete Test Case"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Metadata Bar */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-3 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500">Project:</span>
            <span className="font-semibold text-slate-200">{project?.name}</span>
          </div>

          <span>•</span>

          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Created {new Date(testCase.createdAt).toLocaleDateString()}</span>
          </div>

          {testCase.updatedAt && (
            <>
              <span>•</span>
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Updated {new Date(testCase.updatedAt).toLocaleDateString()}</span>
              </div>
            </>
          )}

          <span>•</span>

          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-[10px] font-medium text-slate-300">
              {stepsCount} step(s)
            </span>
          </div>
        </div>
      </div>

      {/* Execution Trigger Error Banner */}
      {runError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{runError}</span>
        </div>
      )}

      {/* Live Socket.IO Execution Status Panel (Day 19) */}
      {runState && (
        <LiveExecutionPanel
          runState={runState}
          testCaseSteps={testCase.dsl?.steps || []}
          isReconnecting={isReconnecting}
          onClose={() => setRunState(null)}
        />
      )}

      {/* Visual Test Step Editor Component (Day 18) */}
      <TestStepEditor
        testCaseId={testCase.id}
        testCaseName={testCase.name}
        testCaseDescription={testCase.description}
        initialDsl={testCase.dsl}
        onSaveSuccess={fetchData}
      />

      {/* Run History Section (Day 20) */}
      <RunHistory
        runs={runsList}
        loading={loadingRuns}
        error={runsError}
        onSelectRun={handleOpenRunDetail}
        onRefresh={fetchRunsHistory}
      />

      {/* Run Detail Modal Component (Day 20) */}
      <RunDetailModal
        runId={selectedRunId}
        isOpen={!!selectedRunId}
        onClose={handleCloseRunDetail}
      />

      {/* Edit Test Case Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">Edit Test Case Details</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveTestCaseDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Test Case Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary text-xs"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Test Case Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Test Case?"
        message={`Are you sure you want to delete "${testCase.name}"? This action cannot be undone.`}
        confirmText="Delete Test Case"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteTestCase}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
