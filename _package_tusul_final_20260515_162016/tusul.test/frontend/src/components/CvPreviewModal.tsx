import { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { CvScaledPreview } from './CvScaledPreview';
import { CvTemplateDocument } from './CvTemplateDocument';
import type { CvLanguage } from '@shared/cvSections';
import { t } from '../i18n';

type CvPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  lang: CvLanguage;
  analysis: {
    candidateName: string;
    targetRole: string;
    rewrittenCv: string;
    skills: string[];
  };
  profileImage?: string;
};

export function CvPreviewModal({ open, onClose, lang, analysis, profileImage }: CvPreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const title = t('cvPreviewModalTitle', lang);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={onClose} aria-label={t('closeLabel', lang)} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-black text-slate-900">
            <ZoomIn size={18} className="text-blue-600" />
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label={t('closeLabel', lang)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-6">
          <CvScaledPreview>
            <CvTemplateDocument data={analysis} profileImage={profileImage} lang={lang} />
          </CvScaledPreview>
        </div>
      </div>
    </div>
  );
}
