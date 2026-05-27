import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createRequire } from 'module';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { analyzeCvWithGemini } from './lib/geminiAnalysis.js';
import { buildImprovedCvFromSource, extractCandidateName, injectAboutSection, mergeContactIntoCv, parseCvSections, resolveCandidateName, } from './lib/cvSections.js';
import { buildProfessionalAbout } from './lib/cvProfessionalSummary.js';
import { createProfessionalCvPdf } from './lib/professionalCvPdf.js';
const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const app = express();
const PORT = Number(process.env.PORT || 3000);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const JWT_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'career-advisor-local-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);
class ApiError extends Error {
    statusCode;
    code;
    constructor(code, message, statusCode = 400) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
    }
}
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        const name = String(file.originalname || '').toLowerCase();
        const ok = file.mimetype === 'application/pdf' ||
            file.mimetype === 'text/plain' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            name.endsWith('.pdf') ||
            name.endsWith('.txt') ||
            name.endsWith('.docx');
        cb(ok ? null : new ApiError('UNSUPPORTED_FILE_TYPE', 'Only PDF, DOCX, and TXT files are supported.'), ok);
    },
});
const dataDir = path.join(backendRoot, 'data');
const dbPath = path.join(dataDir, 'app-db.json');
const emptyDb = { users: [], sessions: [], histories: [] };
app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', req.path.startsWith('/api') ? 'no-store' : 'public, max-age=300');
    next();
});
function ensureDb() {
    if (!fs.existsSync(dataDir))
        fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(dbPath))
        fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2), 'utf8');
}
function readDb() {
    ensureDb();
    try {
        const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        return {
            users: Array.isArray(parsed.users) ? parsed.users : [],
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
            histories: Array.isArray(parsed.histories) ? parsed.histories : [],
        };
    }
    catch {
        fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2), 'utf8');
        return { ...emptyDb };
    }
}
function writeDb(db) {
    ensureDb();
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}
function success(res, data, message = 'Success', meta = {}) {
    res.json({ success: true, data, message, meta });
}
function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}
function sanitizeUser(user) {
    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        preferredLanguage: user.preferredLanguage,
        createdAt: user.createdAt,
    };
}
function getBearerToken(req) {
    const header = req.headers.authorization || '';
    return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}
function createToken(user) {
    const tokenId = randomUUID();
    const token = jwt.sign({ sub: user.id, email: user.email, jti: tokenId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, issuer: 'ai-career-advisor', audience: 'ai-career-advisor-users' });
    const decoded = jwt.decode(token);
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : new Date(Date.now() + 604800000).toISOString();
    return { token, tokenId, expiresAt };
}
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET, { issuer: 'ai-career-advisor', audience: 'ai-career-advisor-users' });
    }
    catch {
        return null;
    }
}
function getAuthUser(req) {
    const token = getBearerToken(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload?.sub || !payload?.jti)
        return null;
    const db = readDb();
    const session = db.sessions.find((item) => item.userId === payload.sub && item.tokenId === payload.jti);
    if (!session || new Date(session.expiresAt).getTime() <= Date.now())
        return null;
    const user = db.users.find((item) => item.id === payload.sub);
    return user || null;
}
function requireAuth(req) {
    const user = getAuthUser(req);
    if (!user)
        throw new ApiError('AUTH_REQUIRED', 'Please sign in to access this resource.', 401);
    return user;
}
function asyncRoute(handler) {
    return (req, res, next) => {
        handler(req, res, next).catch(next);
    };
}
function getLanguage(value) {
    return value === 'mn' ? 'mn' : 'en';
}
function detectSkills(text) {
    const keywords = [
        'JavaScript',
        'TypeScript',
        'React',
        'Next.js',
        'Node.js',
        'Express',
        'SQL',
        'PostgreSQL',
        'MongoDB',
        'HTML',
        'CSS',
        'Tailwind',
        'REST API',
        'GraphQL',
        'Docker',
        'AWS',
        'Git',
        'Testing',
        'Figma',
        'Data Analysis',
        'Communication',
        'Leadership',
    ];
    const lower = text.toLowerCase();
    return keywords.filter((skill) => lower.includes(skill.toLowerCase()));
}
function inferExperienceLevel(text, years) {
    const lower = text.toLowerCase();
    if (years >= 8 || lower.includes('senior') || lower.includes('lead'))
        return 'Senior';
    if (years >= 3 || lower.includes('mid-level') || lower.includes('specialist'))
        return 'Mid-Level';
    return 'Junior';
}
function findWeakPoints(text, skills, language) {
    const lower = text.toLowerCase();
    const items = [];
    if (!/\d+%|\$\d+|\d+\+/.test(lower)) {
        items.push(language === 'mn' ? 'Хэмжигдэхүйц, тоон үр дүнтэй амжилт дутуу байна.' : 'Few measurable achievements are visible in the CV.');
    }
    if (skills.length < 5) {
        items.push(language === 'mn' ? 'Ур чадварын хэсэг хангалттай өргөн харагдахгүй байна.' : 'The skills section needs more breadth and clarity.');
    }
    if (!/project|experience|work|төсөл|туршлага|ажил/i.test(text)) {
        items.push(language === 'mn' ? 'Төсөл болон ажлын туршлагын тайлбар илүү дэлгэрэнгүй хэрэгтэй.' : 'Project or work experience descriptions need more detail.');
    }
    if (!/summary|profile|танилцуулга|хураангуй/i.test(text)) {
        items.push(language === 'mn' ? 'Зорилтот ажилд тохирсон мэргэжлийн товч танилцуулга дутуу байна.' : 'A targeted professional summary is missing.');
    }
    return items.length ? items : [language === 'mn' ? 'Ноцтой сул тал илрээгүй.' : 'No major weak points detected.'];
}
function findMissingSkills(text, targetRole, skills) {
    const lower = `${text} ${targetRole}`.toLowerCase();
    const expected = lower.includes('frontend') || lower.includes('react')
        ? ['TypeScript', 'REST API', 'Testing', 'Accessibility', 'Performance Optimization']
        : lower.includes('backend') || lower.includes('api')
            ? ['Node.js', 'Express', 'SQL', 'Docker', 'API Security']
            : lower.includes('data')
                ? ['Python', 'SQL', 'Statistics', 'Dashboarding']
                : ['Communication', 'Project Experience', 'Measurable Achievements'];
    const detected = new Set(skills.map((skill) => skill.toLowerCase()));
    return expected.filter((skill) => !detected.has(skill.toLowerCase()) && !lower.includes(skill.toLowerCase()));
}
function estimateAtsScore(text, skills, weakPoints, targetRole, years) {
    const lower = text.toLowerCase();
    let score = 45;
    score += Math.min(skills.length, 10) * 4;
    score += targetRole.trim() ? 8 : 0;
    score += years > 0 ? 6 : 0;
    score += /\d+%|\$\d+|\d+\+/.test(lower) ? 10 : 0;
    score += /summary|profile|танилцуулга|хураангуй/i.test(lower) ? 6 : 0;
    score -= Math.min(weakPoints.length, 5) * 5;
    return Math.max(20, Math.min(98, Math.round(score)));
}
function toStringArray(value) {
    return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}
