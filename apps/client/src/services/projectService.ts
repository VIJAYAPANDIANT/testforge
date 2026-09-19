import api from './api';
import { ApiResponse, Project } from '../types';

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get<ApiResponse<{ projects: Project[] }>>('/api/projects');
    if (!response.data.success || !response.data.data?.projects) {
      throw new Error(response.data.message || 'Failed to fetch projects');
    }
    return response.data.data.projects;
  },

  getProjectById: async (id: string): Promise<Project> => {
    const response = await api.get<ApiResponse<{ project: Project }>>(`/api/projects/${id}`);
    if (!response.data.success || !response.data.data?.project) {
      throw new Error(response.data.message || 'Project not found');
    }
    return response.data.data.project;
  },

  createProject: async (name: string, description?: string): Promise<Project> => {
    const response = await api.post<ApiResponse<{ project: Project }>>('/api/projects', {
      name,
      description,
    });
    if (!response.data.success || !response.data.data?.project) {
      throw new Error(response.data.message || 'Failed to create project');
    }
    return response.data.data.project;
  },

  updateProject: async (
    id: string,
    name?: string,
    description?: string,
    autoTest?: {
      enabled?: boolean;
      branch?: string;
      testCaseIds?: string[];
      regenerateSecret?: boolean;
    }
  ): Promise<Project> => {
    const response = await api.patch<ApiResponse<{ project: Project }>>(`/api/projects/${id}`, {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(autoTest !== undefined ? { autoTest } : {}),
    });
    if (!response.data.success || !response.data.data?.project) {
      throw new Error(response.data.message || 'Failed to update project');
    }
    return response.data.data.project;
  },

  deleteProject: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse>(`/api/projects/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete project');
    }
  },
};
