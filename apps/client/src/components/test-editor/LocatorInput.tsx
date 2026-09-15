import React, { useState } from 'react';
import { Locator, LocatorStrategy } from '../../types';
import { ChevronDown, Sparkles } from 'lucide-react';

interface LocatorInputProps {
  locator: Locator;
  onChange: (updatedLocator: Locator) => void;
  label?: string;
  allowFallback?: boolean;
}

export const LocatorInput: React.FC<LocatorInputProps> = ({
  locator,
  onChange,
  label = 'Element Locator',
  allowFallback = true,
}) => {
  const [showFallback, setShowFallback] = useState<boolean>(
    !!(locator.fallback || locator.fallbackLocator)
  );

  const fallbackObj: Locator | undefined = locator.fallbackLocator || locator.fallback;

  const handleStrategyChange = (strategy: LocatorStrategy) => {
    onChange({
      ...locator,
      strategy,
      // reset strategy-specific fields if strategy changed
      role: strategy === 'role' ? locator.role || 'button' : undefined,
      value: strategy !== 'role' ? locator.value || '' : undefined,
      name: strategy === 'role' ? locator.name || '' : undefined,
    });
  };

  const handleFieldChange = (field: keyof Locator, val: string) => {
    onChange({
      ...locator,
      [field]: val,
    });
  };

  const handleFallbackChange = (updatedFallback: Locator | undefined) => {
    onChange({
      ...locator,
      fallbackLocator: updatedFallback,
      fallback: updatedFallback,
    });
  };

  const toggleFallback = () => {
    if (showFallback) {
      setShowFallback(false);
      handleFallbackChange(undefined);
    } else {
      setShowFallback(true);
      handleFallbackChange({
        strategy: 'css',
        value: '',
      });
    }
  };

  return (
    <div className="space-y-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-lg">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label} *
        </label>
        {allowFallback && (
          <button
            type="button"
            onClick={toggleFallback}
            className="text-[11px] font-medium text-blue-400 hover:underline flex items-center space-x-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>{showFallback ? 'Remove Fallback Locator' : '+ Add Fallback Locator'}</span>
          </button>
        )}
      </div>

      {/* Strategy selector tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-md">
        {(['role', 'text', 'css'] as LocatorStrategy[]).map((strat) => (
          <button
            key={strat}
            type="button"
            onClick={() => handleStrategyChange(strat)}
            className={`py-1.5 px-2 rounded text-xs font-medium capitalize transition-colors ${
              locator.strategy === strat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {strat}
          </button>
        ))}
      </div>

      {/* Dynamic Fields based on Strategy */}
      {locator.strategy === 'role' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Role (e.g. button, textbox, heading)</label>
            <input
              type="text"
              value={locator.role || locator.value || ''}
              onChange={(e) => handleFieldChange('role', e.target.value)}
              placeholder="button"
              className="input-field text-xs py-2"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Accessible Name (Optional)</label>
            <input
              type="text"
              value={locator.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Submit"
              className="input-field text-xs py-2"
            />
          </div>
        </div>
      )}

      {locator.strategy === 'text' && (
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Text Content to match</label>
          <input
            type="text"
            value={locator.value || ''}
            onChange={(e) => handleFieldChange('value', e.target.value)}
            placeholder="e.g. Welcome Back"
            className="input-field text-xs py-2"
            required
          />
        </div>
      )}

      {locator.strategy === 'css' && (
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">CSS Selector</label>
          <input
            type="text"
            value={locator.value || ''}
            onChange={(e) => handleFieldChange('value', e.target.value)}
            placeholder="e.g. #login-btn, button[type='submit']"
            className="input-field text-xs py-2"
            required
          />
        </div>
      )}

      {/* Optional Fallback Locator Nested Section */}
      {showFallback && fallbackObj && (
        <div className="pt-2 border-t border-slate-800/80">
          <LocatorInput
            locator={fallbackObj}
            onChange={(upd) => handleFallbackChange(upd)}
            label="Fallback Locator (Backup)"
            allowFallback={false}
          />
        </div>
      )}
    </div>
  );
};
