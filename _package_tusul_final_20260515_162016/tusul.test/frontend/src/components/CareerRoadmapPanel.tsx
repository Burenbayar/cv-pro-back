import {useMemo, useState} from 'react';
import type {Language} from '../i18n';

type CareerRoadmapPanelProps = {
  steps: string[];
  lang: Language;
  daysPassed: number;
  monthIndex: number;
};

function parseStep(step: string, idx: number, lang: Language) {
  const monthMatch = step.match(/(?:сар|month)\s*(\d+)/i);
  const month = monthMatch ? Number(monthMatch[1]) : idx + 1;
  const cleaned = step
    .replace(/^(?:сар|month)\s*\d+\s*:\s*/i, '')
    .trim();
  return {
    month,
    title: lang === 'mn' ? `${month}-р сар` : `Month ${month}`,
    body: cleaned || step,
  };
}

export function CareerRoadmapPanel({steps, lang, daysPassed, monthIndex}: CareerRoadmapPanelProps) {
  const parsed = useMemo(() => steps.map((step, idx) => parseStep(step, idx, lang)), [steps, lang]);
  const safeMonth = Math.max(1, Math.min(monthIndex, parsed.length || 1));
  const [selectedMonth, setSelectedMonth] = useState(safeMonth);
  const activeMonth = Math.max(1, Math.min(selectedMonth, parsed.length || 1));
  const active = parsed[activeMonth - 1];

  if (!parsed.length) {
    return <p className="text-sm text-slate-500">{lang === 'mn' ? 'Roadmap мэдээлэл алга.' : 'No roadmap yet.'}</p>;
  }

  return (
    <div className="rounded-3xl border-2 border-slate-800 bg-slate-50 p-5">
      <div className="space-y-4 lg:hidden">
        <div className="space-y-0">
          {parsed.map((step, idx) => {
            const done = activeMonth > step.month;
            const isActive = activeMonth === step.month;
            const nodeLeft = idx % 2 === 0 ? 8 : 70;
            const nextNodeLeft = (idx + 1) % 2 === 0 ? 8 : 70;
            const titleLeft = nodeLeft + 52;
            return (
              <button
                key={`m-${step.month}`}
                type="button"
                onClick={() => setSelectedMonth(step.month)}
                className="relative block h-[68px] w-full rounded-xl text-left"
              >
                {idx < parsed.length - 1 ? (
                  <svg
                    className="pointer-events-none absolute left-0 top-0 h-20 w-[132px]"
                    viewBox="0 0 132 80"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d={`M ${nodeLeft + 18} 30 C ${nodeLeft + 18} 48, ${nextNodeLeft + 18} 45, ${nextNodeLeft + 18} 65`}
                      stroke="#475569"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeDasharray="6 8"
                    />
                  </svg>
                ) : null}
                <span
                  className={`absolute top-2 z-10 flex size-9 items-center justify-center rounded-full border-2 text-base font-black ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : done
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-700 bg-white text-slate-900'
                  }`}
                  style={{left: `${nodeLeft}px`}}
                >
                  {step.month}
                </span>
                <span className="absolute top-3" style={{left: `${titleLeft}px`}}>
                  <span className="block text-xs font-black uppercase tracking-wide text-slate-500">{step.title}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-white p-4">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            {lang === 'mn' ? `Өнгөрсөн хугацаа: ${daysPassed} өдөр` : `Elapsed time: ${daysPassed} days`}
          </p>
          <h4 className="mt-1 text-lg font-black text-slate-900">{active?.title}</h4>
          <p className="mt-2 text-sm leading-7 text-slate-700">{active?.body}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-700 transition-all"
              style={{width: `${Math.min(100, Math.max(0, (safeMonth / parsed.length) * 100))}%`}}
            />
          </div>
        </div>
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-1">
          {parsed.map((step, idx) => {
            const done = activeMonth > step.month;
            const isActive = activeMonth === step.month;
            const nodeLeft = idx % 2 === 0 ? 10 : 88;
            const nextNodeLeft = (idx + 1) % 2 === 0 ? 10 : 88;
            const titleLeft = nodeLeft + 58;
            return (
              <button
                key={`${step.month}-${idx}`}
                type="button"
                onClick={() => setSelectedMonth(step.month)}
                className="relative block h-20 w-full rounded-xl text-left transition"
              >
                {idx < parsed.length - 1 ? (
                  <svg
                    className="pointer-events-none absolute left-0 top-0 h-24 w-[180px]"
                    viewBox="0 0 180 96"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d={`M ${nodeLeft + 22} 34 C ${nodeLeft + 22} 58, ${nextNodeLeft + 22} 54, ${nextNodeLeft + 22} 82`}
                      stroke="#475569"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="7 8"
                    />
                  </svg>
                ) : null}
                <span
                  className={`absolute top-3 z-10 flex size-11 items-center justify-center rounded-full border-2 text-lg font-black ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : done
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-700 bg-white text-slate-900'
                  }`}
                  style={{left: `${nodeLeft}px`}}
                >
                  {step.month}
                </span>
                <span
                  className="absolute top-4 min-w-0"
                  style={{left: `${titleLeft}px`}}
                >
                  <span className="block text-xs font-black uppercase tracking-wide text-slate-500">{step.title}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border-2 border-dashed border-slate-700 bg-white p-6">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            {lang === 'mn'
              ? `Өнгөрсөн хугацаа: ${daysPassed} өдөр`
              : `Elapsed time: ${daysPassed} days`}
          </p>
          <h4 className="mt-2 text-2xl font-black text-slate-900">{active?.title}</h4>
          <p className="mt-4 whitespace-pre-wrap text-lg leading-8 text-slate-700">{active?.body}</p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-700 transition-all"
              style={{width: `${Math.min(100, Math.max(0, (safeMonth / parsed.length) * 100))}%`}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
