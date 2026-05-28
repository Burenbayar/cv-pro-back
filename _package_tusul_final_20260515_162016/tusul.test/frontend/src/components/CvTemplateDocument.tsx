import type {ReactNode} from 'react';
import {enrichParsedCv, parseCvSections, resolveCandidateName, type CvLanguage} from '@shared/cvSections';
import {normalizeCvTextForParse, sanitizeParsedForTemplate} from '@shared/cvTemplateSanitize';
import {resolveDisplayRole} from '@shared/cvProfession';
import {
  CV_THEME,
  parseContactFields,
  splitEducationLine,
  splitExperienceBlock,
  splitExperienceBlocks,
  templateLabels,
} from '@shared/cvTemplateTheme';
import {t as tr} from '../i18n';

export type CvTemplateData = {
  candidateName: string;
  targetRole: string;
  rewrittenCv: string;
  sourceCvText?: string;
  skills: string[];
  accountFullName?: string;
};

type CvTemplateDocumentProps = {
  data: CvTemplateData;
  profileImage?: string;
  lang: CvLanguage;
  compact?: boolean;
};

export function CvTemplateDocument({data, profileImage, lang, compact = false}: CvTemplateDocumentProps) {
  const t = templateLabels(lang);
  const rawSource = (data.sourceCvText || data.rewrittenCv).trim();
  const normalizedRaw = normalizeCvTextForParse(rawSource);
  const normalizedCv = normalizeCvTextForParse(data.rewrittenCv);
  const name =
    resolveCandidateName({
      candidateName: data.candidateName,
      cvText: normalizedRaw || normalizedCv,
      fullName: data.accountFullName || data.candidateName,
    }) || tr('previewNameFallback', lang);
  const role = resolveDisplayRole(data.targetRole, normalizedRaw || normalizedCv, lang);
  const enrichCtx = {language: lang, targetRole: role, displayName: name, experienceLevel: ''};
  const enriched = enrichParsedCv(parseCvSections(normalizedCv), normalizedRaw, data.skills, enrichCtx);
  const parsed = sanitizeParsedForTemplate(enriched, normalizedRaw, data.skills, enrichCtx);
  const contact = parseContactFields(parsed.contact);
  const experienceBlocks = splitExperienceBlocks(parsed.experience);
  const summary = parsed.about;

  const titleCls = compact ? 'text-[9px]' : 'text-[11px]';
  const bodyCls = compact ? 'text-[9px] leading-[14px]' : 'text-xs leading-5';
  const nameCls = compact ? 'text-sm' : 'text-xl';
  const photoSize = compact ? 'size-14' : 'size-[72px]';

  return (
    <div className="overflow-hidden rounded-sm border border-slate-300 bg-white font-sans shadow-sm">
      <header
        className="grid gap-3 overflow-hidden p-3 text-white sm:grid-cols-[auto_1fr_auto]"
        style={{backgroundColor: CV_THEME.navy}}
      >
        <div
          className={`flex ${photoSize} shrink-0 items-center justify-center overflow-hidden border-2 border-white bg-slate-400/40`}
        >
          {profileImage ? (
            <img src={profileImage} alt="" className="size-full object-cover" />
          ) : (
            <span className={`font-bold uppercase text-white/90 ${compact ? 'text-[8px]' : 'text-xs'}`}>{t.photo}</span>
          )}
        </div>
        <div className="min-w-0 overflow-hidden">
          <h1 className={`truncate font-black uppercase leading-tight tracking-wide ${nameCls}`}>{name}</h1>
          <p className={`mt-0.5 truncate font-semibold text-blue-100 ${compact ? 'text-[9px]' : 'text-xs'}`}>{role}</p>
          <p className={`mt-0.5 text-blue-200/90 ${compact ? 'text-[8px]' : 'text-[10px]'}`}>{t.cv}</p>
        </div>
        <div className={`min-w-[108px] max-w-[42%] shrink-0 space-y-2 text-right ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
          {contact.phone ? (
            <p className="leading-snug">
              <span className="block font-bold text-blue-200">{t.phone}</span>
              <span className="block whitespace-nowrap text-white">{contact.phone}</span>
            </p>
          ) : null}
          {contact.email ? (
            <p className="leading-snug">
              <span className="block font-bold text-blue-200">{t.email}</span>
              <span className="block break-all text-white">{contact.email}</span>
            </p>
          ) : null}
          {contact.location ? (
            <p className="leading-snug">
              <span className="block font-bold text-blue-200">{t.address}</span>
              <span className="block text-white">{contact.location}</span>
            </p>
          ) : null}
        </div>
      </header>

      <div className={`grid ${compact ? 'grid-cols-[38%_62%]' : 'grid-cols-[34%_66%]'}`}>
        <aside className="space-y-5 p-3" style={{backgroundColor: CV_THEME.sidebar}}>
          {contact.rest.filter((l) => l.length > 3 && l.length < 100).length ? (
            <SideSection title={t.personal} titleCls={titleCls} bodyCls={bodyCls}>
              <BulletList items={contact.rest} bodyCls={bodyCls} />
            </SideSection>
          ) : null}
          {parsed.languages.length ? (
            <SideSection title={t.languages} titleCls={titleCls} bodyCls={bodyCls}>
              <BulletList items={parsed.languages} bodyCls={bodyCls} />
            </SideSection>
          ) : null}
          {parsed.hobbies.length ? (
            <SideSection title={t.hobbies} titleCls={titleCls} bodyCls={bodyCls}>
              <BulletList items={parsed.hobbies} bodyCls={bodyCls} />
            </SideSection>
          ) : null}
          {parsed.skills.length ? (
            <SideSection title={t.skills} titleCls={titleCls} bodyCls={bodyCls}>
              <BulletList items={parsed.skills} bodyCls={bodyCls} />
            </SideSection>
          ) : null}
        </aside>

        <main className="space-y-5 bg-white p-3">
          {summary ? (
            <MainSection title={t.about} titleCls={titleCls} bodyCls={bodyCls}>
              <p className={`text-slate-700 ${bodyCls}`}>{summary}</p>
            </MainSection>
          ) : null}
          {parsed.education.length ? (
            <MainSection title={t.education} titleCls={titleCls} bodyCls={bodyCls}>
              {parsed.education.map((line, i) => {
                const edu = splitEducationLine(line);
                return (
                  <div key={i} className={`mb-2 ${bodyCls}`}>
                    <div className="flex justify-between gap-2">
                      <span className="font-bold text-slate-900">{edu.title}</span>
                      {edu.date ? <span className="shrink-0 font-semibold text-slate-500">{edu.date}</span> : null}
                    </div>
                    {edu.detail ? <p className="text-slate-600">{edu.detail}</p> : null}
                  </div>
                );
              })}
            </MainSection>
          ) : null}
          {experienceBlocks.length ? (
            <MainSection title={t.experience} titleCls={titleCls} bodyCls={bodyCls}>
              {experienceBlocks.map((block, i) => {
                const job = splitExperienceBlock(block);
                return (
                  <div key={i} className={`mb-3 ${bodyCls}`}>
                    <p className="font-bold text-slate-900">{job.title}</p>
                    {job.company ? <p className="font-semibold" style={{color: CV_THEME.accent}}>{job.company}</p> : null}
                    {job.body ? <p className="mt-1 text-slate-700">{job.body}</p> : null}
                  </div>
                );
              })}
            </MainSection>
          ) : null}
          {parsed.references.length ? (
            <MainSection title={t.references} titleCls={titleCls} bodyCls={bodyCls}>
              <BulletList items={parsed.references} bodyCls={bodyCls} />
            </MainSection>
          ) : null}
          {!summary && !parsed.education.length && !experienceBlocks.length && rawSource.length > 80 ? (
            <MainSection title={t.experience} titleCls={titleCls} bodyCls={bodyCls}>
              <p className={`whitespace-pre-wrap text-slate-700 ${bodyCls}`}>{rawSource.slice(0, 2500)}</p>
            </MainSection>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function SideSection({title, titleCls, bodyCls, children}: {title: string; titleCls: string; bodyCls: string; children: ReactNode}) {
  return (
    <section>
      <h3 className={`border-b pb-1 font-black uppercase tracking-wide ${titleCls}`} style={{color: CV_THEME.navyLight, borderColor: CV_THEME.line}}>
        {title}
      </h3>
      <div className={`mt-2 ${bodyCls}`}>{children}</div>
    </section>
  );
}

function MainSection({title, titleCls, bodyCls, children}: {title: string; titleCls: string; bodyCls: string; children: ReactNode}) {
  return (
    <section>
      <h3 className={`border-b pb-1 font-black uppercase tracking-wide ${titleCls}`} style={{color: CV_THEME.navyLight, borderColor: CV_THEME.line}}>
        {title}
      </h3>
      <div className={`mt-2 ${bodyCls}`}>{children}</div>
    </section>
  );
}

function BulletList({items, bodyCls}: {items: string[]; bodyCls: string}) {
  return (
    <ul className={`space-y-1 text-slate-700 ${bodyCls}`}>
      {items.slice(0, 14).map((item, i) => (
        <li key={i} className="flex gap-1.5">
          <span className="font-bold text-slate-400">■</span>
          <span className="min-w-0 flex-1">{item.replace(/^•\s*/, '')}</span>
        </li>
      ))}
    </ul>
  );
}
