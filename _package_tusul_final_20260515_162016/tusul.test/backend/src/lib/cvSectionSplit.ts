import type {ParsedCv} from './cvSections.js';

const INLINE_SECTION_RE =
  /(АЖЛЫН\s*ТУРШЛАГА|WORK\s*EXPERIENCE|БОЛОВСРОЛ|EDUCATION|МИНИЙ\s*ТУХАЙ|ХОЛБОО\s*БАРИХ|УР\s*ЧАДВАР|SKILLS)/gi;

const SECTION_KEY: Record<string, keyof ParsedCv> = {
  'ажлын туршлага': 'experience',
  'work experience': 'experience',
  'боловсрол': 'education',
  education: 'education',
  'миний тухай': 'about',
  'холбоо барих': 'contact',
  'ур чадвар': 'skills',
  skills: 'skills',
};

export function isLikelyJobLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length < 10) return false;
  if (/^(ажлын\s*туршлага|work\s*experience)$/i.test(t)) return false;
  if (/ххк|llc|ltd|банк|bank|компани|company|корпораци/i.test(t)) return true;
  if (/\d{4}\s*[-–—]\s*(\d{4}|одоо|present|өнөөг)/i.test(t) && /бодогч|нягтлан|manager|инженер|захирал|туслах|ахлах/i.test(t)) {
    return !/их\s*сургууль|college|university|бакалавр|магистр|сургууль|institute|диплом/i.test(t);
  }
  return false;
}

export function isLikelyEducationOnlyLine(line: string): boolean {
  const t = line.trim();
  if (isLikelyJobLine(t)) return false;
  return /их\s*сургууль|college|university|бакалавр|магистр|сургууль|institute|диплом|бэлтгэл|хөтөлбөр|MONICPA|CPA|МУИС/i.test(t);
}

/** Нэг мөрөн дотор наалдсан "АЖЛЫН ТУРШЛАГА" гэх мэтийг салгана */
export function splitLineByEmbeddedHeaders(line: string): Array<{text: string; section?: keyof ParsedCv}> {
  const out: Array<{text: string; section?: keyof ParsedCv}> = [];
  let rest = line.trim();
  if (!rest) return out;

  while (rest.length > 0) {
    INLINE_SECTION_RE.lastIndex = 0;
    const m = INLINE_SECTION_RE.exec(rest);
    if (!m || m.index === undefined) {
      out.push({text: rest});
      break;
    }
    const before = rest.slice(0, m.index).trim();
    if (before) out.push({text: before});
    const key = m[1].replace(/\s+/g, ' ').trim().toLowerCase();
    out.push({text: '', section: SECTION_KEY[key]});
    rest = rest.slice(m.index + m[0].length).trim();
  }
  return out;
}

/** Боловсрол массив дотор үлдсэн ажлын мөрүүдийг туршлага руу шилжүүлнэ */
export function repartitionEducationAndExperience(parsed: ParsedCv): ParsedCv {
  const education: string[] = [];
  const experience: string[] = [...parsed.experience];

  for (const raw of parsed.education) {
    const chunks = splitLineByEmbeddedHeaders(raw.replace(/^•\s*/, ''));
    let mode: keyof ParsedCv | 'education' = 'education';

    for (const chunk of chunks) {
      if (chunk.section) {
        mode = chunk.section === 'experience' ? 'experience' : chunk.section === 'education' ? 'education' : mode;
        continue;
      }
      const text = chunk.text.replace(/^•\s*/, '').trim();
      if (!text || /^(ажлын\s*туршлага|боловсрол)$/i.test(text)) continue;

      if (mode === 'experience' || isLikelyJobLine(text)) experience.push(text);
      else if (isLikelyEducationOnlyLine(text) || !isLikelyJobLine(text)) education.push(text);
      else experience.push(text);
    }
  }

  for (const raw of [...education]) {
    if (isLikelyJobLine(raw)) {
      education.splice(education.indexOf(raw), 1);
      experience.push(raw);
    }
  }

  return {...parsed, education, experience};
}
