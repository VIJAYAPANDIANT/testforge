import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { Project } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  FolderGit2,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  PlayCircle,
  FileCode,
  Calendar,
  Webhook,
  Zap,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openDeleteModal = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingProject(project);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!name.trim() || name.trim().length < 2) {
      setModalError('Project name must be at least 2 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingProject) {
        const updated = await projectService.updateProject(
          editingProject.id,
          name.trim(),
          description.trim()
        );
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setSuccessMessage(`Project "${updated.name}" updated successfully.`);
      } else {
        const newProject = await projectService.createProject(name.trim(), description.trim());
        setProjects((prev) => [newProject, ...prev]);
        setSuccessMessage(`Project "${newProject.name}" created successfully.`);
      }
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setEditingProject(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setModalError(err.message || 'Failed to save project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;

    try {
      setIsDeleting(true);
      await projectService.deleteProject(deletingProject.id);
      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
      setSuccessMessage(`Project "${deletingProject.name}" deleted successfully.`);
      setDeletingProject(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete project.');
      setDeletingProject(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <span>Projects</span>
            <span className="text-xs font-mono font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
              {projects.length}
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            Manage your test automation projects, configure webhook triggers, and execute suites.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center space-x-2 text-sm shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Success Alert Banner */}
      {successMessage && (
        <div className="flex items-center space-x-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center space-x-3 p-4 text-red-400 border border-red-500/30 bg-red-500/10 rounded-xl text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="card p-6 bg-[#111827]/80 border-slate-800 space-y-4 animate-pulse rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800" />
                  <div className="h-5 w-36 bg-slate-800 rounded" />
                </div>
                <div className="h-5 w-12 bg-slate-800 rounded" />
              </div>
              <div className="h-3 w-3/4 bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-800 rounded" />
              <div className="pt-3 border-t border-slate-800/80 flex justify-between">
                <div className="h-3 w-24 bg-slate-800 rounded" />
                <div className="h-3 w-20 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-16 px-6 space-y-6 border border-dashed border-slate-800 bg-[#111827]/60 rounded-2xl max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-inner">
            <FolderGit2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-slate-100">No Projects Created Yet</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Projects organize your visual test suites, automated Playwright execution runs, and GitHub webhook CI/CD triggers for a specific application or domain.
            </p>
          </div>

          {/* Workflow Hint Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 max-w-xl mx-auto text-left space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
              Automation Workflow
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                <span className="font-semibold text-slate-200 truncate">Create Project</span>
              </div>
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                <span className="font-semibold text-slate-200 truncate">Add Test Case</span>
              </div>
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                <span className="font-semibold text-slate-200 truncate">Build Steps</span>
              </div>
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">4</span>
                <span className="font-semibold text-slate-200 truncate">Run Test</span>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={openCreateModal}
              className="btn-primary text-xs sm:text-sm px-6 py-2.5 inline-flex items-center space-x-2 shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Project</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="card p-5 bg-[#111827]/90 border-slate-800 hover:border-blue-500/50 transition-all duration-200 space-y-3 group cursor-pointer relative rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </h2>
                    <div className="flex items-center space-x-2 pt-0.5">
                      {project.autoTest?.enabled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          <Webhook className="w-2.5 h-2.5" />
                          <span>{project.autoTest.provider === 'github' ? 'GitHub Auto-Test' : 'Webhook Active'}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Manual Trigger
                        </span>
                      )}

                      {project.autoTest?.testCaseIds && project.autoTest.testCaseIds.length > 0 && (
                        <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                          {project.autoTest.testCaseIds.length} auto-run
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => openEditModal(e, project)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit Project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => openDeleteModal(e, project)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors ml-1" />
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">
                {project.description || 'No description provided for this project.'}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                </span>
                <span className="text-blue-400 font-semibold group-hover:underline flex items-center space-x-1">
                  <span>Open Project</span>
                  <span>&rarr;</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h3>
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

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. TestForge Web App"
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
                  placeholder="Automated regression test scenarios..."
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
                  <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingProject}
        title="Delete Project?"
        message={`Are you sure you want to delete "${deletingProject?.name}"? This action cannot be undone.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteProject}
        onClose={() => setDeletingProject(null)}
      />
    </div>
  );
};
