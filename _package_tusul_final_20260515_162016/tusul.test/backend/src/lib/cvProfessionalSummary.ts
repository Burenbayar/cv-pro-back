import {type CvLanguage} from './cvSections.js';
import {isTechCv, resolveDisplayRole} from './cvProfession.js';
import {restoreMongolianWordSpacing} from './cvTextSpacing.js';

const SKILL_TOKEN =
  /\b(javascript|typescript|react|next\.?js|node\.?js|sql|postgresql|python|java|html|css|figma|mongodb|docker|aws|git|express|graphql|tailwind)\b/gi;

const INTEREST_RE =
  /сонирхол|зорилго|чиглэл|хүсэл|passion|objective|career goal|interested in|aim to|looking to|aspir/i;

export function isSkillHeavyAbout(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  const skillHits = (t.match(SKILL_TOKEN) || []).length;
  if (skillHits >= 3) return true;
  if (/зэрэг ур чадвартай|skills such as|with strengths in|ур чадвартай\./i.test(t)) return true;
  if (/^.{0,80}(javascript|react|node\.js)/i.test(t) && skillHits >= 2) return true;
  return false;
}

export function extractNarrativeFromCv(cvText: string): string[] {
  const lines = cvText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let capture = false;

  for (const line of lines) {
    const isProfileHeader = /^(profile|товч\s*танилцуулга|зорилго|objective|about\s*me|миний\s*тухай)$/i.test(line);
    if (isProfileHeader) {
      capture = true;
      continue;
    }
    if (capture && /^[A-ZА-ЯӨҮЁ0-9][^.]{0,48}$/.test(line) && /\d{4}|сургууль|university|college/i.test(line)) {
      capture = false;
    }
    if (capture && line.length > 30 && !isSkillHeavyAbout(line)) {
      chunks.push(line.replace(/^•\s*/g, '').trim());
    }
  }

  for (const block of cvText.split(/\n{2,}/)) {
    const t = block.trim().replace(/\s+/g, ' ');
    if (t.length < 45 || t.length > 900) continue;
    if (isSkillHeavyAbout(t)) continue;
    if (!INTEREST_RE.test(t) && !/программ|инженер|developer|оюутан|хөгжүүл|нягтлан|бүртгэл|accountant|санхүү/i.test(t)) continue;
    if (!chunks.some((c) => c.includes(t.slice(0, 40)))) chunks.push(t);
  }

  return chunks.slice(0, 3);
}

function stripSkillLists(text: string): string {
  return text
    .replace(SKILL_TOKEN, '')
    .replace(/\s*[,،]\s*[,،]+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/зэрэг ур чадвартай\.?/gi, '')
    .trim();
}

function polishSentences(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .replace(/([а-яөүёa-z])\s*-\s*/gi, '$1 ')
    .replace(/•\s*/g, ' ')
    .trim();
}

/** «Б. Солонго нь…» → «Миний бие…» */
export function convertToFirstPersonMn(text: string, displayName: string): string {
  let t = restoreMongolianWordSpacing(polishSentences(text));
  const name = displayName.trim();
  if (name) {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`${esc}\\s*ний?\\s*${esc}`, 'gi'), '');
    t = t.replace(new RegExp(`${esc}\\s*ний?\\s*`, 'gi'), '');
  }
  t = t.replace(/^[А-ЯӨҮЁA-Z]\.\s*[А-ЯӨҮЁA-Z]+\s*ний?\s*/u, '');
  t = t.replace(/^\S+(?:\s+\S+)?\s+нь\s+/i, '');
  t = t.trim();
  if (!/^миний\s*бие/i.test(t)) {
    t = `Миний бие ${t.replace(/^нь\s+/i, '')}`.trim();
  }
  return t.replace(/^(миний\s*бие\s+){2,}/i, 'Миний бие ').trim();
}

function dedupeSentences(text: string): string {
  const parts = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.slice(0, 50).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out.join(' ');
}

function buildMnHeuristic(opts: BuildAboutOpts): string {
  const role = resolveDisplayRole(opts.targetRole, opts.cvText, 'mn');
  const goals = opts.careerGoals?.trim();

  if (/нягтлан|бүртгэл|accountant|санхүү/i.test(opts.cvText)) {
    const parts = [
      `Миний бие ${role} мэргэжлээр ажилладаг. Санхүүгийн тайлан, данс бүртгэл, төлбөр тооцооны ажилд туршлагатай.`,
      `Үнэнч шударга, хариуцлагатай, эмх цэгцтэй ажиллах зарчмыг баримталдаг.`,
    ];
    if (goals) parts.push(goals.endsWith('.') ? goals : `${goals}.`);
    return polishSentences(dedupeSentences(parts.join(' ')));
  }

  if (isTechCv(opts.cvText)) {
    const parts = [
      `Миний бие ${role} чиглэлд ажилладаг. Бодит төсөл болон багийн ажилд оролцож, хэрэглэгчид үнэ цэн бүтээхэд чиглэсэн.`,
    ];
    if (goals) parts.push(goals.endsWith('.') ? goals : `${goals}.`);
    return polishSentences(parts.join(' '));
  }

  const parts = [
    `Миний бие ${role} мэргэжлээр ажилладаг, мэргэжлийн ёс зүй, хариуцлага, харилцааны ур чадварт анхаардаг.`,
  ];
  if (goals) parts.push(goals.endsWith('.') ? goals : `${goals}.`);
  return polishSentences(parts.join(' '));
}

function buildEnHeuristic(opts: BuildAboutOpts): string {
  const name = opts.displayName.trim();
  const role = resolveDisplayRole(opts.targetRole, opts.cvText, 'en');
  const goals = opts.careerGoals?.trim();
  const parts = [
    `${name} is a ${role} with a focus on professional responsibility, clear communication, and reliable delivery.`,
  ];
  if (goals) parts.push(goals.endsWith('.') ? goals : `${goals}.`);
  return polishSentences(parts.join(' '));
}

export type BuildAboutOpts = {
  cvText: string;
  targetRole: string;
  displayName: string;
  experienceLevel?: string;
  careerGoals?: string;
  language: CvLanguage;
  existingAbout?: string;
};

export function buildProfessionalAbout(opts: BuildAboutOpts): string {
  const finish = (text: string) => {
    const out = opts.language === 'mn' ? convertToFirstPersonMn(text, opts.displayName) : polishSentences(text);
    return dedupeSentences(out).slice(0, 520);
  };

  const existing = polishSentences(stripSkillLists(opts.existingAbout || ''));
  if (existing.length > 50 && !isSkillHeavyAbout(existing)) {
    return finish(existing);
  }

  const narratives = extractNarrativeFromCv(opts.cvText)
    .map((n) => polishSentences(stripSkillLists(n)))
    .filter((n) => n.length > 35 && !isSkillHeavyAbout(n));

  if (narratives.length) {
    const merged = polishSentences(narratives.join(' '));
    if (merged.length > 50) return finish(merged);
  }

  return finish(opts.language === 'mn' ? buildMnHeuristic(opts) : buildEnHeuristic(opts));
}
