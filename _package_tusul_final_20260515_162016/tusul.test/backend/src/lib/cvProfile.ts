import type {CvLanguage} from './cvSections.js';

export type CvProfile = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  hobbies: string[];
  skills: string[];
  languages: string[];
  education: string[];
  experience: string[];
  summary: string;
};

function toLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v || '').trim()).filter(Boolean);
}

export function parseCvProfile(raw: unknown): CvProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const profile: CvProfile = {
    fullName: String(p.fullName || p.candidateName || '').trim(),
    phone: String(p.phone || '').trim(),
    email: String(p.email || '').trim(),
    address: String(p.address || '').trim(),
    hobbies: toLines(p.hobbies),
    skills: toLines(p.skills),
    languages: toLines(p.languages),
    education: toLines(p.education),
    experience: toLines(p.experience),
    summary: String(p.summary || '').trim(),
  };
  const hasData =
    profile.fullName ||
    profile.phone ||
    profile.email ||
    profile.summary ||
    profile.skills.length ||
    profile.experience.length;
  return hasData ? profile : null;
}

function sectionHeader(key: keyof CvProfile, lang: CvLanguage): string | null {
  const mn: Partial<Record<keyof CvProfile, string>> = {
    hobbies: 'СОНИРХОЛ',
    skills: 'УР ЧАДВАР',
    languages: 'ХЭЛ',
    summary: 'МИНИЙ ТУХАЙ',
    education: 'БОЛОВСРОЛ',
    experience: 'АЖЛЫН ТУРШЛАГА',
  };
  const en: Partial<Record<keyof CvProfile, string>> = {
    hobbies: 'INTERESTS',
    skills: 'SKILLS',
    languages: 'LANGUAGES',
    summary: 'PROFESSIONAL SUMMARY',
    education: 'EDUCATION',
    experience: 'WORK EXPERIENCE',
  };
  const map = lang === 'mn' ? mn : en;
  return map[key] ?? null;
}

export function buildCvTextFromProfile(profile: CvProfile, lang: CvLanguage): string {
  const lines: string[] = [];
  const contact: string[] = [];
  if (profile.phone) contact.push(profile.phone);
  if (profile.email) contact.push(profile.email);
  if (profile.address) contact.push(profile.address);
  if (contact.length) {
    lines.push(lang === 'mn' ? 'ХОЛБОО БАРИХ' : 'CONTACT', ...contact, '');
  }
  const pushList = (key: keyof CvProfile, items: string[]) => {
    if (!items.length) return;
    const h = sectionHeader(key, lang);
    if (h) lines.push(h, ...items.map((i) => `• ${i}`), '');
  };
  if (profile.summary) pushList('summary', [profile.summary]);
  pushList('hobbies', profile.hobbies);
  pushList('skills', profile.skills);
  pushList('languages', profile.languages);
  pushList('education', profile.education);
  pushList('experience', profile.experience);
  return lines.join('\n').trim();
}

export function mergeAnalysisWithCvProfile(
  input: Record<string, unknown>,
  language: CvLanguage,
): Record<string, unknown> {
  const profile = parseCvProfile(input.cvProfile);
  if (!profile) return input;
  const fromProfile = buildCvTextFromProfile(profile, language);
  return {
    ...input,
    candidateName: profile.fullName || input.candidateName,
    summary: profile.summary || input.summary,
    skills: profile.skills.length ? profile.skills : input.skills,
    rewrittenCv: fromProfile || input.rewrittenCv,
    cvProfile: profile,
  };
}

/** OpenAI / Gemini JSON schema fragment */
export const cvProfileJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['fullName', 'phone', 'email', 'address', 'hobbies', 'skills', 'languages', 'education', 'experience', 'summary'],
  properties: {
    fullName: {type: 'string'},
    phone: {type: 'string'},
    email: {type: 'string'},
    address: {type: 'string'},
    hobbies: {type: 'array', items: {type: 'string'}},
    skills: {type: 'array', items: {type: 'string'}},
    languages: {type: 'array', items: {type: 'string'}},
    education: {type: 'array', items: {type: 'string'}},
    experience: {type: 'array', items: {type: 'string'}},
    summary: {type: 'string'},
  },
};
