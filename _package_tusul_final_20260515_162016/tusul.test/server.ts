import express, {type NextFunction, type Request, type Response} from 'express';
import {createServer as createViteServer} from 'vite';
import path from 'path';
import fs from 'fs';
import {createRequire} from 'module';
import {randomUUID} from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const JWT_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'career-advisor-local-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

type Language = 'mn' | 'en';
type ExperienceLevel = 'Junior' | 'Mid-Level' | 'Senior';

type User = {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  preferredLanguage: Language;
  createdAt: string;
};

type Session = {
  tokenId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

type CareerAnalysis = {
  candidateName: string;
  targetRole: string;
  skills: string[];
  experienceLevel: string;
  atsScore: number;
  weakPoints: string[];
  missingSkills: string[];
  careerRecommendations: string[];
  cvImprovementSuggestions: string[];
  rewrittenCv: string;
  summary: string;
  interview: InterviewPrep;
  metadata: {
    provider: 'openai' | 'simulated';
    source: string;
    language: Language;
    fallbackReason?: string;
  };
};

type InterviewPrep = {
  technical: string[];
  hr: string[];
  behavioral: string[];
  suggestedAnswers: string[];
};

type HistoryItem = {
  id: string;
  userId: string;
  createdAt: string;
  request: {
    fullName: string;
    targetRole: string;
    experienceYears: number;
    careerGoals: string;
    language: Language;
  };
  result: CareerAnalysis;
};

type Database = {
  users: User[];
  sessions: Session[];
  histories: HistoryItem[];
};

class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: MAX_FILE_SIZE},
  fileFilter: (_req: Request, file: any, cb: (error: Error | null, acceptFile?: boolean) => void) => {
    const name = String(file.originalname || '').toLowerCase();
    const ok =
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.pdf') ||
      name.endsWith('.txt') ||
      name.endsWith('.docx');

    cb(ok ? null : new ApiError('UNSUPPORTED_FILE_TYPE', 'Only PDF, DOCX, and TXT files are supported.'), ok);
  },
});

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'app-db.json');
const emptyDb: Database = {users: [], sessions: [], histories: []};

app.disable('x-powered-by');
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true, limit: '10mb'}));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', req.path.startsWith('/api') ? 'no-store' : 'public, max-age=300');
  next();
});

function ensureDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, {recursive: true});
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2), 'utf8');
}

function readDb(): Database {
  ensureDb();
  try {
    const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      histories: Array.isArray(parsed.histories) ? parsed.histories : [],
    };
  } catch {
    fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2), 'utf8');
    return {...emptyDb};
  }
}

function writeDb(db: Database) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

function success<T>(res: Response, data: T, message = 'Success', meta: Record<string, unknown> = {}) {
  res.json({success: true, data, message, meta});
}

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

function sanitizeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    preferredLanguage: user.preferredLanguage,
    createdAt: user.createdAt,
  };
}

function getBearerToken(req: Request) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function createToken(user: User) {
  const tokenId = randomUUID();
  const token = jwt.sign(
    {sub: user.id, email: user.email, jti: tokenId},
    JWT_SECRET,
    {expiresIn: JWT_EXPIRES_IN, issuer: 'ai-career-advisor', audience: 'ai-career-advisor-users'},
  );
  const decoded = jwt.decode(token);
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : new Date(Date.now() + 604800000).toISOString();
  return {token, tokenId, expiresAt};
}

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET, {issuer: 'ai-career-advisor', audience: 'ai-career-advisor-users'});
  } catch {
    return null;
  }
}

function getAuthUser(req: Request) {
  const token = getBearerToken(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.sub || !payload?.jti) return null;

  const db = readDb();
  const session = db.sessions.find((item) => item.userId === payload.sub && item.tokenId === payload.jti);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;

  const user = db.users.find((item) => item.id === payload.sub);
  return user || null;
}

function requireAuth(req: Request) {
  const user = getAuthUser(req);
  if (!user) throw new ApiError('AUTH_REQUIRED', 'Please sign in to access this resource.', 401);
  return user;
}

