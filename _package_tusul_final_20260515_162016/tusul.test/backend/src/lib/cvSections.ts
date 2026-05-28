import {buildProfessionalAbout} from './cvProfessionalSummary.js';
import {partitionSkillsAndLanguages} from './cvSkillLanguage.js';
import {repartitionEducationAndExperience, splitLineByEmbeddedHeaders} from './cvSectionSplit.js';

export type CvLanguage = 'mn' | 'en';

export type ParsedCv = {
  contact: string[];
  education: string[];
  skills: string[];
  languages: string[];
  hobbies: string[];
  about: string;
  experience: string[];
  references: string[];
};

const HEADER_KEYS: Array<{key: keyof ParsedCv; patterns: RegExp[]}> = [
  {key: 'contact', patterns: [/^холбоо\s*барих/i, /^contact/i, /^холбогдох/i]},
  {key: 'education', patterns: [/^боловсрол/i, /^education/i, /^сургалт/i]},
  {key: 'skills', patterns: [/^ур\s*чадвар/i, /^skills/i, /^чадвар$/i, /^гол\s*ур\s*чадвар/i, /^core\s*skills/i]},
  {key: 'hobbies', patterns: [/^сонирхол/i, /^hobbies/i, /^interests/i, /^хобби/i]},
  {key: 'languages', patterns: [/^хэл(ний)?\s*мэдлэг/i, /^languages/i, /^хэл$/i]},
  {
    key: 'about',
    patterns: [
      /^миний\s*тухай/i,
      /^about(\s*me)?/i,
      /^мэргэжлийн\s*товч/i,
      /^professional\s*summary/i,
      /^товч\s*танилцуулга/i,
      /^зорилго/i,
      /^objective/i,
      /^profile$/i,
    ],
  },
  {key: 'experience', patterns: [/^ажлын\s*туршлага/i, /^work\s*experience/i, /^туршлаг/i, /^experience/i, /^ажил\s*туршилгаа/i, /^төсөл/i, /^projects/i, /^employment/i]},
  {key: 'references', patterns: [/^лавлагаа/i, /^references/i]},
];

function emptyParsed(): ParsedCv {
  return {contact: [], education: [], skills: [], languages: [], hobbies: [], about: '', experience: [], references: []};
}

function matchHeader(line: string): keyof ParsedCv | null {
  const t = line.trim().replace(/[:：]+$/g, '');
  if (t.length < 2 || t.length > 48) return null;
  for (const entry of HEADER_KEYS) {
    if (entry.patterns.some((p) => p.test(t))) return entry.key;
  }
  return null;
}

const INVALID_NAME_RE =
  /^(давуу\s*тал|сул\s*тал|давуу\s*талууд|сул\s*талууд|strengths?|weaknesses?|profile|чадвар|хувийн\s*мэдээлэл|товч\s*танилцуулга|зорилго|objective|summary|references|лавлагаа|холбоо\s*барих|contact|cv|resume|ангкет|боловсрол|education|ажил|experience|skills|үр\s*чадвар|ур\s*чадвар|миний\s*тухай|about|software\s*engineer|developer|программ\s*ханга|оюутан)$/i;

