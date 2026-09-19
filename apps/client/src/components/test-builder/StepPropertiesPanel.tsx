import React from 'react';
import { TestStep, Locator } from '../../types';
import { LocatorInput } from '../test-editor/LocatorInput';
import {
  Sliders,
  Copy,
  Trash2,
  Globe,
  MousePointerClick,
  Edit3,
  Eye,
  FileText,
  Clock,
  Camera,
  Info,
} from 'lucide-react';

interface StepPropertiesPanelProps {
  step: TestStep | null;
  onChange: (updatedStep: TestStep) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const defaultLocator = (): Locator => ({
  strategy: 'role',
  role: 'button',
  name: '',
});

const getStepIcon = (type: string) => {
  switch (type) {
    case 'navigate':
      return Globe;
    case 'click':
      return MousePointerClick;
    case 'fill':
      return Edit3;
    case 'assertVisible':
      return Eye;
    case 'assertText':
      return FileText;
    case 'wait':
      return Clock;
    case 'screenshot':
      return Camera;
    default:
      return Globe;
  }
};

export const StepPropertiesPanel: React.FC<StepPropertiesPanelProps> = ({
  step,
  onChange,
  onDuplicate,
  onDelete,
}) => {
  if (!step) {
    return (
      <div className="card h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-[#111827]/90 border-slate-800 space-y-3">
        <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
          <Sliders className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Step Properties</h4>
          <p className="text-xs text-slate-500 max-w-[220px]">
            Select a step on the canvas to edit its properties and locator configuration.
          </p>
        </div>
      </div>
    );
  }

  const Icon = getStepIcon(step.type);

  const handleFieldChange = (field: string, value: any) => {
    onChange({
      ...step,
      [field]: value,
    } as TestStep);
  };

  const handleLocatorChange = (updatedLocator: Locator) => {
    onChange({
      ...step,
      locator: updatedLocator,
    } as TestStep);
  };

  return (
    <div className="card space-y-5 p-4 h-full flex flex-col bg-[#111827]/90 border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 capitalize">
              {step.type} Properties
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              ID: {step.id}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 text-xs text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors flex items-center space-x-1"
            title="Duplicate Step"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors flex items-center space-x-1"
            title="Delete Step"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Form Fields Scroll Container */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {/* Step 1: Navigate */}
        {step.type === 'navigate' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Target URL *
            </label>
            <input
              type="text"
              value={step.url || ''}
              onChange={(e) => handleFieldChange('url', e.target.value)}
              placeholder="https://example.com or {{BASE_URL}}/login"
              className="input-field text-xs py-2"
              required
            />
            <p className="text-[11px] text-slate-500 flex items-start space-x-1 pt-1">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
              <span>
                Enter full URL (<code className="text-slate-300">http://</code> / <code className="text-slate-300">https://</code>) or placeholder like <code className="text-blue-400">{"{{BASE_URL}}"}</code>.
              </span>
            </p>
          </div>
        )}

        {/* Step 2: Click */}
        {step.type === 'click' && (
          <LocatorInput
            locator={step.locator || defaultLocator()}
            onChange={handleLocatorChange}
            label="Target Element Locator"
          />
        )}

        {/* Step 3: Fill */}
        {step.type === 'fill' && (
          <div className="space-y-4">
            <LocatorInput
              locator={step.locator || defaultLocator()}
              onChange={handleLocatorChange}
              label="Target Input Locator"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Input Value *
              </label>
              <input
                type="text"
                value={step.value !== undefined ? step.value : ''}
                onChange={(e) => handleFieldChange('value', e.target.value)}
                placeholder="e.g. test@example.com"
                className="input-field text-xs py-2"
                required
              />
            </div>
          </div>
        )}

        {/* Step 4: Assert Visible */}
        {step.type === 'assertVisible' && (
          <LocatorInput
            locator={step.locator || defaultLocator()}
            onChange={handleLocatorChange}
            label="Element Locator to Assert Visible"
          />
        )}

        {/* Step 5: Assert Text */}
        {step.type === 'assertText' && (
          <div className="space-y-4">
            <LocatorInput
              locator={step.locator || defaultLocator()}
              onChange={handleLocatorChange}
              label="Target Element Locator"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Expected Text Content *
              </label>
              <input
                type="text"
                value={step.expectedText !== undefined ? step.expectedText : (step as any).value || ''}
                onChange={(e) => {
                  handleFieldChange('expectedText', e.target.value);
                  handleFieldChange('value', e.target.value);
                }}
                placeholder="e.g. Welcome Back, User!"
                className="input-field text-xs py-2"
                required
              />
            </div>
          </div>
        )}

        {/* Step 6: Wait */}
        {step.type === 'wait' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Duration (milliseconds) *
            </label>
            <input
              type="number"
              min={100}
              max={120000}
              step={100}
              value={step.duration || 1000}
              onChange={(e) => handleFieldChange('duration', parseInt(e.target.value, 10) || 1000)}
              className="input-field text-xs py-2"
              required
            />
            <p className="text-[11px] text-slate-500">
              Enter delay between 100ms and 120,000ms.
            </p>
          </div>
        )}

        {/* Step 7: Screenshot */}
        {step.type === 'screenshot' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Screenshot File Name
              </label>
              <input
                type="text"
                value={step.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="e.g. login-screen"
                className="input-field text-xs py-2"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="panelFullPage"
                checked={!!step.fullPage}
                onChange={(e) => handleFieldChange('fullPage', e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="panelFullPage" className="text-xs font-medium text-slate-300 cursor-pointer">
                Capture Full Page Screenshot
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={onDuplicate}
          className="btn-secondary text-xs flex items-center space-x-1.5 py-1.5 px-2.5"
        >
          <Copy className="w-3.5 h-3.5 text-blue-400" />
          <span>Duplicate</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="btn-secondary text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30 flex items-center space-x-1.5 py-1.5 px-2.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Step</span>
        </button>
      </div>
    </div>
  );
};
