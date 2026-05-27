const SKILL_TOKEN = /\b(javascript|typescript|react|next\.?js|node\.?js|sql|postgresql|python|java|html|css|figma|mongodb|docker|aws|git|express|graphql|tailwind)\b/gi;
const INTEREST_RE = /сонирхол|зорилго|чиглэл|хүсэл|passion|objective|career goal|interested in|aim to|looking to|aspir/i;
export function isSkillHeavyAbout(text) {
    const t = text.trim();
    if (!t)
        return false;
    const skillHits = (t.match(SKILL_TOKEN) || []).length;
    if (skillHits >= 3)
        return true;
    if (/зэрэг ур чадвартай|skills such as|with strengths in|ур чадвартай\./i.test(t))
        return true;
    if (/^.{0,80}(javascript|react|node\.js)/i.test(t) && skillHits >= 2)
        return true;
    return false;
}
/** CV-ийн PROFILE / зорилго / сонирхол агуулсан өгүүлбэрүүд */
export function extractNarrativeFromCv(cvText) {
    const lines = cvText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    const chunks = [];
    let capture = false;
    for (const line of lines) {
        const isProfileHeader = /^(profile|товч\s*танилцуулга|зорилго|objective|about\s*me|миний\s*тухай)$/i.test(line);
        if (isProfileHeader) {
            capture = true;
            continue;
        }
        if (capture && /^[A-ZА-ЯӨҮЁ0-9][^.]{0,48}$/.test(line) && /\d{4}|mind academy|сэзис|university|bagsh|developer/i.test(line)) {
            capture = false;
        }
        if (capture && line.length > 30 && !isSkillHeavyAbout(line)) {
            chunks.push(line);
        }
    }
    for (const block of cvText.split(/\n{2,}/)) {
        const t = block.trim().replace(/\s+/g, ' ');
        if (t.length < 45 || t.length > 900)
            continue;
        if (!INTEREST_RE.test(t) && !/программ|инженер|developer|student|оюутан|хөгжүүл/i.test(t))
            continue;
        if (isSkillHeavyAbout(t))
            continue;
        if (!chunks.some((c) => c.includes(t.slice(0, 40))))
            chunks.push(t);
    }
    return chunks.slice(0, 4);
}
function stripSkillLists(text) {
    return text
        .replace(SKILL_TOKEN, '')
        .replace(/\s*[,،]\s*[,،]+/g, ',')
        .replace(/\s{2,}/g, ' ')
        .replace(/зэрэг ур чадвартай\.?/gi, '')
        .trim();
}
function polishSentences(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.])/g, '$1')
        .replace(/([а-яөүёa-z])\s*-\s*/gi, '$1 ')
        .trim();
}
function buildMnHeuristic(opts) {
    const name = opts.displayName.trim();
    const role = opts.targetRole.trim() || 'Software Engineer';
    const level = opts.experienceLevel?.trim() || 'мэргэжлийн';
    const goals = opts.careerGoals?.trim();
    const interests = [];
    const raw = opts.cvText.toLowerCase();
    if (/вэб|web/i.test(raw))
        interests.push('вэб хөгжүүлэлт');
    if (/хиймэл оюун|ai\b/i.test(raw))
        interests.push('хиймэл оюунд суурилсан шийдэл');
    if (/мобайл|mobile/i.test(raw))
        interests.push('мобайл аппликейшн');
    if (/backend|сервер/i.test(raw))
        interests.push('backend систем');
    const interestPhrase = interests.length ? interests.join(', ') : `${role} чиглэл`;
    const parts = [
        `${name} нь ${interestPhrase}-д сонирхолтой, ${level} түвшний мэргэжилтэн.`,
        `Бодит төсөл болон багийн ажилд оролцож, хэрэглэгчид үнэ цэн бүтээх систем хөгжүүлэх чиглэлд туршлага хуримтлуулсан.`,
        `${role} мэргэжлээр Монголын IT салбарт ур суурь тавих, шинэ технологийг суралцаж практикт нэвтрүүлэх зорилготой.`,
    ];
    if (goals)
        parts.push(goals.endsWith('.') ? goals : `${goals}.`);
    return polishSentences(parts.join(' '));
}
function buildEnHeuristic(opts) {
    const name = opts.displayName.trim();
    const role = opts.targetRole.trim() || 'Software Engineer';
    const goals = opts.careerGoals?.trim();
    const parts = [
        `${name} is a motivated ${role} focused on building practical digital products and growing through real project work.`,
        `Interested in web development and applied technology solutions, with a clear goal of contributing measurable value to users and teams.`,
    ];
    if (goals)
        parts.push(goals.endsWith('.') ? goals : `${goals}.`);
    return polishSentences(parts.join(' '));
}
/** Ур чадварын жагсаалтгүй мэргэжлийн товч танилцуулга / зорилго */
export function buildProfessionalAbout(opts) {
    const existing = polishSentences(stripSkillLists(opts.existingAbout || ''));
    if (existing.length > 50 && !isSkillHeavyAbout(existing)) {
        return existing.slice(0, 520);
    }
    const narratives = extractNarrativeFromCv(opts.cvText)
        .map((n) => polishSentences(stripSkillLists(n)))
        .filter((n) => n.length > 35 && !isSkillHeavyAbout(n));
    if (narratives.length) {
        const merged = polishSentences(narratives.join(' '));
        if (merged.length > 50)
            return merged.slice(0, 520);
    }
    const generated = opts.language === 'mn' ? buildMnHeuristic(opts) : buildEnHeuristic(opts);
    return generated.slice(0, 520);
}
