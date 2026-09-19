import React, { useState } from 'react';
import { TestStep, Locator } from '../../types';
import { getStepValidationErrors } from './stepValidation';
import {
  Globe,
  MousePointerClick,
  Edit3,
  Eye,
  FileText,
  Clock,
  Camera,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

interface CanvasStepCardProps {
  step: TestStep;
  index: number;
  totalSteps: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

const formatLocatorSummary = (locator?: Locator): string => {
  if (!locator) return 'No locator';
  if (locator.strategy === 'role') {
    const roleVal = locator.role || locator.value || 'element';
    const nameVal = locator.name ? ` "${locator.name}"` : '';
    return `role: ${roleVal}${nameVal}`;
  }
  if (locator.strategy === 'text') {
    return `text: "${locator.value || ''}"`;
  }
  return `css: ${locator.value || ''}`;
};

const getStepTypeDetails = (type: string) => {
  switch (type) {
    case 'navigate':
      return { label: 'Navigate', icon: Globe, badgeClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    case 'click':
      return { label: 'Click', icon: MousePointerClick, badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    case 'fill':
      return { label: 'Fill', icon: Edit3, badgeClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
    case 'assertVisible':
      return { label: 'Assert Visible', icon: Eye, badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    case 'assertText':
      return { label: 'Assert Text', icon: FileText, badgeClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
    case 'wait':
      return { label: 'Wait', icon: Clock, badgeClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    case 'screenshot':
      return { label: 'Screenshot', icon: Camera, badgeClass: 'text-pink-400 bg-pink-500/10 border-pink-500/20' };
    default:
      return { label: type, icon: Globe, badgeClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
  }
};

export const CanvasStepCard: React.FC<CanvasStepCardProps> = ({
  step,
  index,
  totalSteps,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const details = getStepTypeDetails(step.type);
  const Icon = details.icon;

  const isFirst = index === 0;
  const isLast = index === totalSteps - 1;

  const validationErrors = getStepValidationErrors(step);
  const isValid = validationErrors.length === 0;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
    onDelete();
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      className={`card transition-all p-3.5 space-y-2.5 cursor-pointer select-none group border ${
        isSelected
          ? 'ring-2 ring-blue-500 bg-blue-950/25 border-blue-500/60 shadow-lg shadow-blue-950/40'
          : 'border-slate-800 bg-[#111827]/80 hover:border-slate-700 hover:bg-slate-900/90'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          {/* Drag Handle */}
          <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 cursor-grab active:cursor-grabbing" />

          {/* Index Badge */}
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              isSelected
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 border border-slate-700 text-slate-300'
            }`}
          >
            {index + 1}
          </span>

          {/* Action Type Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border flex items-center space-x-1.5 ${details.badgeClass}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{details.label}</span>
          </span>

          {/* Selection State Badge */}
          {isSelected && (
            <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-bold rounded">
              Selected
            </span>
          )}

          {/* Validation Status Badge */}
          {isValid ? (
            <span
              className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium rounded flex items-center space-x-1"
              title="Step configured cleanly"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span className="hidden sm:inline">Configured</span>
            </span>
          ) : (
            <span
              className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-medium rounded flex items-center space-x-1 animate-pulse"
              title={validationErrors.join('; ')}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Needs config</span>
            </span>
          )}
        </div>

        {/* Card Toolbar Buttons or Inline Delete Confirmation */}
        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          {showDeleteConfirm ? (
            <div className="flex items-center space-x-1.5 bg-red-950/80 border border-red-500/40 p-1 rounded-lg">
              <span className="text-[11px] font-semibold text-red-300 pl-1">Delete step?</span>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition-colors"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="p-0.5 text-slate-400 hover:text-white rounded transition-colors"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isFirst}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                title="Move Step Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onMoveDown}
                disabled={isLast}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                title="Move Step Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>

              <span className="text-slate-800 px-0.5">|</span>

              <button
                type="button"
                onClick={onDuplicate}
                className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                title="Duplicate Step"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDeleteClick}
                className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                title="Delete Step"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Configuration Summary Content */}
      <div className="pl-8 text-xs font-mono text-slate-300 space-y-1">
        {step.type === 'navigate' && (
          <div className="bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800/80 text-blue-300 text-[11px] truncate">
            URL: <span className="font-medium text-slate-200">{step.url || '(not configured)'}</span>
          </div>
        )}

        {step.type === 'click' && (
          <div className="bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800/80 text-[11px] truncate">
            Target: <span className="text-emerald-400 font-medium">{formatLocatorSummary(step.locator)}</span>
          </div>
        )}

        {step.type === 'fill' && (
          <div className="bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800/80 text-[11px] space-y-0.5">
            <div className="truncate">Target: <span className="text-purple-400 font-medium">{formatLocatorSummary(step.locator)}</span></div>
            <div className="truncate">Value: <span className="text-amber-300">{step.value ? `"${step.value}"` : '(empty value)'}</span></div>
          </div>
        )}

        {step.type === 'assertVisible' && (
          <div className="bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800/80 text-[11px] truncate">
            Target: <span className="text-amber-400 font-medium">{formatLocatorSummary(step.locator)}</span>
          </div>
        )}

        {step.type === 'assertText' && (
          <div className="bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800/80 text-[11px] space-y-0.5">
            <div className="truncate">Target: <span className="text-cyan-400 font-medium">{formatLocatorSummary(step.locator)}</span></div>
            <div className="truncate">Expected: <span className="text-emerald-300">{step.expectedText || (step as any).value ? `"${step.expectedText || (step as any).value}"` : '(empty text)'}</span></div>
          </div>
        )}

        {step.type === 'wait' && (
          <div className="bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800/80 text-[11px]">
            Duration: <span className="text-slate-200 font-medium">{step.duration || 1000} ms</span>
          </div>
        )}

        {step.type === 'screenshot' && (
          <div className="bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800/80 text-[11px] flex items-center justify-between">
            <span className="truncate">Name: <span className="text-pink-300 font-medium">{step.name || '(default)'}</span></span>
            <span className="text-[10px] text-slate-500">FullPage: {step.fullPage ? 'Yes' : 'No'}</span>
          </div>
        )}

        {/* Validation Warning Notice if incomplete */}
        {!isValid && (
          <div className="text-amber-400 text-[10px] font-sans pt-0.5 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>{validationErrors[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
};