function isInvalidCandidateName(name: string): boolean {
  const t = name.trim().replace(/^•\s*/, '');
  if (!t || t.length < 2 || t.length > 64) return true;
  if (INVALID_NAME_RE.test(t)) return true;
  if (matchHeader(t)) return true;
  if (/^(давуу|сул)\s*тал/i.test(t)) return true;
  if (/@|\+?\d[\d\s-]{6,}|https?:\/\//i.test(t)) return true;
  if (/software\s*engineer|developer|программ|оюутан/i.test(t) && t.length > 24) return true;
  if (/^(postgresql|javascript|typescript|react|next\.?js|node\.?js|python|java|sql|html|css|figma|mongodb|docker|aws|git|express|graphql)$/i.test(t)) {
    return true;
  }
  return false;
}

function extractMongolianFormalName(cvText: string): string {
  const match =
    cvText.match(/(?:^|\n)\s*([А-ЯӨҮЁA-Z]\.\s*[А-ЯӨҮЁA-Z]{2,}(?:\s+[А-ЯӨҮЁA-Z]{2,})?)\s*(?:\n|$)/u) ||
    cvText.match(/[А-ЯӨҮЁA-Z]\.[А-ЯӨҮЁA-Z]{2,}/u);
  if (!match) return '';
  const name = (match[1] || match[0]).replace(/\s+/g, ' ').trim();
  return isInvalidCandidateName(name) ? '' : name;
}

function extractNameFromEmail(cvText: string): string {
  const email = cvText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  if (!email) return '';
  const local = email.split('@')[0]?.replace(/\d+/g, '').trim() || '';
  if (local.length < 4) return '';
  const parts = local.split(/[._-]/).filter((p) => p.length >= 2);
  if (!parts.length) return '';
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

function isLikelyPersonName(line: string): boolean {
  const t = line.trim().replace(/^•\s*/, '');
  if (isInvalidCandidateName(t)) return false;
  if (/^[А-ЯӨҮЁA-Z]\.[А-ЯӨҮЁA-Z]{2,}/u.test(t)) return true;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 4 || t.length > 48) return false;
  if (!words.every((w) => /^[\p{L}.\-]{2,}$/u.test(w))) return false;
  if (/^(javascript|react|node|python|java|sql|html|figma|next|postgresql|typescript|mongodb|docker|aws)/i.test(t)) return false;
  if (/^[A-Z]{5,}$/.test(t) && !/^[А-ЯӨҮЁ]{2,}$/.test(t)) return false;
  return true;
}

export function extractCandidateName(cvText: string): string {
  if (!cvText?.trim()) return '';

  const formal = extractMongolianFormalName(cvText);
  if (formal) return formal;

  const lines = cvText
    .split('\n')
    .map((l) => l.trim().replace(/^•\s*/, ''))
    .filter(Boolean);

  const candidates = lines.filter((line) => isLikelyPersonName(line));
  const dotted = candidates.find((l) => /^[А-ЯӨҮЁA-Z]\./u.test(l));
  if (dotted) return dotted;

  const caps = candidates.find((l) => /^[А-ЯӨҮЁ]{2,}(\s+[А-ЯӨҮЁ]{2,})?$/.test(l));
  if (caps) return caps;

  if (candidates.length) return candidates[0];

  const fromEmail = extractNameFromEmail(cvText);
  if (fromEmail && !isInvalidCandidateName(fromEmail)) return fromEmail;

  return '';
}

function normalizeNameKey(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function fullNameAppearsInCv(fullName: string, cvText: string): boolean {
  const key = normalizeNameKey(fullName);
  if (key.length < 4) return false;
  return normalizeNameKey(cvText).includes(key);
}

/** Хадгалагдсан нэр буруу (хэсгийн гарчиг) бол CV-ээс дахин олно */
export function resolveCandidateName(opts: {
  candidateName?: string;
  cvText: string;
  fullName?: string;
}): string {
  const cv = opts.cvText.trim();
  const extracted = extractCandidateName(cv);
  const stored = (opts.candidateName || '').trim();
  const fallback = (opts.fullName || '').trim();
  const fallbackValid = Boolean(fallback && !isInvalidCandidateName(fallback) && fallback.toLowerCase() !== 'candidate');

  if (fallbackValid && fullNameAppearsInCv(fallback, cv)) return fallback;
  if (stored && !isInvalidCandidateName(stored) && fullNameAppearsInCv(stored, cv)) return stored;
  if (extracted && fallbackValid && /^[А-ЯӨҮЁA-Z]\./u.test(extracted) && fullNameAppearsInCv(fallback, cv)) {
    return fallback;
  }
  if (extracted) return extracted;
  if (stored && !isInvalidCandidateName(stored)) return stored;
  if (fallbackValid) return fallback;
  return '';
}

function cleanAboutText(about: string): string {
  return about
    .replace(/^давуу\s*тал\s*нь\s*/i, '')
    .replace(/^сул\s*тал\s*нь\s*/i, '')
    .trim();
}

function isLikelySkillLine(line: string): boolean {
  return /^(javascript|react|node|python|java|sql|html|css|figma|next\.js|typescript)/i.test(line.trim());
}

function isLikelyExperienceBlock(block: string): boolean {
  return (
    block.length > 25 &&
    (/\d{4}/.test(block) ||
      /project|төсөл|developed|built|created|website|app|platform|систем|хөгжүүл|ажил|intern|company|llc|ххк/i.test(block))
  );
}

function isLikelyEducationLine(line: string): boolean {
  return /их сургууль|college|university|сургууль|боловсрол|institute|академи|school|диплом|bachelor|master|бакалавр/i.test(line);
}

export type EnrichCvContext = {
  language?: CvLanguage;
  targetRole?: string;
  displayName?: string;
  experienceLevel?: string;
  careerGoals?: string;
};

/** rewrittenCv + эх CV текстийг нэгтгэж бүх хэсгийг бөглөнө */
export function enrichParsedCv(
  parsed: ParsedCv,
  rawCvText: string,
  fallbackSkills: string[] = [],
  context: EnrichCvContext = {},
): ParsedCv {
  const out: ParsedCv = {
    contact: [...parsed.contact],
    education: [...parsed.education],
    skills: parsed.skills.length ? [...parsed.skills] : fallbackSkills.map((s) => s.replace(/^•\s*/, '')),
    languages: [...parsed.languages],
    hobbies: [...parsed.hobbies],
    about: parsed.about,
    experience: [...parsed.experience],
    references: [...parsed.references],
  };

  const raw = rawCvText.trim();
  if (!raw) return out;

  const fromRaw = parseCvSections(raw);
  const auto = extractContact(raw);

  if (!out.contact.length) {
    out.contact = fromRaw.contact.length
      ? fromRaw.contact
      : [auto.phone, auto.email, auto.location].filter(Boolean);
  }

  if (!out.education.length && fromRaw.education.length) out.education = fromRaw.education;

  if (!out.skills.length) {
    out.skills = fromRaw.skills.length ? fromRaw.skills : fallbackSkills.map((s) => s.replace(/^•\s*/, ''));
  }

  if (!out.languages.length && fromRaw.languages.length) out.languages = fromRaw.languages;

  if (!out.hobbies.length && fromRaw.hobbies.length) out.hobbies = fromRaw.hobbies;

  if (!out.about.trim()) {
    out.about = fromRaw.about.trim();
  }

  if (!out.about.trim()) {
    const intro = raw
      .split(/\n{2,}/)
      .map((b) => b.trim())
      .find((b) => {
        const first = (b.split('\n')[0] || '').trim();
        if (INVALID_NAME_RE.test(first) || /^(давуу|сул)\s*тал/i.test(first)) return false;
        return b.length > 40 && b.length < 600 && !matchHeader(first) && !isLikelySkillLine(b);
      });
    if (intro) out.about = cleanAboutText(intro.replace(/\n/g, ' '));
  }

  if (out.about.trim()) out.about = cleanAboutText(out.about);

  if (!out.experience.length) {
    out.experience = fromRaw.experience.length ? fromRaw.experience : out.experience;
  }

  if (!out.experience.length) {
    const blocks = raw
      .split(/\n{2,}/)
      .map((b) => b.trim())
      .filter((b) => isLikelyExperienceBlock(b));
    if (blocks.length) {
      out.experience = blocks;
    } else {
      const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 15);
      const expLines = lines.filter(
        (l) =>
          !matchHeader(l) &&
          !isLikelySkillLine(l) &&
          !isLikelyEducationLine(l) &&
          !/@|\+?\d{8,}/.test(l) &&
          (/\d{4}/.test(l) || /project|төсөл|developed|хөгжүүл|built|app|website|platform|систем/i.test(l) || l.length > 50),
      );
      if (expLines.length) out.experience = expLines.slice(0, 20);
    }
  }

  if (!out.education.length) {
    const eduLines = raw.split('\n').map((l) => l.trim()).filter((l) => isLikelyEducationLine(l));
    if (eduLines.length) out.education = eduLines;
  }

  if (!out.references.length && fromRaw.references.length) out.references = fromRaw.references;

  const lang = context.language || 'mn';
  out.about = buildProfessionalAbout({
    cvText: raw,
    targetRole: context.targetRole || '',
    displayName: context.displayName || extractCandidateName(raw) || '',
    experienceLevel: context.experienceLevel,
    careerGoals: context.careerGoals,
    language: lang,
    existingAbout: out.about,
  });

  const split = partitionSkillsAndLanguages(out.skills, out.languages);
  out.skills = split.skills;
  out.languages = split.languages;

  return repartitionEducationAndExperience(out);
}

export function extractContact(cv: string) {
  return {
    email: cv.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '',
    phone: cv.match(/(\+?\d[\d\s-]{7,}\d)/)?.[0]?.trim() || '',
    location:
      cv.match(/(?:Улаанбаатар|Ulaanbaatar|Монгол улс)[^\n]*/i)?.[0]?.trim() ||
      (cv.match(/[өүэ]/i) ? 'Монгол улс, Улаанбаатар' : ''),
  };
}

export function parseCvSections(text: string): ParsedCv {
  const parsed = emptyParsed();
  if (!text?.trim()) return parsed;

  let current: keyof ParsedCv | 'about' | null = null;
  const aboutLines: string[] = [];

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const header = matchHeader(line);
    if (header) {
      current = header;
      continue;
    }

    if (!current) {
      if (/^\+?\d|@/.test(line) || /улаанбаатар|mongolia/i.test(line)) {
        parsed.contact.push(line);
      } else if (line.length > 20) {
        aboutLines.push(line);
      }
      continue;
    }

    if (current === 'contact' && line.length > 100) {
      const auto = extractContact(line);
      if (auto.phone) parsed.contact.push(auto.phone);
      if (auto.email) parsed.contact.push(auto.email);
      if (auto.location) parsed.contact.push(auto.location);
      continue;
    }

    if (current === 'about') {
      aboutLines.push(line);
      continue;
    }

    const embedded = splitLineByEmbeddedHeaders(line);
    if (embedded.length > 1 || embedded.some((c) => c.section)) {
      for (const chunk of embedded) {
        if (chunk.section) {
          current = chunk.section === 'about' ? 'about' : chunk.section;
          continue;
        }
        const text = chunk.text.trim();
        if (!text) continue;
        if (current === 'about') aboutLines.push(text);
        else if (current === 'experience') parsed.experience.push(text);
        else if (current) parsed[current].push(text);
      }
      continue;
    }

    if (current === 'experience') parsed.experience.push(line);
    else if (current) parsed[current].push(line);
  }

  parsed.about = aboutLines.join(' ').trim();

  if (!parsed.experience.length && text.length > 40) {
    const blocks = text
      .split(/\n{2,}/)
      .map((b) => b.trim())
      .filter((b) => isLikelyExperienceBlock(b));
    parsed.experience = blocks.length
      ? blocks
      : text
          .split(/\n{2,}/)
          .map((b) => b.trim())
          .filter((b) => b.length > 20 && !matchHeader(b.split('\n')[0] || ''))
          .slice(0, 8);
  }

  if (parsed.experience.length && parsed.experience.every((l) => l.length < 100)) {
    const merged = parsed.experience.join('\n');
    if (merged.length > 200) {
      parsed.experience = text
        .split(/\n{2,}/)
        .map((b) => b.trim())
        .filter((b) => isLikelyExperienceBlock(b))
        .slice(0, 8);
      if (!parsed.experience.length) parsed.experience = [merged];
    }
  }

  return repartitionEducationAndExperience(parsed);
}

