import {Check} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {t} from '../i18n';
import type {Language} from '../i18n';

export type WorkflowStepDef = {
  id: string;
  labelKey: Parameters<typeof t>[0];
  icon: LucideIcon;
};

type Props = {
  steps: WorkflowStepDef[];
  activeView: string;
  lang: Language;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNavigate: (view: any) => void;
};

export function WorkflowStepper({steps, activeView, lang, onNavigate}: Props) {
  const activeIdx = steps.findIndex((s) => s.id === activeView);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => {
        const isActive = step.id === activeView;
        const isPast = idx < activeIdx;
        const isLast = idx === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle with tooltip */}
            <div className="group relative">
              <button
                type="button"
                onClick={() => onNavigate(step.id)}
                className={`flex size-7 items-center justify-center rounded-full text-xs font-black transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-teal text-white shadow-sm shadow-brand-teal/50 scale-110'
                    : isPast
                      ? 'bg-brand-dark text-emerald-400 ring-1 ring-emerald-400/50 hover:ring-emerald-400/80'
                      : 'bg-white/15 text-white/60 ring-1 ring-white/25 hover:bg-white/25 hover:text-white'
                }`}
              >
                {isPast ? <Check size={10} strokeWidth={3} /> : idx + 1}
              </button>

              {/* Hover tooltip — below the circle */}
              <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand-dark px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150 group-hover:opacity-100">
                {t(step.labelKey, lang)}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-brand-dark" />
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={`h-px w-4 shrink-0 ${
                  isPast ? 'bg-brand-teal/40' : 'bg-white/20'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
