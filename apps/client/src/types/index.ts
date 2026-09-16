export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type StepType =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'assertVisible'
  | 'assertText'
  | 'wait'
  | 'screenshot';

export type LocatorStrategy = 'role' | 'text' | 'css';

export interface Locator {
  strategy: LocatorStrategy;
  value?: string;
  role?: string;
  name?: string;
  fallback?: Locator;
  fallbackLocator?: Locator;
}

export interface NavigateStep {
  id: string;
  type: 'navigate';
  url: string;
  timeout?: number;
}

export interface ClickStep {
  id: string;
  type: 'click';
  locator: Locator;
  fallbackLocator?: Locator;
  timeout?: number;
}

export interface FillStep {
  id: string;
  type: 'fill';
  locator: Locator;
  value: string;
  fallbackLocator?: Locator;
  timeout?: number;
}

export interface AssertVisibleStep {
  id: string;
  type: 'assertVisible';
  locator: Locator;
  fallbackLocator?: Locator;
  timeout?: number;
}

export interface AssertTextStep {
  id: string;
  type: 'assertText';
  locator: Locator;
  expectedText: string;
  fallbackLocator?: Locator;
  timeout?: number;
}

export interface WaitStep {
  id: string;
  type: 'wait';
  duration: number;
}

export interface ScreenshotStep {
  id: string;
  type: 'screenshot';
  name?: string;
  fullPage?: boolean;
}

export type TestStep =
  | NavigateStep
  | ClickStep
  | FillStep
  | AssertVisibleStep
  | AssertTextStep
  | WaitStep
  | ScreenshotStep;

export interface TestDsl {
  version: string;
  name: string;
  description?: string;
  steps: TestStep[];
}

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  dsl?: TestDsl;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  count?: number;
  data?: T;
  errors?: string[] | any[];
}

// ─── Day 19 Execution & Socket Types ─────────────────────────────────────────

export type RunStatus = 'idle' | 'queued' | 'running' | 'passed' | 'failed';

export type StepExecutionStatus = 'pending' | 'running' | 'passed' | 'failed';

export interface StepExecutionState {
  stepIndex: number;
  stepType: StepType;
  status: StepExecutionStatus;
  error?: string;
  durationMs?: number;
}

export interface LiveRunState {
  runId: string | null;
  status: RunStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  screenshotPath?: string | null;
  steps: StepExecutionState[];
}

export interface SocketStepEventPayload {
  runId: string;
  stepIndex: number;
  stepType: StepType;
  status: StepExecutionStatus;
  error?: string;
}

export interface SocketRunEventPayload {
  runId: string;
  status: RunStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  screenshotPath?: string | null;
}

// ─── Day 20 Run History & Detail Types ───────────────────────────────────────

export interface RunItem {
  id: string;
  testCaseId: string;
  testCaseName?: string;
  projectId: string;
  projectName?: string;
  status: RunStatus;
  durationMs: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  exitCode?: number | null;
  screenshotPath?: string | null;
}

export interface RunStepResult {
  stepIndex: number;
  stepType: StepType;
  status: 'passed' | 'failed' | 'pending';
  error?: string;
  durationMs?: number;
}

export interface RunDetailResult {
  _id?: string;
  id?: string;
  run: string;
  status: 'passed' | 'failed';
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
  screenshotPath?: string | null;
  durationMs: number;
  stepResults: RunStepResult[];
  createdAt: string;
}

export interface RunDetailData {
  run: {
    _id?: string;
    id?: string;
    testCase?: { _id?: string; id?: string; name: string; dsl?: TestDsl } | string;
    project?: { _id?: string; id?: string; name: string } | string;
    status: RunStatus;
    durationMs: number;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
    exitCode?: number | null;
    stdout?: string;
    stderr?: string;
    screenshotPath?: string | null;
  };
  result: RunDetailResult | null;
}