function asyncRoute(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

function getLanguage(value: unknown): Language {
  return value === 'mn' ? 'mn' : 'en';
}

function detectSkills(text: string) {
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

function inferExperienceLevel(text: string, years: number): ExperienceLevel {
  const lower = text.toLowerCase();
  if (years >= 8 || lower.includes('senior') || lower.includes('lead')) return 'Senior';
  if (years >= 3 || lower.includes('mid-level') || lower.includes('specialist')) return 'Mid-Level';
  return 'Junior';
}

function findWeakPoints(text: string, skills: string[], language: Language) {
  const lower = text.toLowerCase();
  const items: string[] = [];

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

function findMissingSkills(text: string, targetRole: string, skills: string[]) {
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

function estimateAtsScore(text: string, skills: string[], weakPoints: string[], targetRole: string, years: number) {
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

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function buildInterviewPrep(
  payload: {
    targetRole: string;
    skills: string[];
    missingSkills?: string[];
    cvImprovementSuggestions?: string[];
  },
  language: Language,
): InterviewPrep {
  const role = payload.targetRole || (language === 'mn' ? 'зорилтот ажлын байр' : 'the target role');
  const topSkills = payload.skills.slice(0, 4).join(', ') || (language === 'mn' ? 'CV дээрх гол ур чадварууд' : 'the strongest skills from the CV');
  const skillGap = payload.missingSkills?.[0] || (language === 'mn' ? 'шинээр хөгжүүлэх шаардлагатай ур чадвар' : 'a skill gap for the role');
  const improvement = payload.cvImprovementSuggestions?.[0] || (language === 'mn' ? 'CV дээрх хамгийн сайжруулах шаардлагатай хэсэг' : 'the highest-priority CV improvement');

  if (language === 'mn') {
    return {
      technical: [
        `Асуулт: ${role} чиглэлд ${topSkills} ур чадвараа ашигласан нэг төслөө тайлбарлана уу.\nХариултын санаа: Төслийн зорилго, таны үүрэг, ашигласан хэрэгсэл, гарсан үр дүнг STAR бүтэцтэй хэл. Боломжтой бол тоон үр дүн нэм.`,
        `Асуулт: ${skillGap}-ийг богино хугацаанд нөхөхийн тулд ямар төлөвлөгөө гаргах вэ?\nХариултын санаа: Сурах эх сурвалж, хэрэгжүүлэх жижиг төсөл, хэмжих үзүүлэлтээ тодорхой хэл.`,
        `Асуулт: CV дээрх хамгийн хүчтэй ажлын туршлагаа ${role}-ийн шаардлагатай яаж холбох вэ?\nХариултын санаа: Ажил олгогчийн хэрэгцээ, өөрийн хийсэн үйлдэл, бизнест өгсөн үнэ цэнийг холбо.`,
        `Асуулт: ${topSkills} ашиглах үед гарсан хүндрэл, trade-off-оо тайлбарлана уу.\nХариултын санаа: Сонгосон шийдэл, яагаад сонгосон шалтгаан, дараа нь юу сайжруулах байснаа хэл.`,
      ],
      hr: [
        `Асуулт: Яагаад ${role} чиглэлд ажиллахыг хүсэж байна вэ?\nХариултын санаа: Карьерын зорилго, одоогийн ур чадвар, тухайн байгууллагад өгөх үнэ цэнээ товч холбо.`,
        `Асуулт: Таны хамгийн хүчтэй давуу тал юу вэ?\nХариултын санаа: Ерөнхий чанар биш, нэг бодит жишээ, хийсэн үйлдэл, үр дүнгээр батал.`,
        `Асуулт: ${improvement}-ийг та хэрхэн сайжруулж байгаа вэ?\nХариултын санаа: Сул талаа хүлээн зөвшөөрөөд, аль хэдийн эхлүүлсэн тодорхой алхмаа хэл.`,
      ],
      behavioral: [
        `Асуулт: Deadline шахуу үед ажлаа хэрхэн эрэмбэлж байсан бэ?\nХариултын санаа: Нөхцөл байдал, сонгосон priority, бусадтай яаж ойлголцсон, эцсийн үр дүнг хэл.`,
        `Асуулт: Санал зөрөлдсөн багийн нөхцөл байдлыг яаж шийдсэн бэ?\nХариултын санаа: Нөгөө талын байр суурийг ойлгосон байдал, баримтаар ярьсан арга, тохиролцсон шийдлээ дурд.`,
        `Асуулт: Шинэ зүйл хурдан сурах шаардлагатай үед ямар арга хэрэглэдэг вэ?\nХариултын санаа: Сурах эх сурвалж, дадлага хийх арга, сурсан зүйлээ ажил дээр ашигласан жишээ хэл.`,
      ],
      suggestedAnswers: [
        'STAR бүтэц ашигла: Situation, Task, Action, Result. Хариулт бүр 60-90 секунд байхад тохиромжтой.',
        'Технологи, шийдвэрийн шалтгаан, хэмжигдэхүйц үр дүн гэсэн гурвыг боломжтой үед заавал оруул.',
        'Монгол хэлээр ярьж байгаа бол Latin-р бичсэн монгол үгээ Кириллээр цэгцтэй хэл. Харин технологи, компанийн нэр, certificate зэрэг жинхэнэ English нэршлийг хэвээр үлдээ.',
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

function normalizeInterview(input: any, fallback: InterviewPrep): InterviewPrep {
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

function buildRewrittenCv(payload: {
  fullName: string;
  targetRole: string;
  skills: string[];
  experienceLevel: string;
  language: Language;
}) {
  if (payload.language === 'mn') {
    return [
      payload.fullName.toUpperCase(),
      `${payload.targetRole} чиглэлд нэр дэвшигч`,
      '',
      'МЭРГЭЖЛИЙН ТОВЧ ТАНИЛЦУУЛГА',
      `${payload.experienceLevel} түвшний ${payload.targetRole} чиглэлд ажиллах зорилготой. ${payload.skills.join(', ') || 'холбогдох ур чадвар'} дээр суурилсан туршлагатай бөгөөд бодит үр дүн гаргах, хурдан суралцах, багийн зорилгод хувь нэмэр оруулахад төвлөрдөг.`,
      '',
      'ГОЛ УР ЧАДВАР',
      payload.skills.join(' | ') || 'Зорилтот ажилд тохирох ур чадваруудаа нэмнэ үү',
      '',
      'ТУРШЛАГЫН ОНЦЛОХ ХЭСЭГ',
      '- Ажлын болон төслийн bullet бүрийг хүчтэй үйл үгээр эхлүүлнэ.',
      '- Хурд, чанар, хэрэглэгч, орлого, зардал зэрэг хэмжигдэхүйц үзүүлэлтээр амжилтаа баталгаажуулна.',
      `- Амжилтуудаа ${payload.targetRole} албан тушаалын шаардлага, түлхүүр үгстэй уялдуулна.`,
    ].join('\n');
  }

  return [
    payload.fullName.toUpperCase(),
    `${payload.targetRole} Candidate`,
    '',
    'PROFESSIONAL SUMMARY',
    `${payload.experienceLevel} candidate targeting ${payload.targetRole} opportunities with experience across ${payload.skills.join(', ') || 'relevant technical and professional skills'}. Focused on delivering practical results, learning quickly, and contributing to high-impact teams.`,
    '',
    'CORE SKILLS',
    payload.skills.join(' | ') || 'Add role-specific technical and soft skills here',
    '',
    'EXPERIENCE HIGHLIGHTS',
    '- Rework each role bullet to begin with a strong action verb.',
    '- Add quantified impact such as revenue, speed, quality, or user growth improvements.',
    `- Tailor accomplishments to ${payload.targetRole} expectations and hiring keywords.`,
  ].join('\n');
}

function normalizeRequest(body: any) {
  const years = Number(body.experienceYears || body.years || 0);
  return {
    fullName: String(body.fullName || body.candidateName || body.personInfo?.name || 'Candidate').trim() || 'Candidate',
    targetRole: String(body.targetRole || body.jobGoal || 'Generalist').trim() || 'Generalist',
    careerGoals: String(body.careerGoals || body.jobGoal || '').trim(),
    experienceYears: Number.isFinite(years) && years >= 0 ? years : 0,
    language: getLanguage(body.language),
  };
}

async function parseUploadedFile(file: any) {
  if (!file) return '';
  const name = String(file.originalname || '').toLowerCase();

  if (file.mimetype === 'text/plain' || name.endsWith('.txt')) {
    return String(file.buffer.toString('utf8')).trim();
  }

  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
    const parsed = await mammoth.extractRawText({buffer: file.buffer});
    return String(parsed.value || '').trim();
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
    candidateName: {type: 'string'},
    targetRole: {type: 'string'},
    skills: {type: 'array', items: {type: 'string'}},
    experienceLevel: {type: 'string'},
    atsScore: {type: 'integer'},
    weakPoints: {type: 'array', items: {type: 'string'}},
    missingSkills: {type: 'array', items: {type: 'string'}},
    careerRecommendations: {type: 'array', items: {type: 'string'}},
    cvImprovementSuggestions: {type: 'array', items: {type: 'string'}},
    rewrittenCv: {type: 'string'},
    summary: {type: 'string'},
    interview: {
      type: 'object',
      additionalProperties: false,
      required: ['technical', 'hr', 'behavioral', 'suggestedAnswers'],
      properties: {
        technical: {type: 'array', items: {type: 'string'}},
        hr: {type: 'array', items: {type: 'string'}},
        behavioral: {type: 'array', items: {type: 'string'}},
        suggestedAnswers: {type: 'array', items: {type: 'string'}},
      },
    },
  },
};

function normalizeAnalysis(input: any, language: Language, source: string): CareerAnalysis {
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
      provider: input.metadata?.provider === 'openai' ? 'openai' : 'simulated',
      source,
      language,
      fallbackReason: input.metadata?.fallbackReason,
    },
  };
}

function buildSimulatedAnalysis(request: ReturnType<typeof normalizeRequest>, cvText: string, source: string): CareerAnalysis {
  const skills = detectSkills(cvText);
  const baseLevel = inferExperienceLevel(cvText, request.experienceYears);
  const experienceLevel = request.language === 'mn'
    ? baseLevel === 'Senior' ? 'Ахисан түвшин' : baseLevel === 'Mid-Level' ? 'Дунд түвшин' : 'Анхан шат'
    : baseLevel;
  const weakPoints = findWeakPoints(cvText, skills, request.language);
  const missingSkills = findMissingSkills(cvText, request.targetRole, skills).slice(0, 8);
  const atsScore = estimateAtsScore(cvText, skills, weakPoints, request.targetRole, request.experienceYears);

  return normalizeAnalysis({
    candidateName: request.fullName,
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
    rewrittenCv: buildRewrittenCv({...request, skills, experienceLevel}),
    summary: request.language === 'mn'
      ? `${request.fullName} нь ${request.targetRole} чиглэлд ${experienceLevel.toLowerCase()} түвшний нэр дэвшигч бөгөөд CV дээрээс ${skills.length} гол ур чадвар илэрлээ.`
      : `${request.fullName} appears to be a ${experienceLevel.toLowerCase()} candidate for ${request.targetRole} with ${skills.length} identifiable skill areas in the CV.`,
    interview: buildInterviewPrep({
      targetRole: request.targetRole,
      skills,
      missingSkills,
      cvImprovementSuggestions: request.language === 'mn'
        ? ['CV-ийн ажлын туршлага, ур чадвар, амжилтын хэсгийг илүү тодорхой болгох']
        : ['Make the CV experience, skills, and achievements more specific'],
    }, request.language),
    metadata: {provider: 'simulated'},
  }, request.language, source);
}

async function requestOpenAiAnalysis(request: ReturnType<typeof normalizeRequest>, cvText: string, source: string): Promise<CareerAnalysis | null> {
  if (!process.env.OPENAI_API_KEY) return null;

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
        'The rewrittenCv field must be an export-ready improved CV, not advice about how to improve the CV.',
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

    if (!response.ok) return null;
    const data = await response.json();
    const outputText = typeof data.output_text === 'string'
      ? data.output_text
      : (data.output || [])
          .flatMap((item: any) => item.content || [])
          .filter((item: any) => item.type === 'output_text' && item.text)
          .map((item: any) => item.text)
          .join('\n');

    if (!outputText) return null;
    const parsed = JSON.parse(outputText);
    return normalizeAnalysis({...parsed, metadata: {provider: 'openai'}}, request.language, source);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeCvPayload(req: Request) {
  const request = normalizeRequest(req.body);
  const fileText = await parseUploadedFile((req as any).file);
  const cvText = fileText || String(req.body.cvText || req.body.cvContent || req.body.rawText || '').trim();
  const source = (req as any).file ? 'file-upload' : 'text-input';

  if (!cvText) throw new ApiError('CV_REQUIRED', 'Please upload a CV file or paste CV text.');
  if (cvText.length > Number(process.env.CV_TEXT_MAX_LENGTH || 40000)) {
    throw new ApiError('CV_TOO_LARGE', 'CV text is too large.', 413);
  }

  const openAiResult = await requestOpenAiAnalysis(request, cvText, source);
  const result = openAiResult || buildSimulatedAnalysis(request, cvText, source);
  if (!openAiResult && process.env.OPENAI_API_KEY) result.metadata.fallbackReason = 'OPENAI_FALLBACK';

  const user = getAuthUser(req);
  if (user) {
    const db = readDb();
    const historyItem: HistoryItem = {
      id: randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      request,
      result,
    };
    db.histories.unshift(historyItem);
    db.histories = db.histories.slice(0, 200);
    writeDb(db);
  }

  return result;
}

function toDashboardAnalysis(result: CareerAnalysis) {
  const scores = [
    {key: 'atsScore', label: 'ATS score', value: result.atsScore, explanation: 'ATS readiness based on structure, keywords, and measurable impact.', confidence: 0.9},
    {key: 'readability', label: 'Readability', value: Math.min(100, result.atsScore + 3), explanation: result.summary, confidence: 0.86},
    {key: 'skillsMatch', label: 'Skill match', value: Math.max(35, result.atsScore - result.missingSkills.length * 3), explanation: 'Estimated fit for the target role skills.', confidence: 0.84},
    {key: 'experience', label: 'Experience', value: result.experienceLevel.toLowerCase().includes('senior') ? 88 : result.experienceLevel.toLowerCase().includes('mid') ? 80 : 70, explanation: result.experienceLevel, confidence: 0.82},
    {key: 'grammar', label: 'Grammar', value: 90, explanation: 'Professional tone and grammar check baseline.', confidence: 0.8},
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
      original: result.weakPoints[index] || 'CV section needs improvement',
      suggestion,
      explanation: 'Improves ATS alignment and recruiter readability.',
      accepted: false,
    })),
    interview: result.interview,
    career: {
      currentLevel: result.experienceLevel,
      recommendedRoles: result.careerRecommendations.slice(0, 3),
      missingSkills: result.missingSkills,
      roadmap: result.cvImprovementSuggestions,
      estimatedDuration: '3-6 months',
    },
  };
}

function drawBullets(doc: any, title: string, items: string[]) {
  doc.moveDown(0.8).fontSize(13).fillColor('#1d4ed8').text(title);
  doc.moveDown(0.3).fontSize(10.5).fillColor('#162033');
  (items.length ? items : ['Not provided']).forEach((item) => doc.text(`• ${item}`, {indent: 10, paragraphGap: 4}));
}

function getPdfFontPath() {
  return [
    'C:\\Windows\\Fonts\\arial.ttf',
    'C:\\Windows\\Fonts\\segoeui.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
  ].find((candidate) => fs.existsSync(candidate));
}

function createAnalysisPdf(result: CareerAnalysis) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 48,
    bufferPages: true,
    info: {
      Title: `${result.candidateName} Improved CV`,
      Author: 'AI Career Advisor',
    },
  });
  const chunks: Buffer[] = [];
  const fontPath = getPdfFontPath();
  if (fontPath) {
    doc.registerFont('Regular', fontPath);
    doc.font('Regular');
  }
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  doc.fillColor('#1d4ed8').fontSize(10).text('IMPROVED CV', {characterSpacing: 0.8});
  doc.moveDown(0.35).fillColor('#162033').fontSize(24).text(result.candidateName || 'Candidate');
  doc.fontSize(12).fillColor('#667085').text(result.targetRole || '');
  doc
    .moveTo(doc.page.margins.left, doc.y + 12)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 12)
    .strokeColor('#d9e2ef')
    .lineWidth(1)
    .stroke();
  doc.moveDown(1.4).fontSize(10.5).fillColor('#162033').text(result.rewrittenCv, {
    lineGap: 3,
    paragraphGap: 5,
  });

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.fontSize(8).fillColor('#98a2b3').text(`Improved CV generated by AI Career Advisor - Page ${index + 1}`, 48, doc.page.height - 34, {
      align: 'center',
      width: doc.page.width - 96,
    });
  }

  return new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.end();
  });
}

