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
  GripVertical,
  Plus,
} from 'lucide-react';

interface ActionPaletteProps {
  onAddStep: (type: StepType) => void;
}

interface ActionPaletteItem {
  type: StepType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  borderColor: string;
}

export const ACTION_PALETTE_ITEMS: ActionPaletteItem[] = [
  {
    type: 'navigate',
    label: 'Navigate',
    description: 'Go to a web URL',
    icon: Globe,
    color: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300',
    borderColor: 'border-blue-500/30',
  },
  {
    type: 'click',
    label: 'Click',
    description: 'Click a button or link',
    icon: MousePointerClick,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300',
    borderColor: 'border-emerald-500/30',
  },
  {
    type: 'fill',
    label: 'Fill',
    description: 'Type text into an input field',
    icon: Edit3,
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300',
    borderColor: 'border-purple-500/30',
  },
  {
    type: 'assertVisible',
    label: 'Assert Visible',
    description: 'Verify element is visible',
    icon: Eye,
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300',
    borderColor: 'border-amber-500/30',
  },
  {
    type: 'assertText',
    label: 'Assert Text',
    description: 'Verify element text content',
    icon: FileText,
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300',
    borderColor: 'border-cyan-500/30',
  },
  {
    type: 'wait',
    label: 'Wait',
    description: 'Pause execution in ms',
    icon: Clock,
    color: 'text-slate-400',
    badgeBg: 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-300',
    borderColor: 'border-slate-500/30',
  },
  {
    type: 'screenshot',
    label: 'Screenshot',
    description: 'Capture page screenshot',
    icon: Camera,
    color: 'text-pink-400',
    badgeBg: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-300',
    borderColor: 'border-pink-500/30',
  },
];

export const ActionPalette: React.FC<ActionPaletteProps> = ({ onAddStep }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, type: StepType) => {
    e.dataTransfer.setData('application/testforge-action', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="card space-y-4 p-4 h-full flex flex-col bg-[#111827]/90 border-slate-800">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <span>Action Blocks</span>
          <span className="text-[10px] text-slate-500 font-normal">Drag or Click</span>
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">
          Drag an action onto the canvas or click to add it to your test sequence.
        </p>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
        {ACTION_PALETTE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => handleDragStart(e, item.type)}
              onClick={() => onAddStep(item.type)}
              className={`p-3 rounded-lg border ${item.borderColor} bg-slate-900/80 hover:bg-slate-800/90 cursor-grab active:cursor-grabbing transition-all group select-none flex items-center justify-between shadow-sm`}
              title={`Drag ${item.label} to canvas or click to add`}
            >
              <div className="flex items-center space-x-3">
                <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                <div className={`w-7 h-7 rounded-md ${item.badgeBg} flex items-center justify-center border ${item.borderColor} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                    {item.label}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {item.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddStep(item.type);
                }}
                className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                title={`Click to add ${item.label} step`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
