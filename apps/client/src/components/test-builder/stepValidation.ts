import { TestStep, Locator } from '../../types';

export const validateStepLocator = (locator?: Locator): string | null => {
  if (!locator) return 'Locator is required';
  if (!locator.strategy) return 'Locator strategy is required';

  if (locator.strategy === 'role') {
    const roleVal = locator.role || locator.value;
    if (!roleVal || typeof roleVal !== 'string' || roleVal.trim().length === 0) {
      return 'Role name or value is required';
    }
  } else if (locator.strategy === 'text') {
    if (!locator.value || typeof locator.value !== 'string' || locator.value.trim().length === 0) {
      return 'Text content value is required';
    }
  } else if (locator.strategy === 'css') {
    if (!locator.value || typeof locator.value !== 'string' || locator.value.trim().length === 0) {
      return 'CSS selector value is required';
    }
  }

  return null;
};

export const getStepValidationErrors = (step: TestStep): string[] => {
  const errors: string[] = [];

  switch (step.type) {
    case 'navigate': {
      if (!step.url || typeof step.url !== 'string' || step.url.trim().length === 0) {
        errors.push('Target URL is required');
      } else {
        const urlVal = step.url.trim();
        const isValidFormat =
          urlVal.startsWith('http://') ||
          urlVal.startsWith('https://') ||
          urlVal.startsWith('{{');
        if (!isValidFormat) {
          errors.push('URL must start with http://, https://, or variable {{BASE_URL}}');
        }
      }
      break;
    }

    case 'click': {
      const locErr = validateStepLocator(step.locator);
      if (locErr) errors.push(locErr);
      break;
    }

    case 'fill': {
      const locErr = validateStepLocator(step.locator);
      if (locErr) errors.push(locErr);

      if (step.value === undefined || step.value === null || typeof step.value !== 'string' || step.value.length === 0) {
        errors.push('Input value is required');
      }
      break;
    }

    case 'assertVisible': {
      const locErr = validateStepLocator(step.locator);
      if (locErr) errors.push(locErr);
      break;
    }

    case 'assertText': {
      const locErr = validateStepLocator(step.locator);
      if (locErr) errors.push(locErr);

      const textVal = step.expectedText !== undefined ? step.expectedText : (step as any).value;
      if (textVal === undefined || textVal === null || typeof textVal !== 'string' || textVal.length === 0) {
        errors.push('Expected text content is required');
      }
      break;
    }

    case 'wait': {
      const duration = step.duration !== undefined ? step.duration : (step as any).milliseconds;
      if (
        duration === undefined ||
        typeof duration !== 'number' ||
        !Number.isInteger(duration) ||
        duration < 100 ||
        duration > 120000
      ) {
        errors.push('Duration must be an integer between 100ms and 120,000ms');
      }
      break;
    }

    case 'screenshot': {
      if (step.name !== undefined && step.name !== null && step.name.trim().length === 0) {
        errors.push('Screenshot name must not be empty');
      }
      break;
    }
  }

  return errors;
};
