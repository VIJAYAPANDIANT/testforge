import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { testCaseService } from '../services/testCaseService';
import { Project, TestCase } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  FolderGit2,
  FileCode,
  Plus,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Calendar,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Project Modal State
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectModalError, setProjectModalError] = useState<string | null>(null);
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Delete Project Modal State
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Create / Edit Test Case Modal State
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [tcName, setTcName] = useState('');
  const [tcDescription, setTcDescription] = useState('');
  const [tcModalError, setTcModalError] = useState<string | null>(null);
  const [isSavingTc, setIsSavingTc] = useState(false);

  // Delete Test Case Modal State
  const [deletingTestCase, setDeletingTestCase] = useState<TestCase | null>(null);
  const [isDeletingTc, setIsDeletingTc] = useState(false);

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
      setError(err.message || 'Unable to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Project Actions
  const openEditProjectModal = () => {
    if (!project) return;
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setProjectModalError(null);
    setIsEditProjectOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setProjectModalError(null);
    if (!projectName.trim() || projectName.trim().length < 2) {
      setProjectModalError('Project name must be at least 2 characters.');
      return;
    }

    try {
      setIsSavingProject(true);
      const updated = await projectService.updateProject(
        project.id,
        projectName.trim(),
        projectDescription.trim()
      );
      setProject(updated);
      setIsEditProjectOpen(false);
    } catch (err: any) {
      setProjectModalError(err.message || 'Failed to update project.');
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    try {
      setIsDeletingProject(true);
      await projectService.deleteProject(project.id);
      setIsDeleteProjectOpen(false);
      navigate('/projects');
    } catch (err: any) {
      setError(err.message || 'Failed to delete project.');
      setIsDeleteProjectOpen(false);
    } finally {
      setIsDeletingProject(false);
    }
  };

  // Test Case Actions
  const openCreateTcModal = () => {
    setEditingTestCase(null);
    setTcName('');
    setTcDescription('');
    setTcModalError(null);
    setIsTestCaseModalOpen(true);
  };

  const openEditTcModal = (e: React.MouseEvent, tc: TestCase) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingTestCase(tc);
    setTcName(tc.name);
    setTcDescription(tc.description || '');
    setTcModalError(null);
    setIsTestCaseModalOpen(true);
  };

  const openDeleteTcModal = (e: React.MouseEvent, tc: TestCase) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingTestCase(tc);
  };

  const handleSaveTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setTcModalError(null);
    if (!tcName.trim() || tcName.trim().length < 2) {
      setTcModalError('Test case name must be at least 2 characters.');
      return;
    }

    try {
      setIsSavingTc(true);
      if (editingTestCase) {
        const updated = await testCaseService.updateTestCase(
          editingTestCase.id,
          tcName.trim(),
          tcDescription.trim()
        );
        setTestCases((prev) => prev.map((tc) => (tc.id === updated.id ? updated : tc)));
        setIsTestCaseModalOpen(false);
      } else {
        const newTc = await testCaseService.createTestCase(
          projectId,
          tcName.trim(),
          tcDescription.trim()
        );
        setTestCases((prev) => [newTc, ...prev]);
        setIsTestCaseModalOpen(false);
        navigate(`/projects/${projectId}/test-cases/${newTc.id}`);
      }
    } catch (err: any) {
      setTcModalError(err.message || 'Failed to save test case.');
    } finally {
      setIsSavingTc(false);
    }
  };

  const handleDeleteTestCase = async () => {
    if (!deletingTestCase) return;

    try {
      setIsDeletingTc(true);
      await testCaseService.deleteTestCase(deletingTestCase.id);
      setTestCases((prev) => prev.filter((tc) => tc.id !== deletingTestCase.id));
      setDeletingTestCase(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete test case.');
      setDeletingTestCase(null);
    } finally {
      setIsDeletingTc(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-20 text-slate-400 space-x-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Loading project details...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Link to="/projects" className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
        <div className="card flex items-center space-x-3 text-red-400 border-red-500/30 bg-red-500/10">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'Project not found.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-400">
        <Link to="/projects" className="hover:text-slate-200 transition-colors">
          Projects
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-200 font-medium">{project.name}</span>
      </nav>

      {/* Project Banner & Actions Header */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{project.name}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {project.description || 'No description provided for this project.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center">
            <button
              onClick={openEditProjectModal}
              className="btn-secondary text-xs flex items-center space-x-1.5"
              title="Edit Project Details"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => setIsDeleteProjectOpen(true)}
              className="btn-secondary text-xs flex items-center space-x-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30"
              title="Delete Project"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              onClick={openCreateTcModal}
              className="btn-primary text-xs flex items-center space-x-1.5 shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Test Case</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
          <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>Test Cases: {testCases.length}</span>
        </div>
      </div>

      {/* Test Cases Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Test Cases</h2>
          <span className="text-xs text-slate-400">{testCases.length} total</span>
        </div>

        {testCases.length === 0 ? (
          <div className="card text-center py-16 space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-slate-400">
              <FileCode className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-200">No test cases yet</h3>
              <p className="text-sm text-slate-400">Create your first test case for this project.</p>
            </div>
            <button onClick={openCreateTcModal} className="btn-primary text-sm">
              <Plus className="w-4 h-4" />
              <span>Create Test Case</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {testCases.map((tc) => (
              <div
                key={tc.id}
                onClick={() => navigate(`/projects/${projectId}/test-cases/${tc.id}`)}
                className="card hover:border-blue-500/50 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 cursor-pointer group"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                      {tc.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {tc.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400 self-end sm:self-center">
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(tc.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => openEditTcModal(e, tc)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                      title="Edit Test Case"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => openDeleteTcModal(e, tc)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                      title="Delete Test Case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {isEditProjectOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">Edit Project</h3>
              <button
                onClick={() => setIsEditProjectOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {projectModalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                {projectModalError}
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProjectOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProject}
                  className="btn-primary text-xs"
                >
                  {isSavingProject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteProjectOpen}
        title="Delete Project?"
        message={`Are you sure you want to delete "${project.name}" and all associated test cases? This action cannot be undone.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeletingProject}
        onConfirm={handleDeleteProject}
        onClose={() => setIsDeleteProjectOpen(false)}
      />

      {/* Create / Edit Test Case Modal */}
      {isTestCaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">
                {editingTestCase ? 'Edit Test Case' : 'Create New Test Case'}
              </h3>
              <button
                onClick={() => setIsTestCaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {tcModalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                {tcModalError}
              </div>
            )}

            <form onSubmit={handleSaveTestCase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Test Case Name *
                </label>
                <input
                  type="text"
                  value={tcName}
                  onChange={(e) => setTcName(e.target.value)}
                  placeholder="e.g. Login Test"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={tcDescription}
                  onChange={(e) => setTcDescription(e.target.value)}
                  placeholder="Verify valid user login..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestCaseModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTc}
                  className="btn-primary text-xs"
                >
                  {isSavingTc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingTestCase ? 'Save Changes' : 'Create Test Case'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Test Case Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingTestCase}
        title="Delete Test Case?"
        message={`Are you sure you want to delete "${deletingTestCase?.name}"? This action cannot be undone.`}
        confirmText="Delete Test Case"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeletingTc}
        onConfirm={handleDeleteTestCase}
        onClose={() => setDeletingTestCase(null)}
      />
    </div>
  );
};
