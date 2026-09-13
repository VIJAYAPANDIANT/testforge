import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { Project } from '../types';
import { FolderGit2, FileCode, PlayCircle, Plus, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await projectService.getProjects();
        setProjects(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-900 border border-blue-500/20 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Welcome back, <span className="text-blue-400">{user?.name || 'Tester'}</span>! 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Manage your test automation projects, build visual DSL test workflows, and view execution results.
          </p>
        </div>

        <Link
          to="/projects"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 shrink-0 shadow-lg shadow-blue-600/20"
        >
          <FolderGit2 className="w-4 h-4" />
          <span>View Projects</span>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Projects Card */}
        <div className="card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Projects</span>
            <div className="text-3xl font-bold text-slate-100 mt-2">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-500" /> : projects.length}
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
            <FolderGit2 className="w-6 h-6" />
          </div>
        </div>

        {/* Test Cases Card */}
        <div className="card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Test Cases</span>
            <div className="text-3xl font-bold text-slate-100 mt-2">—</div>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <FileCode className="w-6 h-6" />
          </div>
        </div>

        {/* Test Runs Card */}
        <div className="card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Test Runs</span>
            <div className="text-3xl font-bold text-slate-100 mt-2">—</div>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
            <PlayCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recent Projects Preview Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Recent Projects</h2>
          <Link to="/projects" className="text-xs font-medium text-blue-400 hover:underline flex items-center space-x-1">
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="card flex items-center justify-center py-12 text-slate-400 text-sm space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span>Loading dashboard projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-12 space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-slate-400">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-200">No projects yet</h3>
              <p className="text-sm text-slate-400 mt-1">Create your first project to start building automated tests.</p>
            </div>
            <Link
              to="/projects"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Go to Projects</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}/test-cases`}
                className="card hover:border-blue-500/50 transition-all duration-200 space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {project.description || 'No description provided for this project.'}
                </p>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
