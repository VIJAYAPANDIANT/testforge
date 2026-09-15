import React from 'react';
import { StepType } from '../../types';
import {
  Globe,
  MousePointerClick,
  Edit3,
  Eye,
  FileText,
  Clock,
  Camera,
  X,
} from 'lucide-react';

interface StepTypeSelectorModalProps {
  isOpen: boolean;
  onSelect: (type: StepType) => void;
  onClose: () => void;
}

const STEP_TYPE_OPTIONS: Array<{
  type: StepType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}> = [
  {
    type: 'navigate',
    title: 'Navigate',
    description: 'Open web page URL (supports {{BASE_URL}})',
    icon: Globe,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    type: 'click',
    title: 'Click',
    description: 'Click target element by role, text, or CSS',
    icon: MousePointerClick,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  {
    type: 'fill',
    title: 'Fill',
    description: 'Input text into a form input or textarea',
    icon: Edit3,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  {
    type: 'assertVisible',
    title: 'Assert Visible',
    description: 'Verify element is present and visible in DOM',
    icon: Eye,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    type: 'assertText',
    title: 'Assert Text',
    description: 'Verify element contains expected text content',
    icon: FileText,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
  },
  {
    type: 'wait',
    title: 'Wait',
    description: 'Pause execution for specified duration (ms)',
    icon: Clock,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
  },
  {
    type: 'screenshot',
    title: 'Screenshot',
    description: 'Capture page screenshot (optional fullPage)',
    icon: Camera,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
  },
];

export const StepTypeSelectorModal: React.FC<StepTypeSelectorModalProps> = ({
  isOpen,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Add Test Step</h3>
            <p className="text-xs text-slate-400 mt-0.5">Select step type action to perform</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {STEP_TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => onSelect(opt.type)}
                className="card hover:border-blue-500/50 transition-all text-left p-4 space-y-2 group flex flex-col justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-lg ${opt.bgColor} ${opt.borderColor} border flex items-center justify-center ${opt.color} group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors text-sm">
                    {opt.title}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{opt.description}</p>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button type="button" onClick={onClose} className="btn-secondary text-xs">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
