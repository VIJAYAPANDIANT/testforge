import api from './api';
import { ApiResponse, TestCase } from '../types';

const DEFAULT_DSL = {
  version: '1.0',
  name: 'New Test Case',
  steps: [
    {
      id: 'step_1',
      type: 'navigate',
      url: 'https://example.com',
    },
  ],
};

export const testCaseService = {
  getTestCases: async (projectId: string): Promise<TestCase[]> => {
    const response = await api.get<ApiResponse<{ testCases: TestCase[] }>>(
      `/api/projects/${projectId}/test-cases`
    );
    if (!response.data.success || !response.data.data?.testCases) {
      throw new Error(response.data.message || 'Failed to fetch test cases');
    }
    return response.data.data.testCases;
  },

  getTestCaseById: async (id: string): Promise<TestCase> => {
    const response = await api.get<ApiResponse<{ testCase: TestCase }>>(`/api/test-cases/${id}`);
    if (!response.data.success || !response.data.data?.testCase) {
      throw new Error(response.data.message || 'Test case not found');
    }
    return response.data.data.testCase;
  },

  createTestCase: async (
    projectId: string,
    name: string,
    description?: string,
    dsl?: any
  ): Promise<TestCase> => {
    const response = await api.post<ApiResponse<{ testCase: TestCase }>>(
      `/api/projects/${projectId}/test-cases`,
      {
        name,
        description,
        dsl: dsl || { ...DEFAULT_DSL, name },
      }
    );
    if (!response.data.success || !response.data.data?.testCase) {
      throw new Error(response.data.message || 'Failed to create test case');
    }
    return response.data.data.testCase;
  },

  updateTestCase: async (
    id: string,
    name?: string,
    description?: string,
    dsl?: any
  ): Promise<TestCase> => {
    const response = await api.patch<ApiResponse<{ testCase: TestCase }>>(`/api/test-cases/${id}`, {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(dsl !== undefined ? { dsl } : {}),
    });
    if (!response.data.success || !response.data.data?.testCase) {
      throw new Error(response.data.message || 'Failed to update test case');
    }
    return response.data.data.testCase;
  },

  deleteTestCase: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse>(`/api/test-cases/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete test case');
    }
  },
};
