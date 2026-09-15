import React, { useState, useEffect } from 'react';
import { TestStep, StepType, Locator } from '../../types';
import { LocatorInput } from './LocatorInput';
import { validateTestDsl } from '@testforge/dsl-schema';
import { X, AlertCircle, Save } from 'lucide-react';

interface StepFormModalProps {
  isOpen: boolean;
  step: TestStep | null;
  onSave: (updatedStep: TestStep) => void;
  onClose: () => void;
}

const defaultLocator = (): Locator => ({
  strategy: 'role',
  role: 'button',
  name: '',
});

export const StepFormModal: React.FC<StepFormModalProps> = ({
  isOpen,
  step,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step) {
      setFormData(JSON.parse(JSON.stringify(step)));
      setError(null);
    }
  }, [step]);

  if (!isOpen || !formData) return null;

  const type: StepType = formData.type;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocatorChange = (updatedLocator: Locator) => {
    setFormData((prev: any) => ({
      ...prev,
      locator: updatedLocator,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate dummy wrapper DSL using schema validator
    const dummyDsl = {
      version: '1.0',
      name: 'Validation Wrapper Test',
      steps: [formData],
    };

    const validation = validateTestDsl(dummyDsl);
    if (!validation.success && validation.errors && validation.errors.length > 0) {
      const msg = validation.errors.map((err: { path?: string; message: string }) => err.message).join('; ');
      setError(msg);
      return;
    }

    onSave(formData as TestStep);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 capitalize">
              Configure {type} Step
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Step ID: <code className="text-blue-400 font-mono">{formData.id}</code>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Navigate */}
          {type === 'navigate' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Target URL *
              </label>
              <input
                type="text"
                value={formData.url || ''}
                onChange={(e) => handleFieldChange('url', e.target.value)}
                placeholder="https://example.com or {{BASE_URL}}/login"
                required
                className="input-field"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Must start with <code className="text-slate-300">http://</code>, <code className="text-slate-300">https://</code>, or variable placeholder like <code className="text-blue-400">{"{{BASE_URL}}"}</code>.
              </p>
            </div>
          )}

          {/* Step 2: Click */}
          {type === 'click' && (
            <LocatorInput
              locator={formData.locator || defaultLocator()}
              onChange={handleLocatorChange}
              label="Target Element Locator"
            />
          )}

          {/* Step 3: Fill */}
          {type === 'fill' && (
            <>
              <LocatorInput
                locator={formData.locator || defaultLocator()}
                onChange={handleLocatorChange}
                label="Target Input Field Locator"
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Input Value *
                </label>
                <input
                  type="text"
                  value={formData.value !== undefined ? formData.value : ''}
                  onChange={(e) => handleFieldChange('value', e.target.value)}
                  placeholder="e.g. test@example.com"
                  required
                  className="input-field"
                />
              </div>
            </>
          )}

          {/* Step 4: Assert Visible */}
          {type === 'assertVisible' && (
            <LocatorInput
              locator={formData.locator || defaultLocator()}
              onChange={handleLocatorChange}
              label="Element Locator to Assert Visible"
            />
          )}

          {/* Step 5: Assert Text */}
          {type === 'assertText' && (
            <>
              <LocatorInput
                locator={formData.locator || defaultLocator()}
                onChange={handleLocatorChange}
                label="Target Element Locator"
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Expected Text Content *
                </label>
                <input
                  type="text"
                  value={formData.expectedText !== undefined ? formData.expectedText : (formData.value || '')}
                  onChange={(e) => {
                    handleFieldChange('expectedText', e.target.value);
                    handleFieldChange('value', e.target.value);
                  }}
                  placeholder="e.g. Welcome Back, User!"
                  required
                  className="input-field"
                />
              </div>
            </>
          )}

          {/* Step 6: Wait */}
          {type === 'wait' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Duration (milliseconds) *
              </label>
              <input
                type="number"
                min={100}
                max={120000}
                step={100}
                value={formData.duration || 1000}
                onChange={(e) => handleFieldChange('duration', parseInt(e.target.value, 10) || 1000)}
                required
                className="input-field"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Enter an integer between 100ms and 120,000ms (120 seconds).
              </p>
            </div>
          )}

          {/* Step 7: Screenshot */}
          {type === 'screenshot' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Screenshot File Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g. login-page"
                  className="input-field"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="fullPage"
                  checked={!!formData.fullPage}
                  onChange={(e) => handleFieldChange('fullPage', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="fullPage" className="text-xs font-medium text-slate-300 cursor-pointer">
                  Capture Full Page Screenshot
                </label>
              </div>
            </>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs flex items-center space-x-1.5">
              <Save className="w-3.5 h-3.5" />
              <span>Apply Step</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