app.get('/api/health', (_req, res) => {
  success(res, {
    status: 'ok',
    api: 'AI Career Advisor',
    aiProvider: process.env.OPENAI_API_KEY ? 'openai' : 'simulated',
    uptimeMs: Math.round(process.uptime() * 1000),
  });
});

const registerUser = asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const fullName = String(req.body.fullName || req.body.name || '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('EMAIL_REQUIRED', 'A valid email is required.');
  if (!fullName) throw new ApiError('FULL_NAME_REQUIRED', 'Full name is required.');
  if (password.length < 6) throw new ApiError('PASSWORD_TOO_SHORT', 'Password must be at least 6 characters.');

  const db = readDb();
  if (db.users.some((user) => user.email === email)) throw new ApiError('EMAIL_IN_USE', 'An account with this email already exists.', 409);

  const user: User = {
    id: randomUUID(),
    email,
    fullName,
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    preferredLanguage: getLanguage(req.body.language),
    createdAt: new Date().toISOString(),
  };
  const {token, tokenId, expiresAt} = createToken(user);
  db.users.push(user);
  db.sessions.push({tokenId, userId: user.id, createdAt: new Date().toISOString(), expiresAt});
  writeDb(db);
  res.status(201).json({token, user: sanitizeUser(user)});
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

  const {token, tokenId, expiresAt} = createToken(user);
  db.sessions = db.sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());
  db.sessions.push({tokenId, userId: user.id, createdAt: new Date().toISOString(), expiresAt});
  writeDb(db);
  res.json({token, user: sanitizeUser(user)});
}));

