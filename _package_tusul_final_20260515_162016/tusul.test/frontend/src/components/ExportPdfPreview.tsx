import {enrichParsedCv, parseCvSections, type CvLanguage} from '@shared/cvSections';
import {CvTemplateDocument, type CvTemplateData} from './CvTemplateDocument';
import {t} from '../i18n';

type ExportPdfPreviewProps = {
  analysis: CvTemplateData;
  profileImage?: string;
  lang: CvLanguage;
  size?: 'sm' | 'md';
  showIntro?: boolean;
};

export function ExportPdfPreview({analysis, profileImage, lang, size = 'sm', showIntro = false}: ExportPdfPreviewProps) {
  const compact = size === 'sm';
  const intro = t('exportPreviewIntro', lang);
  const empty = t('exportPreviewEmpty', lang);

  const rawSource = (analysis.sourceCvText || analysis.rewrittenCv).trim();
  const enrichCtx = {
    language: lang,
    targetRole: analysis.targetRole,
    displayName: analysis.candidateName,
  };
  const parsed = enrichParsedCv(parseCvSections(analysis.rewrittenCv), rawSource, analysis.skills, enrichCtx);
  const hasContent =
    Boolean(parsed.about || parsed.experience.length || parsed.education.length || parsed.skills.length) ||
    rawSource.length > 80;

  return (
    <div className="space-y-3">
      {showIntro ? (
        <p
          className={`rounded-lg border border-blue-200 bg-blue-50 font-bold text-blue-900 ${
            compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
          }`}
        >
          {intro}
        </p>
      ) : null}
      {hasContent ? (
        <CvTemplateDocument data={analysis} profileImage={profileImage} lang={lang} compact={compact} />
      ) : (
        <p className={`text-amber-700 ${compact ? 'text-xs' : 'text-sm'}`}>{empty}</p>
      )}
    </div>
  );
}
