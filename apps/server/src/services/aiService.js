/**
 * Day 29 — AI Failure Analysis Service
 *
 * Provides secure server-side failure analysis using Google Gemini AI.
 * Sanitizes sensitive information (passwords, JWTs, API keys, secrets)
 * before invoking the AI API. Returns structured failure analysis.
 */

/**
 * Sanitizes text or object fields by redacting sensitive values.
 */
export const sanitizeValue = (val) => {
  if (val === null || val === undefined) return val;

  if (typeof val === 'string') {
    let sanitized = val;

    // Redact JWT tokens (eyJ...)
    sanitized = sanitized.replace(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, '<REDACTED_JWT>');

    // Redact Authorization headers
    sanitized = sanitized.replace(/Authorization:\s*Bearer\s+[^\s"'\n]+/gi, 'Authorization: Bearer <REDACTED>');
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9-._~+/=]+/gi, 'Bearer <REDACTED>');

    // Redact password parameters (password=..., "password": "...")
    sanitized = sanitized.replace(/(password|passwd|pwd|secret|apiKey|api_key|token|jwt|webhookSecret)=["']?[^"'\s&,\n]+["']?/gi, '$1=<REDACTED>');
    sanitized = sanitized.replace(/["'](password|passwd|pwd|secret|apiKey|api_key|token|jwt|webhookSecret)["']\s*:\s*["'][^"']+["']/gi, '"$1": "<REDACTED>"');

    // Redact common API key patterns (AIza..., sk-...)
    sanitized = sanitized.replace(/AIzaSy[A-Za-z0-9-_]{35}/g, '<REDACTED_API_KEY>');
    sanitized = sanitized.replace(/sk-[A-Za-z0-9]{32,}/g, '<REDACTED_API_KEY>');

    return sanitized;
  }

  if (Array.isArray(val)) {
    return val.map((item) => sanitizeValue(item));
  }

  if (typeof val === 'object') {
    const cleanObj = {};
    for (const [key, value] of Object.entries(val)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('apikey') ||
        lowerKey.includes('auth') ||
        lowerKey.includes('jwt')
      ) {
        cleanObj[key] = '<REDACTED>';
      } else {
        cleanObj[key] = sanitizeValue(value);
      }
    }
    return cleanObj;
  }

  return val;
};

/**
 * Sanitizes the complete failure context prior to AI transmission.
 */
export const sanitizeFailureContext = (context) => {
  return sanitizeValue(context);
};

/**
 * Analyzes a test execution failure using Gemini AI provider.
 *
 * @param {Object} rawFailureContext - Structured failure evidence from Run & RunResult
 * @returns {Promise<Object>} Formatted failure analysis object with status
 */
/**
 * Deterministic Playwright heuristic analysis engine.
 * Evaluates execution logs, step types, locators, and failure traces to produce
 * a structured failure analysis when AI is unavailable or as a fast baseline.
 */
export const generatePlaywrightHeuristicAnalysis = (context) => {
  const errorMsg = (context.errorMessage || context.stderr || '').toString();
  const stepType = context.failedStepType || 'action';
  const stepIndex = context.failedStepIndex !== null && context.failedStepIndex !== undefined
    ? context.failedStepIndex + 1
    : null;
  const stepDesc = stepIndex ? `Step ${stepIndex} (${stepType})` : `Failed step (${stepType})`;

  let summary = `Test execution failed during ${stepDesc}.`;
  let likelyCause = 'An unexpected browser execution error occurred.';
  let observedError = errorMsg.split('\n')[0] || 'Unknown execution error';
  const evidence = [];
  const suggestedInvestigation = [];
  const possibleFix = [];

  if (stepIndex) {
    evidence.push(`Execution stopped at Step ${stepIndex} (${stepType})`);
  }
  if (context.testCaseName) {
    evidence.push(`Test case: "${context.testCaseName}"`);
  }

  // Case 1: Locator Timeout
  if (/timeout.*exceeded/i.test(errorMsg) || /waiting for locator/i.test(errorMsg)) {
    likelyCause = 'Element was not found or did not become actionable within the allotted timeout.';
    summary = `${stepDesc} timed out waiting for the target element to appear or become actionable.`;
    suggestedInvestigation.push('Check whether the element selector matches an existing element in the DOM.');
    suggestedInvestigation.push('Verify if the element requires a previous user action or page transition to appear.');
    suggestedInvestigation.push('Inspect network requests to ensure preceding API responses or assets loaded.');
    possibleFix.push('Update the locator to a more stable selector (e.g. data-testid, role, or unique text).');
    possibleFix.push('Increase the step timeout or add an explicit wait/assertion before interacting.');
  }
  // Case 2: Strict Mode Violation (multiple elements match)
  else if (/strict mode violation/i.test(errorMsg) || /resolved to \d+ elements/i.test(errorMsg)) {
    likelyCause = 'Locator matched multiple DOM elements, violating Playwright strict mode.';
    summary = `${stepDesc} failed because the selector resolved to multiple elements instead of a unique one.`;
    suggestedInvestigation.push('Identify all DOM elements that share the current selector.');
    suggestedInvestigation.push('Check if dynamic elements (e.g., list items or duplicate buttons) share the same class or text.');
    possibleFix.push('Refine the locator to be unique (e.g., scope by parent container, index, or unique attribute).');
  }
  // Case 3: Assertion / Expect failure
  else if (/expect\(.*\)/i.test(errorMsg) || /assertion/i.test(errorMsg) || /toHaveText/i.test(errorMsg) || /toBeVisible/i.test(errorMsg)) {
    likelyCause = 'Assertion failed because the observed element state or text did not match expected value.';
    summary = `Assertion check failed at ${stepDesc}.`;
    suggestedInvestigation.push('Compare expected text or visibility against the actual DOM content rendered in the browser.');
    suggestedInvestigation.push('Inspect any recent application changes or dynamic data that may have altered the content.');
    possibleFix.push('Update expected assertion value if the application requirements or copy have changed.');
    possibleFix.push('Ensure asynchronous content finishes rendering before the assertion runs.');
  }
  // Case 4: Navigation / Network error
  else if (/net::ERR_/i.test(errorMsg) || /navigation/i.test(errorMsg) || /failed to load/i.test(errorMsg)) {
    likelyCause = 'Browser failed to navigate to the target URL or the server was unreachable.';
    summary = `Page navigation failed during ${stepDesc}.`;
    suggestedInvestigation.push('Verify that the target server / URL is online and reachable from the test runner.');
    suggestedInvestigation.push('Check for CORS, SSL certificate errors, or network firewall blocks.');
    possibleFix.push('Confirm base URL and route path in environment configuration.');
    possibleFix.push('Ensure the web application is running before triggering automated tests.');
  }
  // Generic fallback
  else {
    suggestedInvestigation.push('Review the step details and verify the selector against the live DOM.');
    suggestedInvestigation.push('Check browser console logs and worker execution stderr for additional clues.');
    possibleFix.push('Verify locator stability and element visibility.');
  }

  if (context.screenshotAvailable) {
    evidence.push('Failure screenshot captured and available in the run details view.');
  }
  if (context.exitCode !== null && context.exitCode !== undefined) {
    evidence.push(`Worker process exited with code ${context.exitCode}`);
  }

  return {
    status: 'completed',
    summary,
    failedStep: stepDesc,
    observedError: observedError.length > 300 ? observedError.substring(0, 300) + '...' : observedError,
    likelyCause,
    evidence,
    suggestedInvestigation,
    possibleFix,
    uncertainty: 'Analysis generated using Playwright heuristic diagnostic engine based on execution logs.',
    analyzedAt: new Date(),
    errorMessage: null,
  };
};

/**
 * Analyzes a test execution failure using Gemini AI provider.
 * Falls back to Playwright Heuristic Diagnostic Engine if AI provider is temporarily unavailable.
 *
 * @param {Object} rawFailureContext - Structured failure evidence from Run & RunResult
 * @returns {Promise<Object>} Formatted failure analysis object with status
 */
export const analyzeTestFailure = async (rawFailureContext) => {
  const sanitizedContext = sanitizeFailureContext(rawFailureContext);

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim().length === 0) {
    return {
      status: 'failed',
      errorMessage: 'AI service unavailable: GEMINI_API_KEY environment variable is missing or not configured.',
    };
  }

  const systemInstruction = `You are a senior software QA test automation engineer and debugging assistant for TestForge.
Analyze the provided test execution failure evidence.
RULES:
1. You must NOT suggest or perform automated code/locator changes, code commits, or test reruns.
2. Analyze ONLY the supplied evidence. Do NOT invent unstated details or claim absolute certainty if evidence is incomplete.
3. Respond ONLY in valid JSON matching this schema:
{
  "summary": "Clear concise 1-2 sentence overview of what failed",
  "failedStep": "Step number, step type, and description of the failed step",
  "observedError": "Exact error message or assertion failure observed",
  "likelyCause": "Likely technical cause based on evidence",
  "evidence": ["Key evidence point 1", "Key evidence point 2"],
  "suggestedInvestigation": ["Actionable investigation step 1", "Actionable investigation step 2"],
  "possibleFix": ["Suggested fix step 1", "Suggested fix step 2"],
  "uncertainty": "Any ambiguity or missing evidence explanation"
}`;

  const userPrompt = `Failure Evidence to Analyze:\n${JSON.stringify(sanitizedContext, null, 2)}`;

  const callGeminiApi = async (model) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });
  };

  try {
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    let response = await callGeminiApi(primaryModel);

    // If primary model returns 404, gracefully fallback to gemini-1.5-flash
    if (response.status === 404 && primaryModel !== 'gemini-1.5-flash') {
      console.warn(`[TestForge AI] Model ${primaryModel} returned 404, retrying with gemini-1.5-flash...`);
      response = await callGeminiApi('gemini-1.5-flash');
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('[TestForge AI] Gemini API HTTP error:', response.status, errText);
      // Fallback to heuristic diagnostic engine with fallback disclosure
      const fallbackAnalysis = generatePlaywrightHeuristicAnalysis(sanitizedContext);
      fallbackAnalysis.uncertainty = `AI service returned HTTP ${response.status}. Displaying Playwright heuristic diagnostic analysis.`;
      return fallbackAnalysis;
    }

    const resData = await response.json();
    const candidateText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      const fallbackAnalysis = generatePlaywrightHeuristicAnalysis(sanitizedContext);
      fallbackAnalysis.uncertainty = 'AI returned empty response. Displaying Playwright heuristic diagnostic analysis.';
      return fallbackAnalysis;
    }

    // Clean backtick fences if returned
    const cleanedText = candidateText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleanedText);

    return {
      status: 'completed',
      summary: parsed.summary || 'Test execution failed during browser step evaluation.',
      failedStep: parsed.failedStep || 'Unknown step',
      observedError: parsed.observedError || 'Assertion or locator error',
      likelyCause: parsed.likelyCause || 'Target element not found or timeout exceeded.',
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [parsed.evidence || 'Step execution failed'],
      suggestedInvestigation: Array.isArray(parsed.suggestedInvestigation)
        ? parsed.suggestedInvestigation
        : [parsed.suggestedInvestigation || 'Verify element locator'],
      possibleFix: Array.isArray(parsed.possibleFix)
        ? parsed.possibleFix
        : [parsed.possibleFix || 'Check UI state and locator correctness'],
      uncertainty: parsed.uncertainty || 'Evidence is limited to worker execution logs.',
      analyzedAt: new Date(),
      errorMessage: null,
    };
  } catch (err) {
    console.error('[TestForge AI] Failed to process AI failure analysis:', err.message);
    const fallbackAnalysis = generatePlaywrightHeuristicAnalysis(sanitizedContext);
    fallbackAnalysis.uncertainty = `AI analysis encountered an error (${err.message}). Displaying Playwright heuristic diagnostic analysis.`;
    return fallbackAnalysis;
  }
};
