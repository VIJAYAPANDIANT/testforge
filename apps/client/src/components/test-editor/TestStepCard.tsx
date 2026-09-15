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
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface TestStepCardProps {
  step: TestStep;
  index: number;
  totalSteps: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
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

const getStepTypeInfo = (type: string) => {
  switch (type) {
    case 'navigate':
      return { label: 'Navigate', icon: Globe, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    case 'click':
      return { label: 'Click', icon: MousePointerClick, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    case 'fill':
      return { label: 'Fill', icon: Edit3, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
    case 'assertVisible':
      return { label: 'Assert Visible', icon: Eye, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    case 'assertText':
      return { label: 'Assert Text', icon: FileText, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
    case 'wait':
      return { label: 'Wait', icon: Clock, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    case 'screenshot':
      return { label: 'Screenshot', icon: Camera, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' };
    default:
      return { label: type, icon: Globe, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
  }
};

export const TestStepCard: React.FC<TestStepCardProps> = ({
  step,
  index,
  totalSteps,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const typeInfo = getStepTypeInfo(step.type);
  const Icon = typeInfo.icon;

  const isFirst = index === 0;
  const isLast = index === totalSteps - 1;

  return (
    <div className="card hover:border-slate-700 transition-all p-4 space-y-3 group">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Step Header info */}
        <div className="flex items-center space-x-3">
          <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
            {index + 1}
          </span>

          <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center space-x-1.5 ${typeInfo.color}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{typeInfo.label}</span>
          </span>
        </div>

        {/* Step Actions */}
        <div className="flex items-center space-x-1 self-end sm:self-center">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors flex items-center space-x-1"
            title="Move Step Up"
            aria-label="Move Step Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Up</span>
          </button>

          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors flex items-center space-x-1"
            title="Move Step Down"
            aria-label="Move Step Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Down</span>
          </button>

          <span className="text-slate-800 px-1">|</span>

          <button
            type="button"
            onClick={onEdit}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center space-x-1"
            title="Edit Step"
            aria-label="Edit Step"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="px-2.5 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors flex items-center space-x-1"
            title="Delete Step"
            aria-label="Delete Step"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Human-Readable Details Summary */}
      <div className="pl-9 text-xs text-slate-300 space-y-1">
        {step.type === 'navigate' && (
          <div className="font-mono bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800/80 text-blue-300 text-xs">
            URL: {step.url}
          </div>
        )}

        {step.type === 'click' && (
          <div className="font-mono bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800/80 text-slate-300 text-xs">
            Target: <span className="text-emerald-400">{formatLocatorSummary(step.locator)}</span>
            {step.fallbackLocator && (
              <span className="text-slate-500 block text-[11px] mt-0.5">
                Fallback: {formatLocatorSummary(step.fallbackLocator)}
              </span>
            )}
          </div>
        )}

        {step.type === 'fill' && (
          <div className="font-mono bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800/80 text-slate-300 text-xs space-y-0.5">
            <div>Target: <span className="text-purple-400">{formatLocatorSummary(step.locator)}</span></div>
            <div>Value: <span className="text-amber-300">"{step.value}"</span></div>
            {step.fallbackLocator && (
              <div className="text-slate-500 text-[11px]">
                Fallback: {formatLocatorSummary(step.fallbackLocator)}
              </div>
            )}
          </div>
        )}

        {step.type === 'assertVisible' && (
          <div className="font-mono bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800/80 text-slate-300 text-xs">
            Target: <span className="text-amber-400">{formatLocatorSummary(step.locator)}</span>
            {step.fallbackLocator && (
              <span className="text-slate-500 block text-[11px] mt-0.5">
                Fallback: {formatLocatorSummary(step.fallbackLocator)}
              </span>
            )}
          </div>
        )}

        {step.type === 'assertText' && (
          <div className="font-mono bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800/80 text-slate-300 text-xs space-y-0.5">
            <div>Target: <span className="text-cyan-400">{formatLocatorSummary(step.locator)}</span></div>
            <div>Expected Text: <span className="text-emerald-300">"{step.expectedText || (step as any).value || ''}"</span></div>
            {step.fallbackLocator && (
              <div className="text-slate-500 text-[11px]">
                Fallback: {formatLocatorSummary(step.fallbackLocator)}
              </div>
            )}
          </div>
        )}

        {step.type === 'wait' && (
          <div className="font-mono bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800/80 text-slate-300 text-xs">
            Duration: <span className="text-slate-200">{step.duration} ms</span>
          </div>
        )}

        {step.type === 'screenshot' && (
          <div className="font-mono bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800/80 text-slate-300 text-xs flex items-center justify-between">
            <span>Name: <span className="text-pink-300">{step.name || '(default)'}</span></span>
            <span className="text-[11px] text-slate-400">FullPage: {step.fullPage ? 'Yes' : 'No'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
