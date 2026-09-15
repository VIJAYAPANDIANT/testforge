import React, { useState, useEffect } from 'react';
import { TestStep, StepType, TestDsl } from '../../types';
import { TestStepCard } from './TestStepCard';
import { StepTypeSelectorModal } from './StepTypeSelectorModal';
import { StepFormModal } from './StepFormModal';
import { ConfirmModal } from '../ConfirmModal';
import { validateTestDsl } from '@testforge/dsl-schema';
import { testCaseService } from '../../services/testCaseService';
import {
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react';

interface TestStepEditorProps {
  testCaseId: string;
  testCaseName: string;
  testCaseDescription?: string;
  initialDsl?: TestDsl;
  onSaveSuccess?: () => void;
}

const createDefaultStep = (type: StepType, index: number): TestStep => {
  const stepId = `step_${Date.now()}_${index + 1}`;
  switch (type) {
    case 'navigate':
      return { id: stepId, type: 'navigate', url: 'https://example.com' };
    case 'click':
      return {
        id: stepId,
        type: 'click',
        locator: { strategy: 'role', role: 'button', name: 'Submit' },
      };
    case 'fill':
      return {
        id: stepId,
        type: 'fill',
        locator: { strategy: 'role', role: 'textbox', name: 'Email' },
        value: 'test@example.com',
      };
    case 'assertVisible':
      return {
        id: stepId,
        type: 'assertVisible',
        locator: { strategy: 'text', value: 'Dashboard' },
      };
    case 'assertText':
      return {
        id: stepId,
        type: 'assertText',
        locator: { strategy: 'css', value: '.heading' },
        expectedText: 'Welcome',
      };
    case 'wait':
      return { id: stepId, type: 'wait', duration: 1000 };
    case 'screenshot':
      return { id: stepId, type: 'screenshot', name: 'screenshot-1', fullPage: false };
    default:
      return { id: stepId, type: 'navigate', url: 'https://example.com' };
  }
};

export const TestStepEditor: React.FC<TestStepEditorProps> = ({
  testCaseId,
  testCaseName,
  testCaseDescription,
  initialDsl,
  onSaveSuccess,
}) => {
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [savedStepsJson, setSavedStepsJson] = useState<string>('[]');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Modals & Active Edit State
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [activeEditingStep, setActiveEditingStep] = useState<TestStep | null>(null);
  const [deletingStepIndex, setDeletingStepIndex] = useState<number | null>(null);

  // Save / Error States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initialDsl && Array.isArray(initialDsl.steps)) {
      setSteps(initialDsl.steps);
      const json = JSON.stringify(initialDsl.steps);
      setSavedStepsJson(json);
      setIsDirty(false);
    } else {
      setSteps([]);
      setSavedStepsJson('[]');
      setIsDirty(false);
    }
  }, [initialDsl]);

  // Track dirty unsaved state whenever steps change
  const handleStepsChange = (newSteps: TestStep[]) => {
    setSteps(newSteps);
    setIsDirty(JSON.stringify(newSteps) !== savedStepsJson);
    setSaveSuccessMsg(null);
    setValidationErrors([]);
  };

  // Step Creation Flow
  const handleSelectStepType = (type: StepType) => {
    setIsSelectorOpen(false);
    const newStep = createDefaultStep(type, steps.length);
    setActiveEditingStep(newStep);
  };

  const handleSaveStepFromForm = (updatedStep: TestStep) => {
    const existingIndex = steps.findIndex((s) => s.id === updatedStep.id);
    let newSteps: TestStep[];
    if (existingIndex >= 0) {
      newSteps = [...steps];
      newSteps[existingIndex] = updatedStep;
    } else {
      newSteps = [...steps, updatedStep];
    }
    handleStepsChange(newSteps);
    setActiveEditingStep(null);
  };

  // Step Reordering
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newSteps = [...steps];
    const temp = newSteps[index - 1];
    newSteps[index - 1] = newSteps[index];
    newSteps[index] = temp;
    handleStepsChange(newSteps);
  };

  const handleMoveDown = (index: number) => {
    if (index >= steps.length - 1) return;
    const newSteps = [...steps];
    const temp = newSteps[index + 1];
    newSteps[index + 1] = newSteps[index];
    newSteps[index] = temp;
    handleStepsChange(newSteps);
  };

  // Step Deletion
  const handleConfirmDeleteStep = () => {
    if (deletingStepIndex === null) return;
    const newSteps = steps.filter((_, idx) => idx !== deletingStepIndex);
    handleStepsChange(newSteps);
    setDeletingStepIndex(null);
  };

  // Save Test Case to Backend API
  const handleSaveTestCase = async () => {
    setValidationErrors([]);
    setSaveSuccessMsg(null);

    // Build complete candidate DSL object
    const dslToSave: TestDsl = {
      version: '1.0',
      name: testCaseName,
      ...(testCaseDescription ? { description: testCaseDescription } : {}),
      steps,
    };

    // Client-side schema validation using @testforge/dsl-schema
    const validation = validateTestDsl(dslToSave);
    if (!validation.success && validation.errors) {
      const errMsgs = validation.errors.map(
        (e: { path?: string; message: string }) => `${e.path ? e.path + ': ' : ''}${e.message}`
      );
      setValidationErrors(errMsgs);
      return;
    }

    try {
      setIsSaving(true);
      await testCaseService.updateTestCase(
        testCaseId,
        testCaseName,
        testCaseDescription,
        dslToSave
      );

      const json = JSON.stringify(steps);
      setSavedStepsJson(json);
      setIsDirty(false);
      setSaveSuccessMsg('Test case saved successfully.');

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err: any) {
      setValidationErrors([err.message || 'Unable to save test case. Please try again.']);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Action Header Bar */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-6 border-blue-500/20 bg-gradient-to-r from-slate-900 to-slate-900/80">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Visual Test Step Editor</span>
              {isDirty ? (
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold rounded-md">
                  Unsaved changes
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold rounded-md flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Saved</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {steps.length} test step(s) configured
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setIsSelectorOpen(true)}
            className="btn-secondary text-xs flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Add Step</span>
          </button>

          <button
            type="button"
            onClick={handleSaveTestCase}
            disabled={isSaving || !isDirty}
            className="btn-primary text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Test Case</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="flex items-center space-x-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Validation Error Notifications */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1.5 text-red-400 text-xs">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Validation Failed</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps List or Clean Empty State */}
      {steps.length === 0 ? (
        <div className="card text-center py-16 space-y-4 border-dashed border-slate-800">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-slate-400">
            <Layers className="w-6 h-6 text-blue-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-200">No test steps yet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Build your test by adding actions such as Navigate, Click, Fill, Assert, Wait, or Screenshot.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSelectorOpen(true)}
            className="btn-primary text-sm inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Step</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <TestStepCard
              key={step.id || `step_${idx}`}
              step={step}
              index={idx}
              totalSteps={steps.length}
              onEdit={() => setActiveEditingStep(step)}
              onDelete={() => setDeletingStepIndex(idx)}
              onMoveUp={() => handleMoveUp(idx)}
              onMoveDown={() => handleMoveDown(idx)}
            />
          ))}

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setIsSelectorOpen(true)}
              className="btn-secondary text-xs inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Add Another Step</span>
            </button>
          </div>
        </div>
      )}

      {/* Step Type Selector Modal */}
      <StepTypeSelectorModal
        isOpen={isSelectorOpen}
        onSelect={handleSelectStepType}
        onClose={() => setIsSelectorOpen(false)}
      />

      {/* Step Edit/Create Form Modal */}
      <StepFormModal
        isOpen={!!activeEditingStep}
        step={activeEditingStep}
        onSave={handleSaveStepFromForm}
        onClose={() => setActiveEditingStep(null)}
      />

      {/* Step Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingStepIndex !== null}
        title="Delete Test Step?"
        message="Are you sure you want to delete this step? Step numbering will automatically update."
        confirmText="Delete Step"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDeleteStep}
        onClose={() => setDeletingStepIndex(null)}
      />
    </div>
  );
};
