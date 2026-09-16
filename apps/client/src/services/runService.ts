import api from './api';
import { ApiResponse, RunItem, RunDetailData } from '../types';

export const runService = {
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
   * Fetches execution run history list, optionally filtered by testCaseId or projectId.
   *
   * @param testCaseId - Optional TestCase ID filter
   * @param projectId - Optional Project ID filter
   * @param limit - Optional maximum items count (default 50)
   */
  async getRuns(
    testCaseId?: string,
    projectId?: string,
    limit: number = 50
  ): Promise<RunItem[]> {
    const params = new URLSearchParams();
    if (testCaseId) params.append('testCaseId', testCaseId);
    if (projectId) params.append('projectId', projectId);
    if (limit) params.append('limit', limit.toString());

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
};
