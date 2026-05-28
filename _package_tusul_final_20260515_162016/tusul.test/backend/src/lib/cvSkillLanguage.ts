import {restoreMongolianWordSpacing} from './cvTextSpacing.js';

const LANGUAGE_ENTRY_RE =
  /^(монгол|англи|english|орос|russian|хятад|япон|солонгос|герман|франц|korean|chinese|japanese)\b|төрөлх|native|fluent|beginner|intermediate|advanced|дунд|хэвийн|сайн|beginner|\(a[12]\)|\(b[12]\)|\(c[12]\)/i;

export function isLanguageEntry(item: string): boolean {
  const t = item.trim();
  if (!t) return false;
  if (/^хэл$/i.test(t) || /хэлний\s*мэдлэг/i.test(t)) return true;
  if (LANGUAGE_ENTRY_RE.test(t)) return true;
  if (/\([а-яөүёa-z\s-]{2,24}\)/i.test(t) && /монгол|англи|english|орос|хятад|япон/i.test(t)) return true;
  return false;
}

/** "ЗардлынменежментХЭЛ" → ур чадвар + хэл тусад */
export function splitGluedLanguageSuffix(item: string): {skill?: string; language?: string} {
  const m = item.match(/^(.+?)хэл$/i);
  if (!m || m[1].length < 4) return {language: isLanguageEntry(item) ? item : undefined};
  const skill = restoreMongolianWordSpacing(m[1].trim());
  return skill.length > 3 ? {skill} : {};
}

export function partitionSkillsAndLanguages(
  skills: string[],
  languages: string[],
): {skills: string[]; languages: string[]} {
  const outSkills: string[] = [];
  const outLang: string[] = languages.map((l) => restoreMongolianWordSpacing(l.replace(/^•\s*/, '').trim())).filter(Boolean);
  const seen = new Set(outLang.map((l) => l.toLowerCase()));

  const pushLang = (value: string) => {
    const v = value.trim();
    if (!v || seen.has(v.toLowerCase())) return;
    seen.add(v.toLowerCase());
    outLang.push(v);
  };

  for (const raw of skills) {
    let item = restoreMongolianWordSpacing(raw.replace(/^•\s*/, '').trim());
    if (!item || /^ур\s*чадвар|skills$/i.test(item)) continue;

    const glued = splitGluedLanguageSuffix(item);
    if (glued.skill) item = glued.skill;
    else if (!glued.language && item.match(/хэл$/i) && item.length > 8) {
      const onlySkill = restoreMongolianWordSpacing(item.replace(/хэл$/i, ''));
      if (onlySkill.length > 3) item = onlySkill;
    }

    if (isLanguageEntry(item)) {
      pushLang(item);
      continue;
    }

    if (item.length > 1) outSkills.push(item);
  }

  return {skills: outSkills, languages: outLang};
}
