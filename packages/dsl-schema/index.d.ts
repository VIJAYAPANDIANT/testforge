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
  value: string;
  name?: string;
}

export interface BaseStep {
  id: string;
  type: StepType;
  timeout?: number;
}

export interface NavigateStep extends BaseStep {
  type: 'navigate';
  url: string;
}

export interface ClickStep extends BaseStep {
  type: 'click';
  locator: Locator;
  fallbackLocator?: Locator;
}

export interface FillStep extends BaseStep {
  type: 'fill';
  locator: Locator;
  value: string;
  fallbackLocator?: Locator;
}

export interface AssertVisibleStep extends BaseStep {
  type: 'assertVisible';
  locator: Locator;
  fallbackLocator?: Locator;
}

export interface AssertTextStep extends BaseStep {
  type: 'assertText';
  locator: Locator;
  expectedText: string;
  fallbackLocator?: Locator;
}

export interface WaitStep extends BaseStep {
  type: 'wait';
  duration: number;
}

export interface ScreenshotStep extends BaseStep {
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
  version: '1.0';
  name: string;
  description?: string;
  steps: TestStep[];
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationSuccessResult {
  success: true;
  data: TestDsl;
}

export interface ValidationFailureResult {
  success: false;
  errors: ValidationError[];
}

export type ValidationResult = ValidationSuccessResult | ValidationFailureResult;

export declare const DSL_VERSION: string;
export declare const STEP_TYPES: StepType[];
export declare const LOCATOR_STRATEGIES: LocatorStrategy[];

export declare function validateTestDsl(dsl: any): ValidationResult;
