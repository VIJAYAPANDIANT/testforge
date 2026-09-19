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

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
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

    if (!response.ok) {
      const errText = await response.text();
      console.error('[TestForge AI] Gemini API HTTP error:', response.status, errText);
      return {
        status: 'failed',
        errorMessage: `AI provider HTTP error ${response.status}`,
      };
    }

    const resData = await response.json();
    const candidateText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return {
        status: 'failed',
        errorMessage: 'AI provider returned empty response candidate.',
      };
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
    return {
      status: 'failed',
      errorMessage: `AI analysis failed: ${err.message}`,
    };
  }
};
