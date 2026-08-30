import { DSL_VERSION, STEP_TYPES, LOCATOR_STRATEGIES } from './constants.js';

/**
 * Helper to check if a value is a valid non-array object.
 */
const isObject = (val) => typeof val === 'object' && val !== null && !Array.isArray(val);

/**
 * Helper to validate a locator object.
 */
const validateLocator = (locator, path, errors, isFallback = false, primaryLocator = null) => {
  if (!isObject(locator)) {
    errors.push({
      path,
      message: `${isFallback ? 'Fallback locator' : 'Locator'} must be an object`,
    });
    return;
  }

  // Strategy validation
  if (!locator.strategy || typeof locator.strategy !== 'string') {
    errors.push({
      path: `${path}.strategy`,
      message: 'Locator strategy is required',
    });
  } else if (!LOCATOR_STRATEGIES.includes(locator.strategy)) {
    errors.push({
      path: `${path}.strategy`,
      message: `Invalid locator strategy '${locator.strategy}'. Supported strategies are: ${LOCATOR_STRATEGIES.join(', ')}`,
    });
  }

  // Value validation
  if (typeof locator.value !== 'string' || locator.value.trim().length === 0) {
    errors.push({
      path: `${path}.value`,
      message: 'Locator value is required and must not be empty',
    });
  } else if (locator.value.trim().length > 500) {
    errors.push({
      path: `${path}.value`,
      message: 'Locator value must not exceed 500 characters',
    });
  }

  // Name validation (optional)
  if (locator.name !== undefined && locator.name !== null) {
    if (typeof locator.name !== 'string') {
      errors.push({
        path: `${path}.name`,
        message: 'Locator name must be a string',
      });
    } else if (locator.name.trim().length > 500) {
      errors.push({
        path: `${path}.name`,
        message: 'Locator name must not exceed 500 characters',
      });
    }
  }

  // Fallback identical check
  if (isFallback && primaryLocator && isObject(primaryLocator)) {
    const isIdentical =
      locator.strategy === primaryLocator.strategy &&
      locator.value === primaryLocator.value &&
      (locator.name ?? '') === (primaryLocator.name ?? '');

    if (isIdentical) {
      errors.push({
        path,
        message: 'Fallback locator must not be identical to the primary locator',
      });
    }
  }
};

/**
 * Validates a TestForge DSL JSON object against the formal Week 2 specification.
 *
 * @param {any} dsl - The DSL payload to validate.
 * @returns {{ success: boolean, data?: object, errors?: Array<{ path: string, message: string }> }}
 */
