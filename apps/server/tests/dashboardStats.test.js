import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { getRunStats, getRuns } from '../src/controllers/run.controller.js';
import Project from '../src/models/Project.js';
import TestCase from '../src/models/TestCase.js';
import Run from '../src/models/Run.js';

describe('Day 28 — Dashboard Auto-Test Stats & Filtering Unit Tests (apps/server)', () => {
  test('1. getRunStats computes autoRuns, autoPassedRuns, autoFailedRuns, and autoPassRate correctly', async () => {
    const fakeUserId = new mongoose.Types.ObjectId();

    // Mock countDocuments for Project, TestCase, Run
    const origProjCount = Project.countDocuments;
    const origTestCaseCount = TestCase.countDocuments;
    const origRunCount = Run.countDocuments;

    Project.countDocuments = async () => 2;
    TestCase.countDocuments = async () => 5;

    Run.countDocuments = async (filter) => {
      // Check auto filter vs general filter vs status filter
      if (filter.triggerSource && filter.triggerSource.$in) {
        if (filter.status === 'passed') return 3;
        if (filter.status === 'failed') return 1;
        return 4; // total auto runs
      }
      if (filter.status === 'passed') return 8;
      if (filter.status === 'failed') return 2;
      return 10; // total runs
    };

    let responseData = null;
    let statusCode = null;

    const req = {
      user: { _id: fakeUserId },
      query: {},
    };

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    try {
      await getRunStats(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(responseData.success, true);
      assert.equal(responseData.data.totalProjects, 2);
      assert.equal(responseData.data.totalTestCases, 5);
      assert.equal(responseData.data.totalRuns, 10);
      assert.equal(responseData.data.passedRuns, 8);
      assert.equal(responseData.data.failedRuns, 2);
      assert.equal(responseData.data.passRate, 80);
      assert.equal(responseData.data.autoRuns, 4);
      assert.equal(responseData.data.autoPassedRuns, 3);
      assert.equal(responseData.data.autoFailedRuns, 1);
      assert.equal(responseData.data.autoPassRate, 75);
    } finally {
      Project.countDocuments = origProjCount;
      TestCase.countDocuments = origTestCaseCount;
      Run.countDocuments = origRunCount;
    }
  });

  test('2. getRunStats handles 0 runs gracefully (0% pass rates without NaN)', async () => {
    const fakeUserId = new mongoose.Types.ObjectId();

    const origProjCount = Project.countDocuments;
    const origTestCaseCount = TestCase.countDocuments;
    const origRunCount = Run.countDocuments;

    Project.countDocuments = async () => 0;
    TestCase.countDocuments = async () => 0;
    Run.countDocuments = async () => 0;

    let responseData = null;
    let statusCode = null;

    const req = {
      user: { _id: fakeUserId },
      query: {},
    };

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    try {
      await getRunStats(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(responseData.success, true);
      assert.equal(responseData.data.totalRuns, 0);
      assert.equal(responseData.data.passRate, 0);
      assert.equal(responseData.data.autoRuns, 0);
      assert.equal(responseData.data.autoPassRate, 0);
    } finally {
      Project.countDocuments = origProjCount;
      TestCase.countDocuments = origTestCaseCount;
      Run.countDocuments = origRunCount;
    }
  });

  test('3. getRuns filters by triggerSource=auto correctly', async () => {
    const fakeUserId = new mongoose.Types.ObjectId();
    let appliedFilter = null;

    const origFind = Run.find;
    Run.find = (filter) => {
      appliedFilter = filter;
      return {
        sort() {
          return {
            limit() {
              return {
                populate() {
                  return {
                    populate() {
                      return {
                        lean: async () => [
                          {
                            _id: new mongoose.Types.ObjectId(),
                            testCase: { _id: new mongoose.Types.ObjectId(), name: 'Test 1' },
                            project: { _id: new mongoose.Types.ObjectId(), name: 'Proj 1' },
                            status: 'passed',
                            triggerSource: 'github',
                            durationMs: 1200,
                            createdAt: new Date(),
                          },
                        ],
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    };

    let responseData = null;
    let statusCode = null;

    const req = {
      user: { _id: fakeUserId },
      query: { triggerSource: 'auto' },
    };

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    try {
      await getRuns(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(responseData.success, true);
      assert.deepEqual(appliedFilter.triggerSource, { $in: ['webhook', 'github'] });
      assert.equal(responseData.count, 1);
      assert.equal(responseData.data[0].triggerSource, 'github');
    } finally {
      Run.find = origFind;
    }
  });
});