function headerLine(lang: CvLanguage, key: keyof ParsedCv): string {
  const mn: Record<string, string> = {
    contact: 'ХОЛБОО БАРИХ',
    education: 'БОЛОВСРОЛ',
    skills: 'УР ЧАДВАР',
    languages: 'ХЭЛ',
    about: 'МИНИЙ ТУХАЙ',
    experience: 'АЖЛЫН ТУРШЛАГА',
    references: 'ЛАВЛАГА',
  };
  const en: Record<string, string> = {
    contact: 'CONTACT',
    education: 'EDUCATION',
    skills: 'SKILLS',
    languages: 'LANGUAGES',
    about: 'ABOUT ME',
    experience: 'WORK EXPERIENCE',
    references: 'REFERENCES',
  };
  return (lang === 'mn' ? mn : en)[key] || key.toUpperCase();
}

export function buildStructuredRewrittenCv(opts: {
  fullName: string;
  targetRole: string;
  cvText: string;
  skills: string[];
  summary: string;
  experienceLevel?: string;
  language: CvLanguage;
}): string {
  const fromSource = parseCvSections(opts.cvText);
  const auto = extractContact(opts.cvText);
  const lines: string[] = [];

  const pushSection = (key: keyof ParsedCv, body: string[]) => {
    const items = body.map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    lines.push(headerLine(opts.language, key));
    items.forEach((item) => lines.push(item.startsWith('•') ? item : item));
    lines.push('');
  };

  const contactLines =
    fromSource.contact.length > 0
      ? fromSource.contact
      : [auto.phone, auto.email, auto.location].filter(Boolean);

  pushSection('contact', contactLines);
  pushSection('education', fromSource.education);
  pushSection(
    'skills',
    fromSource.skills.length ? fromSource.skills : opts.skills.map((s) => `• ${s}`),
  );
  pushSection('languages', fromSource.languages);

  const about =
    fromSource.about ||
    opts.summary ||
    (opts.language === 'mn'
      ? `${opts.experienceLevel || ''} ${opts.targetRole} чиглэлд мэргэжлийн туршлагатай.`.trim()
      : `Professional background aligned with ${opts.targetRole}.`);

  if (about) {
    lines.push(headerLine(opts.language, 'about'));
    lines.push(about);
    lines.push('');
  }

  const experience =
    fromSource.experience.length > 0
      ? fromSource.experience
      : opts.cvText
          .split(/\n{2,}/)
          .map((b) => b.trim())
          .filter((b) => b.length > 18)
          .slice(0, 6);

  pushSection('experience', experience);
  pushSection('references', fromSource.references);

  return lines.join('\n').trim();
}

