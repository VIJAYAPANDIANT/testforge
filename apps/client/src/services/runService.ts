import api from './api';
import { ApiResponse } from '../types';

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
   * Retrieves persistent Run and RunResult details by run ID.
   *
   * @param runId - Run ID
   */
  async getRunById(runId: string): Promise<{ run: any; result: any }> {
    const response = await api.get<ApiResponse<{ run: any; result: any }>>(`/api/runs/${runId}`);
    return response.data.data!;
  },
};
