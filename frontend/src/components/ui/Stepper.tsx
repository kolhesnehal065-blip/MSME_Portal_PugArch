import React from 'react';
import { cn } from '../../lib/utils';

export interface Step {
  id: number;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  onStepChange?: (stepId: number) => void;
}

export function Stepper({ steps, currentStep, className, onStepChange }: StepperProps) {
  return (
    <div className={cn("overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0 mb-8 md:mb-12", className)}>
      <div className="flex items-center justify-center min-w-max md:min-w-0 md:w-full max-w-2xl mx-auto space-x-2 md:space-x-4">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepChange?.(step.id)}
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold transition-all duration-300",
                  onStepChange && "cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2",
                  currentStep >= step.id 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
                    : "bg-white border-2 border-slate-200 text-slate-400"
                )}
              >
                {step.id}
              </button>
              <span className={cn(
                 "mt-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap hidden md:block",
                 currentStep >= step.id ? "text-indigo-600" : "text-slate-400"
              )}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={cn(
                "h-0.5 flex-1 min-w-[30px] max-w-[40px] md:max-w-[100px] mb-0 md:mb-6",
                currentStep > step.id ? "bg-indigo-600" : "bg-slate-200"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