/** CV-ийн бодит текстээс шинэ, бүтэцлэгдсэн сайжруулсан CV (AI байхгүй үед) */
export function buildImprovedCvFromSource(opts: {
  fullName: string;
  targetRole: string;
  cvText: string;
  skills: string[];
  summary: string;
  experienceLevel?: string;
  language: CvLanguage;
}): string {
  const cleanText = opts.cvText
    .replace(/([A-ZА-ЯӨҮЁ])\s+(?=[A-ZА-ЯӨҮЁ])/gi, '$1')
    .replace(/П\s*\.\s*БҮРЭНБАЯР/gi, 'П.БҮРЭНБАЯР');
  const fromSource = parseCvSections(cleanText);
  const auto = extractContact(cleanText);
  const lines: string[] = [];

  const pushSection = (key: keyof ParsedCv, body: string[]) => {
    const items = body.map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    lines.push(headerLine(opts.language, key));
    items.forEach((item) => {
      const line = item.startsWith('•') ? item : item.length > 60 ? item : `• ${item}`;
      lines.push(line);
    });
    lines.push('');
  };

  const contactLines =
    fromSource.contact.length > 0
      ? fromSource.contact
      : [auto.phone, auto.email, auto.location].filter(Boolean);

  pushSection('contact', contactLines);
  pushSection('education', fromSource.education);
  pushSection(
    'skills',
    fromSource.skills.length ? fromSource.skills : opts.skills.map((s) => `• ${s}`),
  );
  pushSection('languages', fromSource.languages);

  const displayName = resolveCandidateName({candidateName: opts.fullName, cvText: cleanText, fullName: opts.fullName}) || opts.fullName;
  const about = buildProfessionalAbout({
    cvText: cleanText,
    targetRole: opts.targetRole,
    displayName,
    experienceLevel: opts.experienceLevel,
    careerGoals: opts.summary,
    language: opts.language,
    existingAbout: cleanAboutText(fromSource.about.trim()),
  });

  if (about) {
    lines.push(headerLine(opts.language, 'about'));
    lines.push(about);
    lines.push('');
  }

  let experience = fromSource.experience;
  if (!experience.length && cleanText.length > 40) {
    experience = cleanText
      .split(/\n{2,}/)
      .map((b) => b.trim())
      .filter((b) => b.length > 18 && !matchHeader(b.split('\n')[0] || ''))
      .slice(0, 8);
  }

  pushSection('experience', experience);
  pushSection('references', fromSource.references);

  return lines.join('\n').trim();
}

