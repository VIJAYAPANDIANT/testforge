import React, { useState, useEffect } from 'react';
import { TestStep, StepType, TestDsl } from '../../types';
import { ActionPalette } from './ActionPalette';
import { CanvasWorkflow } from './CanvasWorkflow';
import { StepPropertiesPanel } from './StepPropertiesPanel';
import { validateTestDsl } from '@testforge/dsl-schema';
import { testCaseService } from '../../services/testCaseService';
import {
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface TestBuilderCanvasProps {
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

export const TestBuilderCanvas: React.FC<TestBuilderCanvasProps> = ({
  testCaseId,
  testCaseName,
  testCaseDescription,
  initialDsl,
  onSaveSuccess,
}) => {
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [savedStepsJson, setSavedStepsJson] = useState<string>('[]');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Save / Validation State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initialDsl && Array.isArray(initialDsl.steps)) {
      setSteps(initialDsl.steps);
      const json = JSON.stringify(initialDsl.steps);
      setSavedStepsJson(json);
      setIsDirty(false);

      // Default select first step if available
      if (initialDsl.steps.length > 0 && !selectedStepId) {
        setSelectedStepId(initialDsl.steps[0].id || 'step_0');
      }
    } else {
      setSteps([]);
      setSavedStepsJson('[]');
      setIsDirty(false);
      setSelectedStepId(null);
    }
  }, [initialDsl]);

  const updateStepsState = (newSteps: TestStep[], autoSelectId?: string) => {
    setSteps(newSteps);
    setIsDirty(JSON.stringify(newSteps) !== savedStepsJson);
    setSaveSuccessMsg(null);
    setValidationErrors([]);

    if (autoSelectId) {
      setSelectedStepId(autoSelectId);
    }
  };

  // Add Step Action (Drag or Click)
  const handleAddStep = (type: StepType, targetIndex?: number) => {
    const newStep = createDefaultStep(type, steps.length);
    let newSteps: TestStep[];

    if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= steps.length) {
      newSteps = [...steps];
      newSteps.splice(targetIndex, 0, newStep);
    } else {
      newSteps = [...steps, newStep];
    }

    updateStepsState(newSteps, newStep.id);
  };

  // Step Selection
  const handleSelectStep = (id: string) => {
    setSelectedStepId(id);
  };

  // Step Property Modification
  const handleUpdateStep = (updatedStep: TestStep) => {
    const newSteps = steps.map((s) => (s.id === updatedStep.id ? updatedStep : s));
    updateStepsState(newSteps);
  };

  // Step Reordering
  const handleMoveStep = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= steps.length || toIndex < 0 || toIndex >= steps.length) {
      return;
    }
    const newSteps = [...steps];
    const [movedItem] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, movedItem);
    updateStepsState(newSteps);
  };

  // Step Duplication
  const handleDuplicateStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    const targetStep = steps[index];
    const clonedStep: TestStep = JSON.parse(JSON.stringify(targetStep));
    clonedStep.id = `step_${Date.now()}_${index + 1}_copy`;

    const newSteps = [...steps];
    newSteps.splice(index + 1, 0, clonedStep);
    updateStepsState(newSteps, clonedStep.id);
  };

  // Step Deletion
  const handleDeleteStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    const stepToDelete = steps[index];
    const newSteps = steps.filter((_, idx) => idx !== index);

    let nextSelectedId: string | null = selectedStepId;
    if (selectedStepId === stepToDelete.id) {
      if (newSteps.length > 0) {
        const nextIndex = Math.min(index, newSteps.length - 1);
        nextSelectedId = newSteps[nextIndex].id || null;
      } else {
        nextSelectedId = null;
      }
    }

    updateStepsState(newSteps, nextSelectedId || undefined);
    if (!nextSelectedId) {
      setSelectedStepId(null);
    }
  };

  // Save Test Case API Call
  const handleSaveTestCase = async () => {
    setValidationErrors([]);
    setSaveSuccessMsg(null);

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

  const selectedStep = steps.find((s) => s.id === selectedStepId) || null;
  const selectedStepIndex = steps.findIndex((s) => s.id === selectedStepId);

  return (
    <div className="space-y-4">
      {/* Header Controls Bar */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-6 border-blue-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Visual Test Builder Canvas</span>
              {isDirty ? (
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold rounded-md animate-pulse">
                  Unsaved changes
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold rounded-md flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Saved ✓</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {steps.length} test step(s) configured in workflow
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-center">
          <button
            type="button"
            onClick={handleSaveTestCase}
            disabled={isSaving || !isDirty}
            className="btn-primary text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Test...</span>
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

      {/* Validation Errors Notification */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1 text-red-400 text-xs">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Validation Error</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main 3-Column Visual Canvas Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[580px]">
        {/* Left Column: Action Palette (3 cols) */}
        <div className="lg:col-span-3 h-full">
          <ActionPalette onAddStep={(type) => handleAddStep(type)} />
        </div>

        {/* Center Column: Workflow Canvas (5 cols) */}
        <div className="lg:col-span-5 h-full">
          <CanvasWorkflow
            steps={steps}
            selectedStepId={selectedStepId}
            onSelectStep={handleSelectStep}
            onMoveStep={handleMoveStep}
            onDuplicateStep={handleDuplicateStep}
            onDeleteStep={handleDeleteStep}
            onDropNewAction={(type, index) => handleAddStep(type, index)}
          />
        </div>

        {/* Right Column: Step Properties Panel (4 cols) */}
        <div className="lg:col-span-4 h-full">
          <StepPropertiesPanel
            step={selectedStep}
            onChange={handleUpdateStep}
            onDuplicate={() => selectedStepIndex >= 0 && handleDuplicateStep(selectedStepIndex)}
            onDelete={() => selectedStepIndex >= 0 && handleDeleteStep(selectedStepIndex)}
          />
        </div>
      </div>
    </div>
  );
};
