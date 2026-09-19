import React from 'react';
import { TestStep, Locator } from '../../types';
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
  const details = getStepTypeDetails(step.type);
  const Icon = details.icon;

  const isFirst = index === 0;
  const isLast = index === totalSteps - 1;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      className={`card transition-all p-3.5 space-y-2.5 cursor-pointer select-none group border ${
        isSelected
          ? 'ring-2 ring-blue-500/80 bg-blue-950/20 border-blue-500/50 shadow-lg shadow-blue-950/30'
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
        </div>

        {/* Card Toolbar Buttons */}
        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
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
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Delete Step"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Configuration Summary Content */}
      <div className="pl-8 text-xs font-mono text-slate-300">
        {step.type === 'navigate' && (
          <div className="bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800/80 text-blue-300 text-[11px] truncate">
            URL: <span className="font-medium text-slate-200">{step.url || '(not set)'}</span>
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
            <div className="truncate">Value: <span className="text-amber-300">"{step.value !== undefined ? step.value : ''}"</span></div>
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
            <div className="truncate">Expected: <span className="text-emerald-300">"{step.expectedText || (step as any).value || ''}"</span></div>
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
      </div>
    </div>
  );
};