export const validateTestDsl = (dsl) => {
  const errors = [];

  if (!isObject(dsl)) {
    return {
      success: false,
      errors: [
        {
          path: '',
          message: 'DSL must be a valid JSON object',
        },
      ],
    };
  }

  // 1. Root Version
  if (!dsl.version || typeof dsl.version !== 'string') {
    errors.push({
      path: 'version',
      message: 'DSL version is required',
    });
  } else if (dsl.version !== DSL_VERSION) {
    errors.push({
      path: 'version',
      message: `Unsupported DSL version '${dsl.version}'. Must equal '${DSL_VERSION}'`,
    });
  }

  // 2. Root Name
  if (!dsl.name || typeof dsl.name !== 'string' || dsl.name.trim().length === 0) {
    errors.push({
      path: 'name',
      message: 'Test name is required',
    });
  } else if (dsl.name.trim().length < 2) {
    errors.push({
      path: 'name',
      message: 'Test name must be at least 2 characters',
    });
  } else if (dsl.name.trim().length > 150) {
    errors.push({
      path: 'name',
      message: 'Test name must not exceed 150 characters',
    });
  }

  // 3. Root Description (optional)
  if (dsl.description !== undefined && dsl.description !== null) {
    if (typeof dsl.description !== 'string') {
      errors.push({
        path: 'description',
        message: 'Test description must be a string',
      });
    } else if (dsl.description.trim().length > 1000) {
      errors.push({
        path: 'description',
        message: 'Test description must not exceed 1000 characters',
      });
    }
  }

  // 4. Root Steps Array
  if (!Array.isArray(dsl.steps)) {
    errors.push({
      path: 'steps',
      message: 'Steps must be an array',
    });
    return { success: false, errors };
  }

  if (dsl.steps.length === 0) {
    errors.push({
      path: 'steps',
      message: 'Steps array must contain at least 1 step',
    });
  } else if (dsl.steps.length > 100) {
    errors.push({
      path: 'steps',
      message: 'Steps array must not exceed 100 steps',
    });
  }

  // 5. Track Step IDs for Uniqueness
  const seenStepIds = new Set();

  dsl.steps.forEach((step, index) => {
    const stepPath = `steps[${index}]`;

    if (!isObject(step)) {
      errors.push({
        path: stepPath,
        message: 'Step must be an object',
      });
      return;
    }

    // Step ID
    if (!step.id || typeof step.id !== 'string' || step.id.trim().length === 0) {
      errors.push({
        path: `${stepPath}.id`,
        message: 'Step ID is required and must not be empty',
      });
    } else {
      const trimmedId = step.id.trim();
      if (trimmedId.length > 100) {
        errors.push({
          path: `${stepPath}.id`,
          message: 'Step ID must not exceed 100 characters',
        });
      }
      if (seenStepIds.has(trimmedId)) {
        errors.push({
          path: `${stepPath}.id`,
          message: `Duplicate step ID '${trimmedId}'`,
        });
      } else {
        seenStepIds.add(trimmedId);
      }
    }

    // Step Type
    if (!step.type || typeof step.type !== 'string') {
      errors.push({
        path: `${stepPath}.type`,
        message: 'Step type is required',
      });
      return;
    }

    if (!STEP_TYPES.includes(step.type)) {
      errors.push({
        path: `${stepPath}.type`,
        message: `Unsupported step type: ${step.type}. Supported types are: ${STEP_TYPES.join(', ')}`,
      });
      return;
    }

    // Common optional Timeout (except for wait step)
    if (step.timeout !== undefined && step.timeout !== null) {
      if (typeof step.timeout !== 'number' || !Number.isInteger(step.timeout) || step.timeout < 1 || step.timeout > 120000) {
        errors.push({
          path: `${stepPath}.timeout`,
          message: 'Timeout must be an integer between 1 and 120000 milliseconds',
        });
      }
    }

    // Discriminated Step Type Validation
    switch (step.type) {
      case 'navigate': {
        if (!step.url || typeof step.url !== 'string' || step.url.trim().length === 0) {
          errors.push({
            path: `${stepPath}.url`,
            message: 'URL is required',
          });
        } else {
          const urlVal = step.url.trim();
          const isValidUrlFormat =
            urlVal.startsWith('http://') ||
            urlVal.startsWith('https://') ||
            urlVal.startsWith('{{');

          if (!isValidUrlFormat) {
            errors.push({
              path: `${stepPath}.url`,
              message: 'URL must start with http://, https://, or a variable placeholder like {{BASE_URL}}',
            });
          }
        }
        break;
      }

      case 'click': {
        if (!step.locator) {
          errors.push({
            path: `${stepPath}.locator`,
            message: 'Locator is required for click step',
          });
        } else {
          validateLocator(step.locator, `${stepPath}.locator`, errors);
        }

        if (step.fallbackLocator) {
          validateLocator(step.fallbackLocator, `${stepPath}.fallbackLocator`, errors, true, step.locator);
        }
        break;
      }

      case 'fill': {
        if (!step.locator) {
          errors.push({
            path: `${stepPath}.locator`,
            message: 'Locator is required for fill step',
          });
        } else {
          validateLocator(step.locator, `${stepPath}.locator`, errors);
        }

        if (step.value === undefined || step.value === null || typeof step.value !== 'string') {
          errors.push({
            path: `${stepPath}.value`,
            message: 'Fill value is required and must be a string',
          });
        } else if (step.value.length > 10000) {
          errors.push({
            path: `${stepPath}.value`,
            message: 'Fill value must not exceed 10000 characters',
          });
        }

        if (step.fallbackLocator) {
          validateLocator(step.fallbackLocator, `${stepPath}.fallbackLocator`, errors, true, step.locator);
        }
        break;
      }

      case 'assertVisible': {
        if (!step.locator) {
          errors.push({
            path: `${stepPath}.locator`,
            message: 'Locator is required for assertVisible step',
          });
        } else {
          validateLocator(step.locator, `${stepPath}.locator`, errors);
        }

        if (step.fallbackLocator) {
          validateLocator(step.fallbackLocator, `${stepPath}.fallbackLocator`, errors, true, step.locator);
        }
        break;
      }

      case 'assertText': {
        if (!step.locator) {
          errors.push({
            path: `${stepPath}.locator`,
            message: 'Locator is required for assertText step',
          });
        } else {
          validateLocator(step.locator, `${stepPath}.locator`, errors);
        }

        if (step.expectedText === undefined || step.expectedText === null || typeof step.expectedText !== 'string') {
          errors.push({
            path: `${stepPath}.expectedText`,
            message: 'Expected text is required and must be a string',
          });
        } else if (step.expectedText.length > 10000) {
          errors.push({
            path: `${stepPath}.expectedText`,
            message: 'Expected text must not exceed 10000 characters',
          });
        }

        if (step.fallbackLocator) {
          validateLocator(step.fallbackLocator, `${stepPath}.fallbackLocator`, errors, true, step.locator);
        }
        break;
      }

      case 'wait': {
        if (
          step.duration === undefined ||
          typeof step.duration !== 'number' ||
          !Number.isInteger(step.duration) ||
          step.duration < 100 ||
          step.duration > 120000
        ) {
          errors.push({
            path: `${stepPath}.duration`,
            message: 'Wait duration is required and must be an integer between 100 and 120000 milliseconds',
          });
        }
        break;
      }

      case 'screenshot': {
        if (step.name !== undefined && step.name !== null) {
          if (typeof step.name !== 'string' || step.name.trim().length === 0) {
            errors.push({
              path: `${stepPath}.name`,
              message: 'Screenshot name must be a non-empty string',
            });
          } else if (step.name.trim().length > 100) {
            errors.push({
              path: `${stepPath}.name`,
              message: 'Screenshot name must not exceed 100 characters',
            });
          }
        }

        if (step.fullPage !== undefined && typeof step.fullPage !== 'boolean') {
          errors.push({
            path: `${stepPath}.fullPage`,
            message: 'fullPage must be a boolean',
          });
        }
        break;
      }
    }
  });

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: dsl,
  };
};
