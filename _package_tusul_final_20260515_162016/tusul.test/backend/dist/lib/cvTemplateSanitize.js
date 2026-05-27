import { buildProfessionalAbout, isSkillHeavyAbout } from './cvProfessionalSummary.js';
import { extractCandidateName, extractContact } from './cvSections.js';
const TECH_NAME_RE = /^(postgresql|javascript|typescript|react|next\.?js|node\.?js|python|java|sql|html|css|figma|mongodb|docker|aws|git|express|graphql)$/i;
export function normalizeCvTextForParse(text) {
    let t = text.trim();
    if (!t)
        return t;
    t = t.replace(/([A-ZА-ЯӨҮЁ])\s+(?=[A-ZА-ЯӨҮЁ])/gi, '$1');
    t = t.replace(/П\s*\.\s*БҮРЭНБАЯР/gi, 'П.БҮРЭНБАЯР');
    t = t.replace(/([^\n]{120,})/g, (line) => splitDenseLine(line).join('\n'));
    return t;
}
function splitDenseLine(line) {
    const parts = [];
    const re = /(\+?\d[\d\s-]{7,}\d|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
    let last = 0;
    let m;
    while ((m = re.exec(line)) !== null) {
        const before = line.slice(last, m.index).trim();
        if (before.length > 8)
            parts.push(before);
        parts.push(m[0].trim());
        last = m.index + m[0].length;
    }
    const tail = line.slice(last).trim();
    if (tail.length > 8)
        parts.push(tail);
    return parts.length ? parts : [line];
}
function isJunkLine(line) {
    const t = line.trim();
    if (!t || t.length > 220)
        return true;
    if (/^(?:(давуу|сул)\s*тал|холбоо\s*барих|чадвар|profile|postgresql|javascript)$/i.test(t) && t.length > 40)
        return true;
    if ((t.match(/[A-ZА-ЯӨҮЁ]{4,}/g) || []).length > 6 && t.length > 80)
        return true;
    return false;
}
export function sanitizeParsedForTemplate(parsed, rawCvText, fallbackSkills, context = {}) {
    const auto = extractContact(rawCvText);
    const phone = parsed.contact.find((l) => /\+?\d[\d\s-]{6,}/.test(l)) || auto.phone;
    const email = parsed.contact.find((l) => /@/.test(l)) || auto.email;
    const location = parsed.contact.find((l) => /улаанбаатар|mongolia/i.test(l)) || auto.location;
    const contact = [phone, email, location].filter(Boolean);
    const isGarbledContactLine = (line) => {
        const t = line.trim();
        if (t.length > 55 && !/\s/.test(t.slice(0, 40)))
            return true;
        if (/минийтухай|холбообарих|урчадвар/i.test(t.replace(/\s/g, '').toLowerCase()))
            return true;
        return false;
    };
    const rest = parsed.contact
        .filter((l) => l !== phone &&
        l !== email &&
        l !== location &&
        !isJunkLine(l) &&
        !isGarbledContactLine(l) &&
        l.length < 72)
        .slice(0, 4);
    let about = parsed.about.trim();
    if (!about || about.length > 500 || isJunkLine(about) || isSkillHeavyAbout(about)) {
        about = '';
    }
    about = buildProfessionalAbout({
        cvText: rawCvText,
        targetRole: context.targetRole || '',
        displayName: context.displayName || extractCandidateName(rawCvText) || '',
        experienceLevel: context.experienceLevel,
        language: context.language || 'mn',
        existingAbout: about,
    });
    const education = parsed.education
        .filter((l) => !isJunkLine(l) && (/\d{4}/.test(l) || /сургууль|institute|их сургууль|college|university|сэзис/i.test(l)))
        .slice(0, 6);
    const skills = (parsed.skills.length ? parsed.skills : fallbackSkills)
        .map((s) => s.replace(/^•\s*/, '').trim())
        .filter((s) => s.length > 1 && s.length < 40 && !isJunkLine(s))
        .slice(0, 14);
    const seen = new Set();
    const experience = parsed.experience
        .map((l) => l.trim())
        .filter((l) => {
        if (isJunkLine(l) || l.length < 12)
            return false;
        const key = l.slice(0, 80).toLowerCase();
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    })
        .slice(0, 8);
    return {
        contact: [...contact, ...rest],
        education,
        skills,
        languages: parsed.languages.filter((l) => l.length < 48).slice(0, 6),
        about: about.slice(0, 450),
        experience,
        references: parsed.references.filter((l) => l.length < 120).slice(0, 4),
    };
}
export function isTechSkillName(name) {
    return TECH_NAME_RE.test(name.trim());
}