app.get('/api/auth/me', (req, res) => {
  const user = requireAuth(req);
  res.json({user: sanitizeUser(user)});
});

app.post('/api/auth/logout', (req, res) => {
  const token = getBearerToken(req);
  const payload = token ? verifyToken(token) : null;
  if (payload?.jti) {
    const db = readDb();
    db.sessions = db.sessions.filter((session) => session.tokenId !== payload.jti);
    writeDb(db);
  }
  res.json({success: true});
});

app.post('/api/career/analyze', upload.single('cvFile'), asyncRoute(async (req, res) => {
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
  res.json({history: db.histories.filter((item) => item.userId === user.id)});
});

app.post('/api/career/export-pdf', asyncRoute(async (req, res) => {
  const raw = req.body.result || req.body.analysis || req.body;
  const result = normalizeAnalysis({
    candidateName: raw.candidateName || 'Candidate',
    targetRole: raw.targetRole || 'Generalist',
    skills: raw.skills || raw.keywords?.recommended || [],
    experienceLevel: raw.experienceLevel || raw.career?.currentLevel || 'Unknown',
    atsScore: raw.atsScore || raw.scores?.find?.((item: any) => item.key === 'atsScore')?.value || raw.scores?.atsScore?.score || 0,
    weakPoints: raw.weakPoints || raw.weaknesses || [],
    missingSkills: raw.missingSkills || raw.keywords?.missing || raw.career?.missingSkills || [],
    careerRecommendations: raw.careerRecommendations || raw.career?.recommendedRoles || [],
    cvImprovementSuggestions: raw.cvImprovementSuggestions || raw.feedback?.map?.((item: any) => item.suggestion) || [],
    rewrittenCv: raw.rewrittenCv || raw.improved_cv || raw.improvedCv || '',
    summary: raw.summary || 'Improved CV export.',
    interview: raw.interview,
    metadata: {provider: 'simulated'},
  }, getLanguage(req.body.language), 'export');
  if (!result.rewrittenCv.trim()) {
    throw new ApiError('REWRITTEN_CV_REQUIRED', 'No improved CV is available to export.', 400);
  }
  const pdf = await createAnalysisPdf(result);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${result.candidateName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'candidate'}-improved-cv.pdf"`);
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

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({server: {middlewareMode: true}, appType: 'spa'});
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    const apiError = error instanceof ApiError ? error : new ApiError('INTERNAL_ERROR', 'Unexpected server error.', 500);
    if (process.env.NODE_ENV !== 'production') console.error(`[${apiError.code}] ${apiError.message}`);
    res.status(apiError.statusCode).json({success: false, error: {code: apiError.code, message: apiError.message}});
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error: Error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
