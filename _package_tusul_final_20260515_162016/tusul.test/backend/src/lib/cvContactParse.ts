const SECTION_HEADER_RE =
  /^(миний\s*тухай|холбоо\s*барих|contact|боловсрол|education|ажлын\s*туршлага|work\s*experience|ур\s*чадвар|skills|сонирхол)/i;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /\+?\d[\d\s-]{7,}\d/;
const LOCATION_RE = /(?:улаанбаатар|ulaanbaatar|mongolia|сүхбаатар|баянзүрх|дүүрэг|хот)[^\n]*/i;

function stripSectionHeaders(text: string): string {
  return text
    .replace(/МИНИЙ\s*ТУХАЙ/gi, '\n')
    .replace(/ХОЛБОО\s*БАРИХ/gi, '\n')
    .replace(/ТОВЧ\s*ТАНИЛЦУУЛГА/gi, '\n');
}

export function splitContactFragments(line: string): string[] {
  let t = stripSectionHeaders(line.trim());
  if (!t) return [];

  const parts: string[] = [];
  const email = t.match(EMAIL_RE)?.[0];
  if (email) {
    const before = t.slice(0, t.indexOf(email)).trim();
    if (before.length > 6 && !SECTION_HEADER_RE.test(before)) parts.push(before);
    parts.push(email);
    t = t.slice(t.indexOf(email) + email.length).trim();
  }

  const phone = t.match(PHONE_RE)?.[0];
  if (phone) {
    const before = t.slice(0, t.indexOf(phone)).trim();
    if (before.length > 6) parts.push(before);
    parts.push(phone);
    t = t.slice(t.indexOf(phone) + phone.length).trim();
  }

  const loc = t.match(LOCATION_RE)?.[0];
  if (loc) {
    const before = t.slice(0, t.indexOf(loc)).trim();
    if (before.length > 6 && !/@/.test(before)) parts.push(before);
    parts.push(loc.trim());
    t = t.replace(loc, '').trim();
  }

  if (t.length > 6 && !SECTION_HEADER_RE.test(t)) parts.push(t);
  return parts.filter((p) => p.length > 2 && !SECTION_HEADER_RE.test(p));
}

export type ParsedContactFields = {
  phone: string;
  email: string;
  location: string;
  rest: string[];
};

export function parseContactFields(lines: string[]): ParsedContactFields {
  let phone = '';
  let email = '';
  let location = '';
  const rest: string[] = [];

  const fragments: string[] = [];
  for (const line of lines) fragments.push(...splitContactFragments(line));

  for (const raw of fragments) {
    const line = raw.trim();
    if (!line || SECTION_HEADER_RE.test(line)) continue;

    const emailHit = line.match(EMAIL_RE)?.[0];
    if (emailHit && !email) {
      email = emailHit;
      const after = line.slice(line.indexOf(emailHit) + emailHit.length).trim();
      if (after && LOCATION_RE.test(after)) location = after.match(LOCATION_RE)?.[0]?.trim() || after;
      else if (after.length > 6 && !PHONE_RE.test(after)) rest.push(after);
      continue;
    }

    if (PHONE_RE.test(line) && !phone) {
      phone = line.match(PHONE_RE)?.[0]?.trim() || line;
      continue;
    }

    if (LOCATION_RE.test(line) && !location) {
      location = line.match(LOCATION_RE)?.[0]?.trim() || line;
      continue;
    }

    if (!/@/.test(line) && line.length < 120) rest.push(line);
  }

  return {phone, email, location, rest};
}
