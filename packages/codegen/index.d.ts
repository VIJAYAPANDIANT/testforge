import { Locator, TestStep } from '@testforge/dsl-schema';

export declare function toTsString(val: string): string;
export declare function formatUrlExpression(url: string): string;
export declare function sanitizeScreenshotFilename(name?: string, stepId?: string): string;

export declare function generateLocator(locator: Locator): string;
export declare function generateNavigate(step: TestStep): string;
export declare function generateClick(step: TestStep): string;
export declare function generateFill(step: TestStep): string;
export declare function generateAssertVisible(step: TestStep): string;
export declare function generateAssertText(step: TestStep): string;
export declare function generateWait(step: TestStep): string;
export declare function generateScreenshot(step: TestStep): string;

export declare function generateStep(step: TestStep): string;
export declare function generateSteps(input: TestStep[] | { steps: TestStep[] }): string;