/** МИНИЙ ТУХАЙ хэсгийг шинэчилнэ (preview/PDF-д зориулсан) */
export function injectAboutSection(rewrittenCv: string, aboutText: string, language: CvLanguage): string {
  const about = aboutText.trim();
  if (!about) return rewrittenCv;

  const header = headerLine(language, 'about');
  const lines = rewrittenCv.split('\n');
  const out: string[] = [];
  let i = 0;
  let replaced = false;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    const section = matchHeader(trimmed);
    if (section === 'about') {
      out.push(header);
      out.push(about);
      out.push('');
      replaced = true;
      i += 1;
      while (i < lines.length && !matchHeader(lines[i].trim())) i += 1;
      continue;
    }
    out.push(lines[i]);
    i += 1;
  }

  if (!replaced) {
    const skillsIdx = out.findIndex((l) => matchHeader(l.trim()) === 'skills');
    const insertAt = skillsIdx >= 0 ? skillsIdx : out.length;
    out.splice(insertAt, 0, header, about, '');
  }

  return out.join('\n').trim();
}

export function mergeContactIntoCv(rewrittenCv: string, cvText: string, lang: CvLanguage): string {
  const parsed = parseCvSections(rewrittenCv);
  if (parsed.contact.length > 0) return rewrittenCv;

  const auto = extractContact(cvText);
  const fromSource = parseCvSections(cvText);
  const contactLines =
    fromSource.contact.length > 0
      ? fromSource.contact
      : [auto.phone, auto.email, auto.location].filter(Boolean);

  if (!contactLines.length) return rewrittenCv;

  const header = headerLine(lang, 'contact');
  const block = [header, ...contactLines, ''].join('\n');
  return `${block}\n${rewrittenCv}`.trim();
}
