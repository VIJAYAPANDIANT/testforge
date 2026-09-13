import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { testCaseService } from '../services/testCaseService';
import { Project, TestCase } from '../types';
import { FileCode, Plus, ChevronRight, Loader2, AlertCircle, X, Calendar } from 'lucide-react';

export const TestCasesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      const [projData, casesData] = await Promise.all([
        projectService.getProjectById(projectId),
        testCaseService.getTestCases(projectId),
      ]);
      setProject(projData);
      setTestCases(casesData);
    } catch (err: any) {
      setError(err.message || 'Unable to load test cases for this project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleCreateTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!projectId) return;

    if (!name.trim() || name.trim().length < 2) {
      setModalError('Test case name must be at least 2 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newTestCase = await testCaseService.createTestCase(projectId, name.trim(), description.trim());
      setTestCases((prev) => [newTestCase, ...prev]);
      setIsModalOpen(false);
      setName('');
      setDescription('');
    } catch (err: any) {
      setModalError(err.message || 'Failed to create test case.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-slate-400">
        <Link to="/projects" className="hover:text-slate-200 transition-colors">
          Projects
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-blue-400 font-medium">{project ? project.name : 'Project'}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-200">Test Cases</span>
      </nav>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <span>{project ? project.name : 'Test Cases'}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {project?.description || 'Browser automated test scenarios for this project'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center space-x-2 text-sm shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Test Case</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="card flex items-center justify-center py-16 text-slate-400 space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading test cases...</span>
        </div>
      ) : error ? (
        <div className="card flex items-center space-x-3 text-red-400 border-red-500/30 bg-red-500/10">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : testCases.length === 0 ? (
        <div className="card text-center py-16 space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-slate-400">
            <FileCode className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-200">No test cases found</h3>
            <p className="text-sm text-slate-400">Create your first test case in this project.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            <span>Create Test Case</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {testCases.map((tc) => (
            <div
              key={tc.id}
              className="card hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{tc.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {tc.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs text-slate-400 self-end sm:self-center">
                <div className="flex items-center space-x-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(tc.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-[11px] font-medium text-slate-300">
                  {tc.dsl?.steps?.length || 0} step(s)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Test Case Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">Create New Test Case</h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleCreateTestCase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Test Case Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Verify Login Flow"
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
                  placeholder="Verify valid credentials login into dashboard..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Create Test Case</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
