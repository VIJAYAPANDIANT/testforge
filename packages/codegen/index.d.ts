import { Locator, TestDsl, TestStep } from '@testforge/dsl-schema';

export declare function toTsString(val: string): string;
export declare function formatUrlExpression(url: string): string;
export declare function sanitizeScreenshotFilename(name?: string, stepId?: string): string;

export declare function generateSingleLocator(locator: Locator | any, isFallback?: boolean): string;
export declare function generateLocator(locator: Locator | any): string;
export declare function generateNavigate(step: TestStep | any): string;
export declare function generateClick(step: TestStep | any): string;
export declare function generateFill(step: TestStep | any): string;
export declare function generateAssertVisible(step: TestStep | any): string;
export declare function generateAssertText(step: TestStep | any): string;
export declare function generateWait(step: TestStep | any): string;
export declare function generateScreenshot(step: TestStep | any): string;

export declare function generateStep(step: TestStep | any): string;
export declare function generateSteps(input: TestStep[] | { steps: TestStep[] } | any): string;

export declare function dslToPlaywrightScript(dsl: TestDsl | any): string;
export declare function writePlaywrightTestFile(dsl: TestDsl | any, outputPath: string): string;
