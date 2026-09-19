import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { runService } from '../services/runService';
import { Project, RunItem, DashboardStats } from '../types';
import { RunDetailModal } from '../components/test-execution/RunDetailModal';
import {
  FolderGit2,
  FileCode,
  PlayCircle,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Webhook,
  GitBranch,
  GitCommit,
  Settings,
  Filter,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentRuns, setRecentRuns] = useState<RunItem[]>([]);
  
  // Filtering state
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [activeTriggerTab, setActiveTriggerTab] = useState<'all' | 'manual' | 'auto' | 'github'>('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Run detail modal state
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const projIdFilter = selectedProjectId !== 'all' ? selectedProjectId : undefined;
      const triggerFilter = activeTriggerTab !== 'all' ? activeTriggerTab : undefined;

      const [statsData, projectsData, runsData] = await Promise.all([
        runService.getRunStats(projIdFilter),
        projectService.getProjects(),
        runService.getRuns(undefined, projIdFilter, 50, triggerFilter),
      ]);

      setStats(statsData);
      setProjects(projectsData);
      setRecentRuns(runsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, activeTriggerTab]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Selected project object for configuration summary card
  const activeProject = selectedProjectId !== 'all'
    ? projects.find((p) => p.id === selectedProjectId)
    : projects[0];

  const formatDuration = (durationMs?: number): string => {
    if (!durationMs || durationMs <= 0) return '-';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(1)}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-1.5 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            <span>Passed</span>
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-400 flex items-center space-x-1.5 w-fit">
            <XCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case 'running':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center space-x-1.5 w-fit animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Running</span>
          </span>
        );
      case 'queued':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center space-x-1.5 w-fit">
            <Clock className="w-3 h-3" />
            <span>Queued</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Filter Bar */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 border border-blue-500/20 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center space-x-2">
            <span>Welcome back,</span>
            <span className="text-blue-400">{user?.name || 'Tester'}</span>
            <span>! 👋</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Monitor real-time Playwright execution metrics, auto-test update triggers, and project health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-end md:self-center">
          {/* Project Selector Filter */}
          <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-400 font-medium hidden sm:inline">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent border-none text-slate-100 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn-secondary text-xs flex items-center space-x-1.5 py-2 px-3"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/projects"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 shadow-lg shadow-blue-600/20"
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Projects</span>
          </Link>
        </div>
      </div>

      {/* Error state alert */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="underline hover:text-red-300 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Auto-Test Configuration Summary Card */}
      {activeProject && (
        <div className="card p-6 bg-gradient-to-r from-slate-900 via-[#111827] to-slate-900 border-slate-800 hover:border-slate-700 transition-all rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-100">Auto-Test Configuration</h2>
                  <span className="text-xs text-slate-400 font-normal">({activeProject.name})</span>
                </div>
                <p className="text-xs text-slate-400">
                  Automated test triggers on code push / update events for website repository.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {activeProject.autoTest?.enabled ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Auto-Test Enabled</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-400 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Auto-Test Disabled</span>
                </span>
              )}

              <Link
                to={`/projects/${activeProject.id}`}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1.5"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Configure Settings</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Trigger Provider</span>
              <div className="font-semibold text-slate-200 flex items-center space-x-2">
                {activeProject.autoTest?.provider === 'github' ? (
                  <span className="text-purple-400 flex items-center space-x-1">
                    <Webhook className="w-3.5 h-3.5" />
                    <span>GitHub Webhook</span>
                  </span>
                ) : (
                  <span className="text-indigo-400 flex items-center space-x-1">
                    <Webhook className="w-3.5 h-3.5" />
                    <span>Generic Webhook</span>
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Target Repository</span>
              <div className="font-semibold text-slate-200 truncate font-mono">
                {activeProject.autoTest?.github?.repository || (
                  <span className="text-slate-500 font-sans italic">Not specified</span>
                )}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Monitored Branch</span>
              <div className="font-semibold text-slate-200 flex items-center space-x-1 font-mono">
                <GitBranch className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{activeProject.autoTest?.branch || 'main'}</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Configured Tests</span>
              <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{activeProject.autoTest?.testCaseIds?.length || 0} selected test cases</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aggregate Metric Cards Grid (8 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Projects */}
        <div className="card p-4 flex flex-col justify-between space-y-3 bg-[#111827]/90 border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Projects</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : stats?.totalProjects ?? projects.length}
          </div>
        </div>

        {/* 2. Total Test Cases */}
        <div className="card p-4 flex flex-col justify-between space-y-3 bg-[#111827]/90 border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Test Cases</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : stats?.totalTestCases ?? 0}
          </div>
        </div>

        {/* 3. Total Runs */}
        <div className="card p-4 flex flex-col justify-between space-y-3 bg-[#111827]/90 border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Runs</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : stats?.totalRuns ?? 0}
          </div>
        </div>

        {/* 4. Overall Pass Rate */}
        <div className="card p-4 flex flex-col justify-between space-y-3 bg-[#111827]/90 border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overall Pass Rate</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-300">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : `${stats?.passRate ?? 0}%`}
          </div>
        </div>

        {/* 5. Automatic Runs */}
        <div className="card p-4 flex flex-col justify-between space-y-3 bg-[#111827]/90 border-purple-500/30 hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Automatic Runs</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-300">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : stats?.autoRuns ?? 0}
          </div>
        </div>

        {/* 6. Auto Pass Rate */}
        <div className="card p-4 flex flex-col justify-between space-y-3 bg-[#111827]/90 border-purple-500/30 hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Auto Pass Rate</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-300">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : `${stats?.autoPassRate ?? 0}%`}
          </div>
        </div>

        {/* 7. Auto Passed */}
        <div className="card p-4 flex flex-col justify-between space-y-3 bg-[#111827]/90 border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Auto Passed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : stats?.autoPassedRuns ?? 0}
          </div>
        </div>

        {/* 8. Auto Failed */}
        <div className="card p-4 flex flex-col justify-between space-y-3 bg-[#111827]/90 border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Auto Failed</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-400">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : stats?.autoFailedRuns ?? 0}
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Test Executions & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Test Executions (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>Recent Test Executions</span>
              </h2>
              <p className="text-xs text-slate-400">Real Playwright executions triggered manually or via webhooks.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTriggerTab('all')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  activeTriggerTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTriggerTab('manual')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  activeTriggerTab === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => setActiveTriggerTab('auto')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  activeTriggerTab === 'auto'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Automatic
              </button>
              <button
                onClick={() => setActiveTriggerTab('github')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  activeTriggerTab === 'github'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                GitHub
              </button>
            </div>
          </div>

          {loading ? (
            <div className="card flex items-center justify-center py-16 text-slate-400 text-xs space-x-2.5">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading test executions...</span>
            </div>
          ) : recentRuns.length === 0 ? (
            <div className="card text-center py-16 space-y-4 border-dashed border-slate-800">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/80 text-slate-400">
                <PlayCircle className="w-6 h-6 text-purple-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-200">
                  {activeTriggerTab === 'auto' || activeTriggerTab === 'github'
                    ? 'No automatic test runs recorded'
                    : 'No test runs yet'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {activeTriggerTab === 'auto' || activeTriggerTab === 'github'
                    ? 'Push code to your configured GitHub repository or trigger a webhook to start automated test executions.'
                    : 'Run a test case from the visual builder to see execution results here.'}
                </p>
              </div>
              <Link
                to="/projects"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <FolderGit2 className="w-4 h-4" />
                <span>Go to Projects</span>
              </Link>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left bg-slate-900/60">
                      <th className="py-3 px-4">Test Case</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Trigger & Context</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4 text-right">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-xs">
                    {recentRuns.map((run) => (
                      <tr
                        key={run.id}
                        onClick={() => setSelectedRunId(run.id)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                          <div className="flex items-center space-x-2">
                            <span>{run.testCaseName}</span>
                            <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {run.projectName || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {run.triggerSource === 'github' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                <Webhook className="w-3 h-3 text-purple-400" /> GitHub
                              </span>
                              {run.triggerMetadata?.branch && (
                                <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 pt-0.5">
                                  <GitBranch className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                  <span className="truncate max-w-[120px]">{run.triggerMetadata.branch.replace('refs/heads/', '')}</span>
                                  {run.triggerMetadata.commit && (
                                    <span className="text-slate-500 flex items-center">
                                      <GitCommit className="w-2.5 h-2.5 ml-1 mr-0.5" />
                                      {run.triggerMetadata.commit.substring(0, 7)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : run.triggerSource === 'webhook' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                <Webhook className="w-3 h-3" /> Webhook
                              </span>
                              {run.triggerMetadata?.branch && (
                                <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 pt-0.5">
                                  <GitBranch className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                                  <span>{run.triggerMetadata.branch}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(run.status)}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono">
                          {formatDuration(run.durationMs)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                          {new Date(run.createdAt).toLocaleDateString()} {new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent Projects (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">Recent Projects</h2>
            <Link to="/projects" className="text-xs font-semibold text-blue-400 hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="card flex items-center justify-center py-16 text-slate-400 text-xs space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="card text-center py-12 space-y-3 border-dashed border-slate-800">
              <FolderGit2 className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">No projects created yet.</p>
              <Link
                to="/projects"
                className="inline-flex items-center space-x-1.5 btn-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Project</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 4).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}/test-cases`}
                  className="card p-4 hover:border-blue-500/50 transition-all duration-200 space-y-2 group block bg-[#111827]/90"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors text-sm">
                      {project.name}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {project.description || 'No description provided.'}
                  </p>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <div className="flex items-center space-x-2">
                      {project.autoTest?.enabled ? (
                        <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-semibold border border-emerald-500/20">
                          Auto-Test On
                        </span>
                      ) : (
                        <span className="text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                          Auto-Test Off
                        </span>
                      )}
                    </div>
                    <span className="text-blue-400 font-medium group-hover:underline">View Tests &rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Run Detail Modal Integration */}
      <RunDetailModal
        runId={selectedRunId}
        isOpen={!!selectedRunId}
        onClose={() => setSelectedRunId(null)}
      />
    </div>
  );
};