function buildInterviewPrep(payload, language) {
    const role = payload.targetRole || (language === 'mn' ? 'зорилтот ажлын байр' : 'the target role');
    const topSkills = payload.skills.slice(0, 4).join(', ') || (language === 'mn' ? 'CV дээрх гол ур чадварууд' : 'the strongest skills from the CV');
    const skillGap = payload.missingSkills?.[0] || (language === 'mn' ? 'шинээр хөгжүүлэх шаардлагатай ур чадвар' : 'a skill gap for the role');
    const improvement = payload.cvImprovementSuggestions?.[0] || (language === 'mn' ? 'CV дээрх хамгийн сайжруулах шаардлагатай хэсэг' : 'the highest-priority CV improvement');
    if (language === 'mn') {
        return {
            technical: [
                `Асуулт: ${role} чиглэлд ${topSkills} ур чадвараа ашигласан нэг төслөө тайлбарлана уу.\nХариултын санаа: Төслийн зорилго, таны үүрэг, ашигласан хэрэгсэл, гарсан үр дүнг нөхцөл байдал, даалгавар, хийсэн үйлдэл, үр дүнгийн бүтэцтэй хэл. Боломжтой бол тоон үр дүн нэм.`,
                `Асуулт: ${skillGap}-ийг богино хугацаанд нөхөхийн тулд ямар төлөвлөгөө гаргах вэ?\nХариултын санаа: Сурах эх сурвалж, хэрэгжүүлэх жижиг төсөл, хэмжих үзүүлэлтээ тодорхой хэл.`,
                `Асуулт: CV дээрх хамгийн хүчтэй ажлын туршлагаа ${role}-ийн шаардлагатай яаж холбох вэ?\nХариултын санаа: Ажил олгогчийн хэрэгцээ, өөрийн хийсэн үйлдэл, бизнест өгсөн үнэ цэнийг холбо.`,
                `Асуулт: ${topSkills} ашиглах үед гарсан хүндрэл, шийдвэрийн сонголтоо тайлбарлана уу.\nХариултын санаа: Сонгосон шийдэл, яагаад сонгосон шалтгаан, дараа нь юу сайжруулах байснаа хэл.`,
            ],
            hr: [
                `Асуулт: Яагаад ${role} чиглэлд ажиллахыг хүсэж байна вэ?\nХариултын санаа: Карьерын зорилго, одоогийн ур чадвар, тухайн байгууллагад өгөх үнэ цэнээ товч холбо.`,
                `Асуулт: Таны хамгийн хүчтэй давуу тал юу вэ?\nХариултын санаа: Ерөнхий чанар биш, нэг бодит жишээ, хийсэн үйлдэл, үр дүнгээр батал.`,
                `Асуулт: ${improvement}-ийг та хэрхэн сайжруулж байгаа вэ?\nХариултын санаа: Сул талаа хүлээн зөвшөөрөөд, аль хэдийн эхлүүлсэн тодорхой алхмаа хэл.`,
            ],
            behavioral: [
                `Асуулт: Эцсийн хугацаа шахуу үед ажлаа хэрхэн эрэмбэлж байсан бэ?\nХариултын санаа: Нөхцөл байдал, сонгосон эрэмбэ, бусадтай яаж ойлголцсон, эцсийн үр дүнг хэл.`,
                `Асуулт: Санал зөрөлдсөн багийн нөхцөл байдлыг яаж шийдсэн бэ?\nХариултын санаа: Нөгөө талын байр суурийг ойлгосон байдал, баримтаар ярьсан арга, тохиролцсон шийдлээ дурд.`,
                `Асуулт: Шинэ зүйл хурдан сурах шаардлагатай үед ямар арга хэрэглэдэг вэ?\nХариултын санаа: Сурах эх сурвалж, дадлага хийх арга, сурсан зүйлээ ажил дээр ашигласан жишээ хэл.`,
            ],
            suggestedAnswers: [
                'Нөхцөл байдал, даалгавар, хийсэн үйлдэл, үр дүнгийн бүтэц ашигла. Хариулт бүр 60-90 секунд байхад тохиромжтой.',
                'Технологи, шийдвэрийн шалтгаан, хэмжигдэхүйц үр дүн гэсэн гурвыг боломжтой үед заавал оруул.',
                'Монгол хэлээр ярьж байгаа бол латин үсгээр бичсэн монгол үгээ кириллээр цэгцтэй хэл. Харин технологи, компанийн нэр, сертификат зэрэг албан ёсны гадаад нэршлийг хэвээр үлдээ.',
                'CV дээр байхгүй ажил, компани, огноо, сертификат зохиож хэлэхгүй. Баримт дутуу бол сурах төлөвлөгөө болон бодит хийсэн ажлаараа нөх.',
            ],
        };
    }
    return {
        technical: [
            `Question: Walk me through one project where you used ${topSkills} for ${role}.\nSuggested answer: Cover the goal, your role, tools used, tradeoffs, and measurable outcome using STAR.`,
            `Question: How would you close the gap around ${skillGap}?\nSuggested answer: Name the learning plan, a small project you would build, and how you would measure progress.`,
            `Question: Which experience from your CV best matches ${role}, and why?\nSuggested answer: Tie the employer need to your action and the business value you created.`,
            `Question: Describe a technical tradeoff you made while using ${topSkills}.\nSuggested answer: Explain the options, decision criteria, final choice, and what you would improve next.`,
        ],
        hr: [
            `Question: Why are you interested in ${role}?\nSuggested answer: Connect your career goal, current strengths, and the value you can bring to the team.`,
            'Question: What is your strongest professional strength?\nSuggested answer: Use one real example with your action and result instead of a generic trait.',
            `Question: How are you improving ${improvement}?\nSuggested answer: Acknowledge the gap and describe concrete steps already in progress.`,
        ],
        behavioral: [
            'Question: Tell me about a time you worked under a tight deadline.\nSuggested answer: Explain prioritization, communication, execution, and the final result.',
            'Question: Tell me about a disagreement with a teammate.\nSuggested answer: Show how you listened, used evidence, aligned on a decision, and protected the team goal.',
            'Question: How do you learn something new quickly?\nSuggested answer: Describe your learning sources, practice method, and a real example of applying the new skill.',
        ],
        suggestedAnswers: [
            'Use STAR: Situation, Task, Action, Result. Keep each answer around 60-90 seconds.',
            'When possible, include tools, decision rationale, and measurable results.',
            'Do not invent employers, dates, certifications, or achievements that are not in the CV.',
            'Close each answer by connecting the example back to the target role.',
        ],
    };
}
function normalizeInterview(input, fallback) {
    const technical = toStringArray(input?.technical);
    const hr = toStringArray(input?.hr);
    const behavioral = toStringArray(input?.behavioral);
    const suggestedAnswers = toStringArray(input?.suggestedAnswers);
    return {
        technical: technical.length ? technical : fallback.technical,
        hr: hr.length ? hr : fallback.hr,
        behavioral: behavioral.length ? behavioral : fallback.behavioral,
        suggestedAnswers: suggestedAnswers.length ? suggestedAnswers : fallback.suggestedAnswers,
    };
}
function isQualityAiRewrittenCv(rewrittenCv, sourceCvText) {
    const text = rewrittenCv?.trim() || '';
    if (text.length < 150)
        return false;
    if (/CV section needs improvement|lorem ipsum|placeholder/i.test(text))
        return false;
    const parsed = parseCvSections(text);
    const hasStructure = /^(ХОЛБОО|CONTACT|АЖЛЫН|WORK|МИНИЙ|ABOUT|БОЛОВСРОЛ|EDUCATION)/im.test(text);
    const hasContent = parsed.experience.length > 0 || parsed.about.length > 40;
    if (sourceCvText.length > 300 && !hasContent)
        return false;
    return hasStructure && hasContent;
}
function finalizeRewrittenCv(rewrittenCv, request, cvText, skills, summary, experienceLevel) {
    const sourceText = cvText.trim();
    if (!sourceText)
        return rewrittenCv.trim();
    const nameFromCv = resolveCandidateName({ candidateName: '', cvText: sourceText, fullName: request.fullName });
    let cv = isQualityAiRewrittenCv(rewrittenCv, sourceText)
        ? mergeContactIntoCv(rewrittenCv.trim(), sourceText, request.language)
        : buildImprovedCvFromSource({
            fullName: nameFromCv,
            targetRole: request.targetRole,
            cvText: sourceText,
            skills,
            summary,
            experienceLevel,
            language: request.language,
        });
    const professionalAbout = buildProfessionalAbout({
        cvText: sourceText,
        targetRole: request.targetRole,
        displayName: nameFromCv,
        experienceLevel,
        careerGoals: request.careerGoals,
        language: request.language,
        existingAbout: parseCvSections(cv).about,
    });
    return injectAboutSection(cv, professionalAbout, request.language);
}
function normalizeRequest(body) {
    const years = Number(body.experienceYears || body.years || 0);
    return {
        fullName: String(body.fullName || body.candidateName || body.personInfo?.name || 'Candidate').trim() || 'Candidate',
        targetRole: String(body.targetRole || body.jobGoal || 'Generalist').trim() || 'Generalist',
        careerGoals: String(body.careerGoals || body.jobGoal || '').trim(),
        experienceYears: Number.isFinite(years) && years >= 0 ? years : 0,
        language: getLanguage(body.language),
    };
}
async function parseUploadedFile(file) {
    if (!file)
        return '';
    const name = String(file.originalname || '').toLowerCase();
    if (file.mimetype === 'text/plain' || name.endsWith('.txt')) {
        return String(file.buffer.toString('utf8')).trim();
    }
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
        const parsed = await mammoth.extractRawText({ buffer: file.buffer });
        return String(parsed.value || '').trim();
    }
    if (file.mimetype === 'application/pdf' || name.endsWith('.pdf')) {
        const parsed = await pdfParse(file.buffer);
        const text = String(parsed.text || '').trim();
        if (text.length < 40) {
            throw new ApiError('CV_PARSE_FAILED', 'PDF-ээс текст уншиж чадсангүй. CV-ийн текстийг хуулж paste хийнэ үү, эсвэл DOCX ашиглана уу.', 400);
        }
        return text;
    }
    const parsed = await pdfParse(file.buffer);
    return String(parsed.text || '').trim();
}
const careerAnalysisSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
        'candidateName',
        'targetRole',
        'skills',
        'experienceLevel',
        'atsScore',
        'weakPoints',
        'missingSkills',
        'careerRecommendations',
        'cvImprovementSuggestions',
        'rewrittenCv',
        'summary',
        'interview',
    ],
    properties: {
        candidateName: { type: 'string' },
        targetRole: { type: 'string' },
        skills: { type: 'array', items: { type: 'string' } },
        experienceLevel: { type: 'string' },
        atsScore: { type: 'integer' },
        weakPoints: { type: 'array', items: { type: 'string' } },
        missingSkills: { type: 'array', items: { type: 'string' } },
        careerRecommendations: { type: 'array', items: { type: 'string' } },
        cvImprovementSuggestions: { type: 'array', items: { type: 'string' } },
        rewrittenCv: { type: 'string' },
        summary: { type: 'string' },
        interview: {
            type: 'object',
            additionalProperties: false,
            required: ['technical', 'hr', 'behavioral', 'suggestedAnswers'],
            properties: {
                technical: { type: 'array', items: { type: 'string' } },
                hr: { type: 'array', items: { type: 'string' } },
                behavioral: { type: 'array', items: { type: 'string' } },
                suggestedAnswers: { type: 'array', items: { type: 'string' } },
            },
        },
    },
};
function normalizeAnalysis(input, language, source) {
    const base = {
        candidateName: String(input.candidateName || 'Candidate'),
        targetRole: String(input.targetRole || 'Generalist'),
        skills: toStringArray(input.skills),
        experienceLevel: String(input.experienceLevel || 'Junior'),
        atsScore: Math.max(0, Math.min(100, Math.round(Number(input.atsScore || 0)))),
        weakPoints: toStringArray(input.weakPoints),
        missingSkills: toStringArray(input.missingSkills),
        careerRecommendations: toStringArray(input.careerRecommendations),
        cvImprovementSuggestions: toStringArray(input.cvImprovementSuggestions),
        rewrittenCv: String(input.rewrittenCv || ''),
        summary: String(input.summary || ''),
    };
    const interview = normalizeInterview(input.interview, buildInterviewPrep(base, language));
    return {
        ...base,
        interview,
        metadata: {
            provider: input.metadata?.provider === 'gemini'
                ? 'gemini'
                : input.metadata?.provider === 'openai'
                    ? 'openai'
                    : 'simulated',
            source,
            language,
            fallbackReason: input.metadata?.fallbackReason,
        },
    };
}
function buildSimulatedAnalysis(request, cvText, source) {
    const skills = detectSkills(cvText);
    const baseLevel = inferExperienceLevel(cvText, request.experienceYears);
    const experienceLevel = request.language === 'mn'
        ? baseLevel === 'Senior' ? 'Ахисан түвшин' : baseLevel === 'Mid-Level' ? 'Дунд түвшин' : 'Анхан шат'
        : baseLevel;
    const weakPoints = findWeakPoints(cvText, skills, request.language);
    const missingSkills = findMissingSkills(cvText, request.targetRole, skills).slice(0, 8);
    const atsScore = estimateAtsScore(cvText, skills, weakPoints, request.targetRole, request.experienceYears);
    const nameFromCv = extractCandidateName(cvText) || request.fullName;
    return normalizeAnalysis({
        candidateName: nameFromCv,
        targetRole: request.targetRole,
        skills,
        experienceLevel,
        atsScore,
        weakPoints,
        missingSkills,
        careerRecommendations: request.language === 'mn'
            ? [
                `${request.targetRole} чиглэлийн одоогийн түвшинд тохирох ажлын байруудад төвлөрөөрэй.`,
                'Портфолио болон төслүүддээ хэмжигдэхүйц үр дүн, бизнесийн нөлөөг тодорхой харуулаарай.',
                'Ярилцлага болон анкет илгээхдээ зорилтот албан тушаалд тохирсон жишээг ашиглаарай.',
            ]
            : [
                `Target ${request.targetRole} roles that match your current profile.`,
                'Strengthen your portfolio with measurable outcomes and business impact.',
                'Use tailored project examples when applying to positions.',
            ],
        cvImprovementSuggestions: request.language === 'mn'
            ? [
                'Сүүлийн ажлууд болон төслүүд дээрээ тоон үзүүлэлт, хэмжигдэхүйц амжилт нэмээрэй.',
                'Гол ур чадваруудаа богино, ангилалтай, уншихад хялбар хэсэг болгоорой.',
                'Мэргэжлийн товч танилцуулгаа зорилтот ажилтайгаа илүү нягт холбоорой.',
            ]
            : [
                'Add quantified achievements for each recent role or project.',
                'Group your core technical skills into a short, scannable section.',
                'Tailor the summary section toward the target role and domain.',
            ],
        rewrittenCv: finalizeRewrittenCv('', request, cvText, skills, '', experienceLevel),
        summary: request.language === 'mn'
            ? `${nameFromCv} нь ${request.targetRole} чиглэлд ${experienceLevel.toLowerCase()} түвшний нэр дэвшигч бөгөөд оруулсан CV-ээс ${skills.length} гол ур чадвар илэрлээ.`
            : `${nameFromCv} appears to be a ${experienceLevel.toLowerCase()} candidate for ${request.targetRole} with ${skills.length} identifiable skill areas from the uploaded CV.`,
        interview: buildInterviewPrep({
            targetRole: request.targetRole,
            skills,
            missingSkills,
            cvImprovementSuggestions: request.language === 'mn'
                ? ['CV-ийн ажлын туршлага, ур чадвар, амжилтын хэсгийг илүү тодорхой болгох']
                : ['Make the CV experience, skills, and achievements more specific'],
        }, request.language),
        metadata: { provider: 'simulated' },
    }, request.language, source);
}
async function requestGeminiAnalysis(request, cvText, source, cvFileName = 'text input') {
    const { data, modelUsed, error } = await analyzeCvWithGemini({
        fullName: request.fullName,
        targetRole: request.targetRole,
        experienceYears: request.experienceYears,
        careerGoals: request.careerGoals,
        language: request.language,
        cvText,
        cvFileName,
    });
    if (!data) {
        if (process.env.NODE_ENV !== 'production' && error) {
            console.error(`[Gemini] ${error}`);
        }
        return null;
    }
    return normalizeAnalysis({
        ...data,
        metadata: {
            provider: 'gemini',
            geminiModel: modelUsed || process.env.GEMINI_MODEL,
        },
    }, request.language, source);
}
async function requestOpenAiAnalysis(request, cvText, source) {
    if (!process.env.OPENAI_API_KEY)
        return null;
    const input = [
        {
            role: 'system',
            content: [
                'You are a senior AI career advisor, ATS resume reviewer, and professional HR coach.',
                'Return only structured JSON that matches the provided schema.',
                request.language === 'mn'
                    ? 'Write every human-readable value in Mongolian Cyrillic. If the CV contains Mongolian written with Latin/foreign letters, normalize it into Mongolian Cyrillic. Keep genuine English technology names, company names, emails, URLs, and certifications in English.'
                    : 'Write every human-readable value in natural, professional English.',
                'Keep JSON keys in English.',
                'Do not invent employers, dates, degrees, certifications, or private facts.',
                'Analyze ONLY the CV text below. rewrittenCv must be a complete NEW improved CV document from that text, with Mongolian section headers when language is mn: ХОЛБОО БАРИХ, БОЛОВСРОЛ, УР ЧАДВАР, МИНИЙ ТУХАЙ, АЖЛЫН ТУРШЛАГА.',
            ].join(' '),
        },
        {
            role: 'user',
            content: [
                `Candidate name: ${request.fullName}`,
                `Target role: ${request.targetRole}`,
                `Reported years of experience: ${request.experienceYears}`,
                `Career goals: ${request.careerGoals || 'Not provided'}`,
                '',
                'Analyze skills, experience level, weak points, missing skills, ATS score, recommendations, CV improvements, and rewrite the CV.',
                'For rewrittenCv: produce a complete polished CV draft using only facts from the uploaded CV. Improve structure, professional summary, skills grouping, experience bullets, project descriptions, ATS keywords, grammar, and recruiter readability. Start bullets with strong action verbs. Add measurable impact only when evidence exists; otherwise improve clarity without fabricating numbers. Preserve names, contacts, employers, dates, degrees, and certifications exactly when present.',
                'Return 4 to 6 cvImprovementSuggestions and 4 to 6 careerRecommendations.',
                'Return interview prep immediately: 4 technical Q&A items, 3 HR Q&A items, 3 behavioral Q&A items, and 4 suggested answer strategies. Each question item should include both the interview question and a concise suggested answer tailored to this CV and target role.',
                'CV text:',
                cvText,
            ].join('\n'),
        },
    ];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.OPENAI_TIMEOUT_MS || 30000));
    try {
        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
                input,
                max_output_tokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 4000),
                text: {
                    format: {
                        type: 'json_schema',
                        name: 'career_analysis',
                        strict: true,
                        schema: careerAnalysisSchema,
                    },
                },
            }),
            signal: controller.signal,
        });
        if (!response.ok)
            return null;
        const data = (await response.json());
        const outputText = typeof data.output_text === 'string'
            ? data.output_text
            : (data.output || [])
                .flatMap((item) => item.content || [])
                .filter((item) => item.type === 'output_text' && item.text)
                .map((item) => item.text)
                .join('\n');
        if (!outputText)
            return null;
        const parsed = JSON.parse(outputText);
        return normalizeAnalysis({ ...parsed, metadata: { provider: 'openai' } }, request.language, source);
    }
    catch {
        return null;
    }
    finally {
        clearTimeout(timeout);
    }
}
async function analyzeCvPayload(req) {
    const request = normalizeRequest(req.body);
    const fileText = await parseUploadedFile(req.file);
    const pastedText = String(req.body.cvText || req.body.cvContent || req.body.rawText || '').trim();
    const cvText = fileText.length >= pastedText.length ? fileText : pastedText || fileText;
    const source = req.file ? 'file-upload' : 'text-input';
    if (!cvText)
        throw new ApiError('CV_REQUIRED', 'Please upload a CV file or paste CV text.');
    if (cvText.length > Number(process.env.CV_TEXT_MAX_LENGTH || 40000)) {
        throw new ApiError('CV_TOO_LARGE', 'CV text is too large.', 413);
    }
    const file = req.file;
    const cvFileName = file?.originalname || (cvText ? 'cv-text.txt' : 'cv.txt');
    const useGemini = Boolean(process.env.GEMINI_API_KEY?.trim());
    let result;
    if (useGemini) {
        const geminiResult = await requestGeminiAnalysis(request, cvText, source, cvFileName);
        result = geminiResult || buildSimulatedAnalysis(request, cvText, source);
        if (!geminiResult)
            result.metadata.fallbackReason = 'GEMINI_FALLBACK';
    }
    else {
        const openAiResult = await requestOpenAiAnalysis(request, cvText, source);
        result = openAiResult || buildSimulatedAnalysis(request, cvText, source);
        if (!openAiResult && process.env.OPENAI_API_KEY)
            result.metadata.fallbackReason = 'OPENAI_FALLBACK';
    }
    const nameFromCv = resolveCandidateName({
        candidateName: result.candidateName,
        cvText,
        fullName: request.fullName,
    });
    result = {
        ...result,
        rewrittenCv: finalizeRewrittenCv(result.rewrittenCv, request, cvText, result.skills, result.summary, result.experienceLevel),
        candidateName: nameFromCv,
        targetRole: result.targetRole || request.targetRole,
    };
    const persistAnalysis = String(req.body.persist ?? 'true') !== 'false';
    const user = getAuthUser(req);
    if (user && persistAnalysis) {
        const db = readDb();
        const dashboard = toDashboardAnalysis(result);
        const overall = Math.round(dashboard.scores.reduce((sum, score) => sum + score.value, 0) / dashboard.scores.length);
        const historyId = randomUUID();
        const historyItem = {
            id: historyId,
            userId: user.id,
            createdAt: new Date().toISOString(),
            sourceCvText: cvText.slice(0, 32000),
            fileName: file?.originalname || (cvText ? 'cv-text.txt' : 'cv.txt'),
            fileType: file
                ? file.mimetype === 'application/pdf'
                    ? 'pdf'
                    : file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        ? 'docx'
                        : 'txt'
                : 'txt',
            status: 'completed',
            overall,
            suggestions: buildStoredSuggestions(result, request.language),
            request,
            result,
        };
        db.histories.unshift(historyItem);
        db.histories = db.histories.slice(0, 200);
        writeDb(db);
        return packageClientPayload(result, { cvId: historyId, suggestions: historyItem.suggestions, sourceCvText: cvText.slice(0, 32000) }, { cvTextLength: cvText.length, parseSource: source });
    }
    return packageClientPayload(result, { sourceCvText: cvText.slice(0, 32000) }, { cvTextLength: cvText.length, parseSource: source });
}
function packageClientPayload(result, extras = {}, meta = {}) {
    const dashboard = toDashboardAnalysis(result);
    return {
        ...result,
        scores: dashboard.scores,
        strengths: dashboard.strengths,
        weaknesses: dashboard.weaknesses,
        keywords: dashboard.keywords,
        career: dashboard.career,
        cvTextLength: meta.cvTextLength,
        parseSource: meta.parseSource,
        ...extras,
    };
}
function buildStoredSuggestions(result, language = 'mn') {
    const severities = ['high', 'medium', 'low', 'low'];
    const fallbackOriginal = language === 'mn' ? 'CV-ийн энэ хэсгийг сайжруулах шаардлагатай' : 'CV section needs improvement';
    const fallbackExplanation = language === 'mn'
        ? 'ATS болон ажил олгогчид уншихад илүү ойлгомжтой болгоно.'
        : 'Improves ATS alignment and recruiter readability.';
    return result.cvImprovementSuggestions.slice(0, 6).map((suggestion, index) => ({
        id: randomUUID(),
        type: 'cv_improvement',
        severity: severities[index] || 'low',
        original: result.weakPoints[index] || fallbackOriginal,
        suggestion,
        explanation: fallbackExplanation,
        status: 'pending',
    }));
}
function mapHistoryListItem(item) {
    const dashboard = toDashboardAnalysis(item.result);
    const overall = item.overall ??
        Math.round(dashboard.scores.reduce((sum, score) => sum + score.value, 0) / dashboard.scores.length);
    return {
        id: item.id,
        fileName: item.fileName || 'cv.txt',
        fileType: item.fileType || 'txt',
        uploadedAt: item.createdAt,
        status: item.status || 'completed',
        overall,
    };
}
function buildAnalysisRecord(item) {
    const dashboard = toDashboardAnalysis(item.result);
    const suggestions = item.suggestions ??
        buildStoredSuggestions(item.result, item.request.language);
    return {
        id: item.id,
        fileName: item.fileName || 'cv.txt',
        fileType: item.fileType || 'txt',
        uploadedAt: item.createdAt,
        status: item.status || 'completed',
        jobDescription: item.request.targetRole,
        overall: item.overall ??
            Math.round(dashboard.scores.reduce((sum, score) => sum + score.value, 0) / dashboard.scores.length),
        analysis: {
            language: item.request.language,
            candidateName: item.result.candidateName,
            targetRole: item.request.targetRole,
            scores: dashboard.scores,
            summary: dashboard.summary,
            strengths: dashboard.strengths,
            weaknesses: dashboard.weaknesses,
            keywordsMissing: dashboard.keywords.missing,
            keywordsRecommended: dashboard.keywords.recommended,
            interview: dashboard.interview,
            career: dashboard.career,
            rewrittenCv: item.result.rewrittenCv,
            sourceCvText: item.sourceCvText || '',
            suggestions,
        },
        rewrittenCv: item.result.rewrittenCv,
        sourceCvText: item.sourceCvText || '',
    };
}
function findSuggestionForUser(db, suggestionId, userId) {
    for (const item of db.histories) {
        if (item.userId !== userId || !item.suggestions)
            continue;
        const suggestion = item.suggestions.find((entry) => entry.id === suggestionId);
        if (suggestion)
            return { item, suggestion };
    }
    return { item: null, suggestion: null };
}
function toDashboardAnalysis(result) {
    const language = result.metadata?.language === 'en' ? 'en' : 'mn';
    const copy = language === 'mn'
        ? {
            atsLabel: 'ATS оноо',
            atsExplanation: 'Бүтэц, түлхүүр үг, хэмжигдэхүйц үр дүнд тулгуурласан ATS бэлэн байдал.',
            readabilityLabel: 'Уншигдах байдал',
            skillsLabel: 'Ур чадварын тохирол',
            skillsExplanation: 'Зорилтот ажлын байрны ур чадвартай нийцэх байдлын ойролцоо үнэлгээ.',
            experienceLabel: 'Туршлага',
            grammarLabel: 'Хэл найруулга',
            grammarExplanation: 'Мэргэжлийн өнгө аяс болон бичгийн алдааны суурь шалгалт.',
            fallbackOriginal: 'CV-ийн энэ хэсгийг сайжруулах шаардлагатай',
            feedbackExplanation: 'ATS болон ажил олгогчид уншихад илүү ойлгомжтой болгоно.',
            estimatedDuration: '3-6 сар',
        }
        : {
            atsLabel: 'ATS score',
            atsExplanation: 'ATS readiness based on structure, keywords, and measurable impact.',
            readabilityLabel: 'Readability',
            skillsLabel: 'Skill match',
            skillsExplanation: 'Estimated fit for the target role skills.',
            experienceLabel: 'Experience',
            grammarLabel: 'Grammar',
            grammarExplanation: 'Professional tone and grammar check baseline.',
            fallbackOriginal: 'CV section needs improvement',
            feedbackExplanation: 'Improves ATS alignment and recruiter readability.',
            estimatedDuration: '3-6 months',
        };
    const scores = [
        { key: 'atsScore', label: copy.atsLabel, value: result.atsScore, explanation: copy.atsExplanation, confidence: 0.9 },
        { key: 'readability', label: copy.readabilityLabel, value: Math.min(100, result.atsScore + 3), explanation: result.summary, confidence: 0.86 },
        { key: 'skillsMatch', label: copy.skillsLabel, value: Math.max(35, result.atsScore - result.missingSkills.length * 3), explanation: copy.skillsExplanation, confidence: 0.84 },
        { key: 'experience', label: copy.experienceLabel, value: result.experienceLevel.toLowerCase().includes('senior') ? 88 : result.experienceLevel.toLowerCase().includes('mid') ? 80 : 70, explanation: result.experienceLevel, confidence: 0.82 },
        { key: 'grammar', label: copy.grammarLabel, value: 90, explanation: copy.grammarExplanation, confidence: 0.8 },
    ];
    return {
        candidateName: result.candidateName,
        targetRole: result.targetRole,
        rewrittenCv: result.rewrittenCv,
        scores,
        summary: result.summary,
        strengths: result.skills.slice(0, 5),
        weaknesses: result.weakPoints,
        keywords: {
            missing: result.missingSkills,
            recommended: result.skills,
        },
        feedback: result.cvImprovementSuggestions.slice(0, 4).map((suggestion, index) => ({
            id: `fb_${index + 1}`,
            type: 'cv_improvement',
            severity: index === 0 ? 'high' : 'medium',
            original: result.weakPoints[index] || copy.fallbackOriginal,
            suggestion,
            explanation: copy.feedbackExplanation,
            accepted: false,
        })),
        interview: result.interview,
        career: {
            currentLevel: result.experienceLevel,
            recommendedRoles: result.careerRecommendations.slice(0, 3),
            missingSkills: result.missingSkills,
            roadmap: result.cvImprovementSuggestions,
            estimatedDuration: copy.estimatedDuration,
        },
    };
}
app.get('/api/health', (_req, res) => {
    success(res, {
        status: 'ok',
        api: 'AI Career Advisor',
        aiProvider: process.env.GEMINI_API_KEY
            ? 'gemini'
            : process.env.OPENAI_API_KEY
                ? 'openai'
                : 'simulated',
        uptimeMs: Math.round(process.uptime() * 1000),
    });
});
const registerUser = asyncRoute(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const fullName = String(req.body.fullName || req.body.name || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new ApiError('EMAIL_REQUIRED', 'A valid email is required.');
    if (!fullName)
        throw new ApiError('FULL_NAME_REQUIRED', 'Full name is required.');
    if (password.length < 6)
        throw new ApiError('PASSWORD_TOO_SHORT', 'Password must be at least 6 characters.');
    const db = readDb();
    if (db.users.some((user) => user.email === email))
        throw new ApiError('EMAIL_IN_USE', 'An account with this email already exists.', 409);
    const user = {
        id: randomUUID(),
        email,
        fullName,
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        preferredLanguage: getLanguage(req.body.language),
        createdAt: new Date().toISOString(),
    };
    const { token, tokenId, expiresAt } = createToken(user);
    db.users.push(user);
    db.sessions.push({ tokenId, userId: user.id, createdAt: new Date().toISOString(), expiresAt });
    writeDb(db);
    res.status(201).json({ token, user: sanitizeUser(user) });
});
app.post('/api/auth/register', registerUser);
app.post('/api/auth/signup', registerUser);
app.post('/api/auth/login', asyncRoute(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const db = readDb();
    const user = db.users.find((item) => item.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new ApiError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }
    const { token, tokenId, expiresAt } = createToken(user);
    db.sessions = db.sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());
    db.sessions.push({ tokenId, userId: user.id, createdAt: new Date().toISOString(), expiresAt });
    writeDb(db);
    res.json({ token, user: sanitizeUser(user) });
}));
app.get('/api/auth/me', (req, res) => {
    const user = requireAuth(req);
    res.json({ user: sanitizeUser(user) });
});
app.post('/api/auth/logout', (req, res) => {
    const token = getBearerToken(req);
    const payload = token ? verifyToken(token) : null;
    if (payload?.jti) {
        const db = readDb();
        db.sessions = db.sessions.filter((session) => session.tokenId !== payload.jti);
        writeDb(db);
    }
    res.json({ success: true });
});
app.post('/api/career/analyze', upload.single('cvFile'), asyncRoute(async (req, res) => {
    requireAuth(req);
    res.json(await analyzeCvPayload(req));
}));
app.post('/api/career/analyze-text', asyncRoute(async (req, res) => {
    const result = await analyzeCvPayload(req);
    res.json({
        skills: result.skills,
        jobLevel: result.experienceLevel.toLowerCase().includes('senior') ? 'senior' : result.experienceLevel.toLowerCase().includes('mid') ? 'mid' : 'junior',
        careerSuggestions: result.careerRecommendations.slice(0, 3),
        missingSkills: result.missingSkills,
        atsScore: result.atsScore,
        improvedCv: result.rewrittenCv,
        metadata: result.metadata,
    });
}));
app.get('/api/career/history', (req, res) => {
    const user = requireAuth(req);
    const db = readDb();
    const history = db.histories
        .filter((item) => item.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((item) => mapHistoryListItem(item));
    res.json({ history });
});
app.get('/api/career/analysis/:cvId', (req, res) => {
    const user = requireAuth(req);
    const db = readDb();
    const item = db.histories.find((entry) => entry.id === req.params.cvId && entry.userId === user.id);
    if (!item)
        throw new ApiError('NOT_FOUND', 'Analysis not found.', 404);
    res.json({ record: buildAnalysisRecord(item) });
});
app.post('/api/career/suggestions/:id/approve', (req, res) => {
    const user = requireAuth(req);
    const db = readDb();
    const match = findSuggestionForUser(db, req.params.id, user.id);
    if (!match.suggestion)
        throw new ApiError('NOT_FOUND', 'Suggestion not found.', 404);
    match.suggestion.status = 'accepted';
    writeDb(db);
    res.json({ success: true, suggestion: match.suggestion });
});
app.post('/api/career/suggestions/:id/reject', (req, res) => {
    const user = requireAuth(req);
    const db = readDb();
    const match = findSuggestionForUser(db, req.params.id, user.id);
    if (!match.suggestion)
        throw new ApiError('NOT_FOUND', 'Suggestion not found.', 404);
    match.suggestion.status = 'rejected';
    writeDb(db);
    res.json({ success: true, suggestion: match.suggestion });
});
app.post('/api/career/suggestions/:id/regenerate', (req, res) => {
    const user = requireAuth(req);
    const db = readDb();
    const match = findSuggestionForUser(db, req.params.id, user.id);
    if (!match.suggestion)
        throw new ApiError('NOT_FOUND', 'Suggestion not found.', 404);
    const extra = match.item?.request.language === 'mn'
        ? ' Мөн үр дүнг тоон үзүүлэлтээр тодруулж, зорилтот ажлын байрны түлхүүр үгстэй уялдуулах боломжтой.'
        : ' Also quantify results and align with target role keywords.';
    match.suggestion.suggestion += extra;
    match.suggestion.status = 'pending';
    writeDb(db);
    res.json({ success: true, suggestion: match.suggestion });
});
app.post('/api/career/export-pdf', asyncRoute(async (req, res) => {
    const raw = req.body.result || req.body.analysis || req.body;
    const lang = getLanguage(req.body.language);
    const rewrittenCv = String(raw.rewrittenCv || raw.improved_cv || raw.improvedCv || '').trim();
    if (!rewrittenCv) {
        throw new ApiError('REWRITTEN_CV_REQUIRED', 'No improved CV is available to export.', 400);
    }
    const sourceCvText = String(raw.sourceCvText || req.body.sourceCvText || '').trim();
    const candidateName = resolveCandidateName({
        candidateName: String(raw.candidateName || raw.fullName || '').trim(),
        cvText: sourceCvText || rewrittenCv,
        fullName: String(raw.fullName || '').trim(),
    }) || 'Candidate';
    const targetRole = String(raw.targetRole || raw.jobTitle || 'Generalist').trim() || 'Generalist';
    const skills = Array.isArray(raw.skills)
        ? raw.skills
        : Array.isArray(raw.keywords?.recommended)
            ? raw.keywords.recommended
            : [];
    const pdf = await createProfessionalCvPdf({
        candidateName,
        targetRole,
        rewrittenCv,
        sourceCvText: sourceCvText || rewrittenCv,
        skills,
        language: lang,
        profileImage: String(req.body.profileImage || ''),
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${candidateName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'candidate'}-cv.pdf"`);
    res.send(pdf);
}));
app.post('/api/analyze-cv', upload.single('cvFile'), asyncRoute(async (req, res) => {
    const result = await analyzeCvPayload(req);
    const dashboard = toDashboardAnalysis(result);
    res.json({
        success: true,
        data: dashboard,
        structured: result,
        text: JSON.stringify({
            skills: result.skills,
            experience_level: result.experienceLevel,
            weaknesses: result.weakPoints,
            job_recommendations: result.careerRecommendations,
            missing_skills: result.missingSkills,
            ats_score: result.atsScore,
            improved_cv: result.rewrittenCv,
            interview: result.interview,
        }, null, 2),
    });
}));
app.use('/api', (req, _res, next) => {
    next(new ApiError('ROUTE_NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`, 404));
});
function isApiRequest(url) {
    return url.startsWith('/api');
}
/** Vite only when explicitly in local dev (Render often has no NODE_ENV → must not load vite). */
function isViteDevServerEnabled() {
    if (process.env.NODE_ENV === 'production')
        return false;
    if (process.env.USE_VITE_DEV === 'true')
        return true;
    return process.env.NODE_ENV === 'development';
}
async function startServer() {
    const frontendRoot = path.join(backendRoot, '..', 'frontend');
    const frontendDist = path.join(frontendRoot, 'dist');
    const indexHtml = path.join(frontendRoot, 'index.html');
    if (isViteDevServerEnabled()) {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
            root: frontendRoot,
            configFile: path.join(frontendRoot, 'vite.config.ts'),
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
        app.use(async (req, res, next) => {
            if (req.method !== 'GET' && req.method !== 'HEAD')
                return next();
            if (isApiRequest(req.originalUrl))
                return next();
            if (req.originalUrl.includes('.') && !req.originalUrl.endsWith('.html'))
                return next();
            try {
                let html = fs.readFileSync(indexHtml, 'utf-8');
                html = await vite.transformIndexHtml(req.originalUrl, html);
                res.status(200).setHeader('Content-Type', 'text/html').end(html);
            }
            catch (err) {
                next(err);
            }
        });
    }
    else if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
        app.use(express.static(frontendDist));
        app.get(/^(?!\/api).*/, (_req, res) => {
            res.sendFile(path.join(frontendDist, 'index.html'));
        });
    }
    else {
        app.get('/', (_req, res) => {
            res
                .status(503)
                .type('text/plain')
                .send('Frontend not built. Run: npm run build');
        });
    }
    app.use((error, _req, res, _next) => {
        const apiError = error instanceof ApiError ? error : new ApiError('INTERNAL_ERROR', 'Unexpected server error.', 500);
        if (process.env.NODE_ENV !== 'production')
            console.error(`[${apiError.code}] ${apiError.message}`);
        res.status(apiError.statusCode).json({ success: false, error: { code: apiError.code, message: apiError.message } });
    });
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
        if (isViteDevServerEnabled()) {
            console.log(`Frontend + API (Vite dev): http://localhost:${PORT}`);
        }
    });
}
startServer().catch((error) => {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
});
