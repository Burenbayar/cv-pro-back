import type {CvLanguage} from './cvSections.js';

const GENERIC_TARGET_RE =
  /^(software engineer|full[\s-]?stack|web developer|frontend|backend developer|developer|programmer|generalist|it specialist|программ|хөгжүүлэгч|инженер|оюутан)$/i;

const DOMAIN_HINTS: Array<{re: RegExp; mn: string; en: string}> = [
  {re: /нягтлан|accountant|бүртгэл|санхүү|ifrs|quickbooks|1c|sap/i, mn: 'Нягтлан бодогч', en: 'Accountant'},
  {re: /сувилгаан|nurse|эмч|эрүүл мэнд/i, mn: 'Сувилагч', en: 'Nurse'},
  {re: /багш|teacher|боловсролын/i, mn: 'Багш', en: 'Teacher'},
  {re: /худалдаа|sales|борлуулалт/i, mn: 'Борлуулалтын мэргэжилтэн', en: 'Sales professional'},
  {re: /hr|хүний нөөц/i, mn: 'Хүний нөөцийн мэргэжилтэн', en: 'HR specialist'},
  {re: /маркетинг|marketing/i, mn: 'Маркетингийн мэргэжилтэн', en: 'Marketing specialist'},
  {re: /дизайн|designer|figma/i, mn: 'Дизайнер', en: 'Designer'},
  {re: /react|node\.?js|typescript|javascript|программ|developer|software/i, mn: 'Программ хангамжийн инженер', en: 'Software Engineer'},
];

export function isTechCv(cvText: string): boolean {
  const t = cvText.toLowerCase();
  const hits = (t.match(/\b(react|node\.?js|typescript|javascript|python|java|sql|docker|aws)\b/g) || []).length;
  return hits >= 2;
}

export function isGenericTargetRole(role: string): boolean {
  const t = role.trim();
  if (!t) return true;
  if (GENERIC_TARGET_RE.test(t)) return true;
  if (/software engineer/i.test(t) && t.length < 40) return true;
  return false;
}

export function inferProfessionFromCv(cvText: string, lang: CvLanguage): string {
  if (!cvText?.trim()) return '';

  const titleLine = cvText
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /нягтлан|accountant|developer|engineer|багш|nurse|дизайн/i.test(l) && l.length < 90);
  if (titleLine) {
    const cleaned = titleLine.replace(/^[\d•\-\s]+/, '').slice(0, 56);
    if (cleaned.length > 4) return cleaned;
  }

  for (const hint of DOMAIN_HINTS) {
    if (hint.re.test(cvText)) return lang === 'mn' ? hint.mn : hint.en;
  }
  return '';
}

/** Header subtitle: CV-ийн бодит мэргэжил; job description-ийг бүү холь */
export function resolveDisplayRole(targetRole: string, cvText: string, lang: CvLanguage): string {
  const trimmed = targetRole.trim().replace(/^[\d•\-\s]+/, '');
  const inferred = inferProfessionFromCv(cvText, lang);
  const looksLikeJobBlob =
    trimmed.length > 72 ||
    /^[•\-–]/.test(trimmed) ||
    (trimmed.match(/[•\n]/g) || []).length >= 2 ||
    /сонирхолтой|шинэ төгсөгч|чиглэлд/i.test(trimmed);

  if (inferred && (looksLikeJobBlob || isGenericTargetRole(trimmed))) return inferred;
  if (!trimmed) return inferred || (lang === 'mn' ? 'Мэргэжилтэн' : 'Professional');
  if (looksLikeJobBlob && inferred) return inferred;
  if (trimmed.length > 56) return trimmed.split(/\n/)[0].replace(/^[•\-\s]+/, '').slice(0, 56);
  return trimmed;
}
