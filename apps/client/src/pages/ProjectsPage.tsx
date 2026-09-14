import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { Project } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { FolderGit2, Plus, ArrowRight, Loader2, AlertCircle, X, Edit2, Trash2 } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        const newProject = await projectService.createProject(name.trim(), description.trim());
        setProjects((prev) => [newProject, ...prev]);
      }
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setEditingProject(null);
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
      setDeletingProject(null);
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
          <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
          <p className="text-sm text-slate-400">Manage your test automation projects.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center space-x-2 text-sm shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="card flex items-center justify-center py-16 text-slate-400 space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading projects...</span>
        </div>
      ) : error ? (
        <div className="card flex items-center space-x-3 text-red-400 border-red-500/30 bg-red-500/10">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-16 space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-slate-400">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-200">No projects yet</h3>
            <p className="text-sm text-slate-400">Create your first project to start automating tests.</p>
          </div>
          <button onClick={openCreateModal} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="card hover:border-blue-500/50 transition-all duration-200 space-y-3 group cursor-pointer relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h2>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => openEditModal(e, project)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                    title="Edit Project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => openDeleteModal(e, project)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors ml-1" />
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 pl-12">
                {project.description || 'No description provided for this project.'}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80 pl-12">
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                <span className="text-blue-400 group-hover:underline">Open Project &rarr;</span>
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
