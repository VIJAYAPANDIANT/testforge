import React, { useState } from 'react';
import { TestStep, StepType } from '../../types';
import { CanvasStepCard } from './CanvasStepCard';
import { Layers, ArrowDown, Plus } from 'lucide-react';

interface CanvasWorkflowProps {
  steps: TestStep[];
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
  onMoveStep: (fromIndex: number, toIndex: number) => void;
  onDuplicateStep: (index: number) => void;
  onDeleteStep: (index: number) => void;
  onDropNewAction: (type: StepType, targetIndex?: number) => void;
}

export const CanvasWorkflow: React.FC<CanvasWorkflowProps> = ({
  steps,
  selectedStepId,
  onSelectStep,
  onMoveStep,
  onDuplicateStep,
  onDeleteStep,
  onDropNewAction,
}) => {
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOverCanvas(true);
  };

  const handleCanvasDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    setDragOverIndex(null);
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    setDragOverIndex(null);

    const newActionType = e.dataTransfer.getData('application/testforge-action') as StepType;
    if (newActionType) {
      onDropNewAction(newActionType);
      return;
    }

    const sourceIndexStr = e.dataTransfer.getData('application/testforge-step-index');
    if (sourceIndexStr !== '') {
      const sourceIndex = parseInt(sourceIndexStr, 10);
      if (!isNaN(sourceIndex) && sourceIndex >= 0 && sourceIndex < steps.length) {
        // Drop at end of list
        onMoveStep(sourceIndex, steps.length - 1);
      }
    }
  };

  const handleCardDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('application/testforge-step-index', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  };

  const handleCardDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    setIsDragOverCanvas(false);

    const newActionType = e.dataTransfer.getData('application/testforge-action') as StepType;
    if (newActionType) {
      onDropNewAction(newActionType, targetIndex);
      return;
    }

    const sourceIndexStr = e.dataTransfer.getData('application/testforge-step-index');
    if (sourceIndexStr !== '') {
      const sourceIndex = parseInt(sourceIndexStr, 10);
      if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
        onMoveStep(sourceIndex, targetIndex);
      }
    }
  };

  return (
    <div
      onDragOver={handleCanvasDragOver}
      onDragLeave={handleCanvasDragLeave}
      onDrop={handleCanvasDrop}
      className={`card h-full flex flex-col p-4 bg-[#111827]/90 border-slate-800 transition-all ${
        isDragOverCanvas ? 'ring-2 ring-blue-500/80 bg-blue-950/20 border-blue-500/50' : ''
      }`}
    >
      {/* Workflow Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <span>Test Workflow Canvas</span>
            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">
              {steps.length} step(s)
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sequential test steps executed top to bottom in Playwright Chromium.
          </p>
        </div>
      </div>

      {/* Canvas Body */}
      <div className="flex-1 overflow-y-auto pr-1">
        {steps.length === 0 ? (
          <div
            className={`h-full min-h-[320px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center space-y-4 transition-all ${
              isDragOverCanvas
                ? 'border-blue-500 bg-blue-500/10 text-blue-300 scale-[0.99]'
                : 'border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shadow-inner">
              <Layers className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h4 className="text-sm font-bold text-slate-200">No test steps yet</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drag an action block from the left palette onto this canvas, or click any action block to add it.
              </p>
            </div>

            <div className="px-4 py-2 rounded-lg bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center space-x-2">
              <ArrowDown className="w-4 h-4 animate-bounce" />
              <span>Drag & Drop Action Blocks Here</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id || `step_${idx}`}>
                {/* Connector Arrow */}
                {idx > 0 && (
                  <div className="flex items-center justify-center -my-1">
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-3 bg-slate-800" />
                      <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-[10px]">
                        <ArrowDown className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="w-0.5 h-3 bg-slate-800" />
                    </div>
                  </div>
                )}

                {/* Drop Indicator line if dragging over specific index */}
                {dragOverIndex === idx && (
                  <div className="h-1 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 my-1 animate-pulse" />
                )}

                <CanvasStepCard
                  step={step}
                  index={idx}
                  totalSteps={steps.length}
                  isSelected={step.id === selectedStepId}
                  onSelect={() => onSelectStep(step.id)}
                  onMoveUp={() => onMoveStep(idx, idx - 1)}
                  onMoveDown={() => onMoveStep(idx, idx + 1)}
                  onDuplicate={() => onDuplicateStep(idx)}
                  onDelete={() => onDeleteStep(idx)}
                  onDragStart={(e) => handleCardDragStart(e, idx)}
                  onDragOver={(e) => handleCardDragOver(e, idx)}
                  onDrop={(e) => handleCardDrop(e, idx)}
                />
              </React.Fragment>
            ))}

            {/* End Drop Zone Indicator */}
            <div
              className={`p-3 rounded-lg border border-dashed border-slate-800/80 bg-slate-950/40 text-center text-xs text-slate-500 flex items-center justify-center space-x-2 transition-colors ${
                isDragOverCanvas ? 'border-blue-500/60 bg-blue-500/10 text-blue-400' : ''
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Drop next step here</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
