import { Check, RefreshCw, X } from 'lucide-react';
import { t } from '../i18n';
import type { Language } from '../i18n';

type FeedbackItem = {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
};

type Props = {
  item: FeedbackItem;
  lang: Language;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRegenerate: (id: string) => void;
};

const btnBase =
  'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-black uppercase';

export function FeedbackSuggestionActions({ item, lang, onAccept, onReject, onRegenerate }: Props) {
  if (item.status === 'accepted') {
    return (
      <div className={`mt-5 ${btnBase} bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200`}>
        <Check size={16} strokeWidth={2.5} />
        {t('acceptedBtn', lang)}
      </div>
    );
  }

  if (item.status === 'rejected') {
    return (
      <div className={`mt-5 ${btnBase} bg-rose-100 text-rose-800 ring-1 ring-rose-200`}>
        <X size={16} strokeWidth={2.5} />
        {t('rejectedBtn', lang)}
      </div>
    );
  }

  return (
    <div className="mt-5 flex w-full flex-col gap-2">
      <button
        type="button"
        className={`${btnBase} bg-emerald-700 text-white hover:bg-emerald-600`}
        onClick={() => onAccept(item.id)}
      >
        <Check size={15} />
        {t('acceptBtn', lang)}
      </button>
      <button
        type="button"
        className={`${btnBase} border border-slate-300 text-slate-700 hover:bg-brand-bg`}
        onClick={() => onRegenerate(item.id)}
      >
        <RefreshCw size={15} />
        {t('regenBtn', lang)}
      </button>
      <button
        type="button"
        className={`${btnBase} border border-rose-200 text-rose-700 hover:bg-rose-50`}
        onClick={() => onReject(item.id)}
      >
        <X size={15} />
        {t('rejectBtn', lang)}
      </button>
    </div>
  );
}
