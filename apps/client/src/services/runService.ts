import api from './api';
import { ApiResponse, RunItem, RunDetailData, DashboardStats, FailureAnalysis } from '../types';

export const runService = {
  /**
   * Fetches aggregate real dashboard metrics for the authenticated user.
   * Optionally filtered by projectId.
   */
  async getRunStats(projectId?: string): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<ApiResponse<DashboardStats>>(`/api/runs/stats${queryString}`);
    if (!response.data.data) {
      throw new Error('Failed to load dashboard statistics');
    }
    return response.data.data;
  },

  /**
   * Triggers a new test case execution run.
   *
   * @param testCaseId - TestCase ID
   * @param environmentId - Optional Environment ID
   * @returns Run object containing runId and initial status
   */
  async startRun(
    testCaseId: string,
    environmentId?: string
  ): Promise<{ runId: string; status: string }> {
    const response = await api.post<ApiResponse<{ runId: string; status: string }>>('/api/runs', {
      testCaseId,
      ...(environmentId ? { environmentId } : {}),
    });

    if (!response.data.data?.runId) {
      throw new Error(response.data.message || 'Failed to trigger test execution');
    }

    return response.data.data;
  },

  /**
   * Fetches execution run history list, optionally filtered by testCaseId, projectId, or triggerSource.
   *
   * @param testCaseId - Optional TestCase ID filter
   * @param projectId - Optional Project ID filter
   * @param limit - Optional maximum items count (default 50)
   * @param triggerSource - Optional triggerSource filter ('manual' | 'webhook' | 'github' | 'auto')
   */
  async getRuns(
    testCaseId?: string,
    projectId?: string,
    limit: number = 50,
    triggerSource?: string
  ): Promise<RunItem[]> {
    const params = new URLSearchParams();
    if (testCaseId) params.append('testCaseId', testCaseId);
    if (projectId) params.append('projectId', projectId);
    if (limit) params.append('limit', limit.toString());
    if (triggerSource) params.append('triggerSource', triggerSource);

    const response = await api.get<ApiResponse<RunItem[]>>(`/api/runs?${params.toString()}`);
    return response.data.data || [];
  },

  /**
   * Retrieves persistent Run and RunResult details by run ID.
   *
   * @param runId - Run ID
   */
  async getRunById(runId: string): Promise<RunDetailData> {
    const response = await api.get<ApiResponse<RunDetailData>>(`/api/runs/${runId}`);
    if (!response.data.data) {
      throw new Error('Run details not found');
    }
    return response.data.data;
  },

  /**
   * Triggers AI failure analysis for a failed execution run.
   *
   * @param runId - Run ID
   * @param forceReanalyze - Optional boolean to force fresh AI analysis
   */
  async analyzeRunFailure(runId: string, forceReanalyze: boolean = false): Promise<FailureAnalysis> {
    const queryString = forceReanalyze ? '?force=true' : '';
    const response = await api.post<ApiResponse<FailureAnalysis>>(`/api/runs/${runId}/analyze${queryString}`);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to generate AI failure analysis');
    }
    return response.data.data;
  },
};
