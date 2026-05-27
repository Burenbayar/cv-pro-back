import {ArrowRight, Sparkles} from 'lucide-react';
import {t} from '../i18n';

type ChangeItem = {
  id: string;
  before: string;
  after: string;
  status: 'pending' | 'accepted' | 'rejected';
};

type CvExportImprovementsProps = {
  lang: 'mn' | 'en';
  summary: string;
  changes: ChangeItem[];
  addedKeywords: string[];
  strengths: string[];
};

export function CvExportImprovements({lang, summary, changes, addedKeywords, strengths}: CvExportImprovementsProps) {
  const visible = changes.filter((c) => c.status !== 'rejected');

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="flex items-center gap-2 text-sm font-black text-blue-900">
          <Sparkles size={18} /> {t('changesTitle', lang)}
        </p>
        <p className="mt-2 text-sm leading-6 text-blue-800/90">{summary || t('changesIntro', lang)}</p>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-slate-500">{t('noAcceptedSuggestions', lang)}</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
                <div>
                  <p className="text-[10px] font-black uppercase text-rose-600">{t('beforeLabel', lang)}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.before}</p>
                </div>
                <ArrowRight className="mx-auto hidden size-5 shrink-0 text-slate-300 sm:mt-6 sm:block" />
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-700">{t('improvedToLabel', lang)}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-800">{item.after}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {addedKeywords.length > 0 ? (
        <div>
          <p className="text-xs font-black uppercase text-slate-500">{t('highlightedKeywords', lang)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {addedKeywords.slice(0, 12).map((kw) => (
              <span key={kw} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                {kw}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {strengths.length > 0 ? (
        <div>
          <p className="text-xs font-black uppercase text-slate-500">{t('strengthsEmphasized', lang)}</p>
          <ul className="mt-2 space-y-1.5">
            {strengths.slice(0, 5).map((s) => (
              <li key={s} className="text-sm leading-6 text-slate-700">
                • {s}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
